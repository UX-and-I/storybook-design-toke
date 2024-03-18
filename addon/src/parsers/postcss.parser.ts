import postcss, { AtRule, Comment, Declaration, Plugin } from "postcss";
import scss from "postcss-scss";

import { Category, CategoryRange } from "../types/category.types";
import { File } from "../types/config.types";
import { Token, TokenPresenter, TokenSourceType } from "../types/token.types";

export async function parseCssFiles(
  files: File[] = [],
  sourceType: TokenSourceType,
  injectVariables?: boolean,
  preserveCSSVars?: boolean
): Promise<{ categories: Category[]; injectionStyles: string }> {
  const relevantFiles = files.filter(
    (file, index, files) =>
      file.content &&
      !files.some((f, i) => f.content === file.content && i < index)
  );

  const nodes = await getNodes(relevantFiles.filter((file) => file.content));

  const categories = determineCategories(
    nodes.comments,
    nodes.declarations,
    sourceType,
    preserveCSSVars
  );

  let injectionStyles = nodes?.keyframes.map((k) => k.toString()).join(" ");

  if (injectVariables) {
    injectionStyles =
      injectionStyles +
      `:root {
        ${nodes.declarations
          .map((declaration) => declaration.toString())
          .join(";")}
      }`;
  }

  return { categories, injectionStyles };
}

function determineCategories(
  comments: Comment[],
  declarations: Declaration[],
  sourceType: TokenSourceType,
  preserveCSSVars?: boolean
): Category[] {
  const categoryComments = comments.filter(
    (comment) =>
      comment.text.includes("@tokens ") || comment.text.includes("@tokens-end")
  );

  return categoryComments
    .map<Category | undefined>((comment, index) => {
      if (comment.text.includes("@tokens-end")) {
        return undefined;
      }

      const nextComment = categoryComments[index + 1];
      const nextCommentIsInAnotherFile =
        comment.source?.input.file !== nextComment?.source?.input.file;
      const nameResults = /@tokens (.+)/g.exec(comment.text);
      const presenterResults = /@presenter (.+)/g.exec(comment.text);

      const presenter: TokenPresenter = presenterResults?.[1] as TokenPresenter;

      if (
        presenter &&
        !Object.values(TokenPresenter).includes(
          (presenter || "") as TokenPresenter
        )
      ) {
        throw new Error(`Presenter "${presenter}" is not valid.`);
      }

      const range: CategoryRange = {
        from: {
          column: comment.source?.start?.column || 0,
          line: comment.source?.start?.line || 0,
        },
        to:
          !nextCommentIsInAnotherFile && nextComment?.prev()
            ? {
                column: nextComment.prev()?.source?.end?.column || 0,
                line: nextComment.prev()?.source?.end?.line || 0,
              }
            : !nextCommentIsInAnotherFile && nextComment
            ? {
                column: nextComment.source?.start?.column || 0,
                line: nextComment.source?.start?.line || 0,
              }
            : undefined,
      };

      const source = comment.source?.input.from || "";

      return {
        name: nameResults?.[1] || "",
        presenter,
        range,
        source,
        tokens: determineTokensForCategory(
          source,
          range,
          declarations,
          comments,
          sourceType,
          presenter,
          preserveCSSVars
        ),
      };
    })
    .filter<Category>(isCategory);
}

function determineTokensForCategory(
  source: string,
  range: CategoryRange,
  declarations: Declaration[],
  comments: Comment[],
  sourceType: TokenSourceType,
  presenter: TokenPresenter,
  preserveCSSVars?: boolean
): Token[] {
  const declarationsWithinRange = declarations.filter(
    (declaration) =>
      declaration.source?.input.from === source &&
      (declaration.source?.start?.line || -1) > range.from.line &&
      (!range.to || (declaration.source?.start?.line || -1) <= range.to.line)
  );

  return declarationsWithinRange
    .map((declaration) => {
      const description = comments.find(
        (comment) =>
          comment.source?.input.file === declaration.source?.input.file &&
          comment.source?.start?.line === declaration.source?.end?.line
      );

      const value = determineTokenValue(
        declaration.value,
        declarations,
        preserveCSSVars
      );
      let presenterToken: TokenPresenter | undefined;

      if (description) {
        const presenterResultsToken = /@presenter (.+)/g.exec(description.text);

        if (presenterResultsToken) {
          presenterToken = presenterResultsToken[1] as TokenPresenter;
          description.text = description.text.replace(
            presenterResultsToken[0] || "",
            ""
          );
        }
      }

      return {
        description: description?.text,
        isAlias: value !== declaration.value,
        name: declaration.prop,
        presenter: presenterToken || presenter,
        rawValue: declaration.value,
        sourceType,
        value,
      };
    })
    .slice()
    .reverse()
    .filter(
      (token, index, tokens) =>
        index === tokens.findIndex((t) => t.name === token.name)
    )
    .reverse();
}

function determineTokenValue(
  rawValue: string,
  declarations: Declaration[],
  preserveCSSVars?: boolean
): string {
  rawValue = rawValue.replace(/!default/g, "").replace(/!global/g, "");

  const regex = /\bvar\(([^)]+)\)|(\$[a-zA-Z0-9-_]+|@[a-zA-Z0-9-_]+)/g;
  let match;
  let replacedString = rawValue;
  while ((match = regex.exec(rawValue)) !== null) {
    const variableMatch = match[0];
    const variableName = variableMatch.replace(/\(|\)|var\(|@|\$/g, "");
    const replacement =
      declarations.find(
        (declaration) =>
          declaration.prop === variableName ||
          declaration.prop === `$${variableName}` ||
          declaration.prop === `@${variableName}`
      )?.value || "";

    replacedString = replacedString.replace(variableMatch, replacement);
  }

  return replacedString;
}

async function getNodes(files: File[]): Promise<{
  comments: Comment[];
  declarations: Declaration[];
  keyframes: AtRule[];
}> {
  const comments: Comment[] = [];
  const declarations: Declaration[] = [];
  const keyframes: AtRule[] = [];

  const plugin: Plugin = {
    postcssPlugin: "storybook-design-token-parser",
    Once(root) {
      root.walkAtRules((atRule) => {
        if (atRule.name === "keyframes") {
          keyframes.push(atRule);
          return;
        }

        const variableAtRule = atRule;

        if (variableAtRule.name.endsWith(":")) {
          declarations.push({
            ...variableAtRule,
            prop: `@${variableAtRule.name.substr(
              0,
              variableAtRule.name.length - 1
            )}`,
            value: variableAtRule.params,
          } as any);
        }
      });

      root.walkComments((comment) => {
        comments.push(comment);
      });

      root.walkDecls((declaration) => {
        if (
          declaration.prop.startsWith("--") ||
          declaration.prop.startsWith("$")
        ) {
          declarations.push(declaration);
        }
      });
    },
  };

  await Promise.all(
    files.map((file) => {
      const syntax: any =
        file.filename.endsWith(".scss") || file.filename.endsWith(".less")
          ? scss
          : undefined;

      return postcss([plugin]).process(file.content, {
        from: file.filename,
        syntax,
      });
    })
  );

  return { comments, declarations, keyframes };
}

function isCategory(object: any): object is Category {
  return !!object && object.hasOwnProperty("presenter");
}
