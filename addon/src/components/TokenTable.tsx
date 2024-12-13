import React from "react";
import { transparentize } from "polished";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtual } from "react-virtual";
import {
  Icons,
  TooltipMessage,
  TooltipNote,
  WithTooltip,
} from "@storybook/components";
import { styled } from "@storybook/theming";
import { useFilteredTokens } from "../hooks/useFilteredTokens";

import { Category } from "../types/category.types";
import { Token } from "../types/token.types";
import { ClipboardButton } from "./ClipboardButton";
import { PresenterMapType, TokenPreview } from "./TokenPreview";
import { TokenValue } from "./TokenValue";
import { ToolButton } from "./ToolButton";

interface TokenTableProps {
  categories: Category[];
  maxHeight?: number;
  readonly?: boolean;
  showValueColumn?: boolean;
  presenters?: PresenterMapType;
  filterNames?: string[];
}

export const TokenTable = ({
  categories,
  maxHeight,
  readonly,
  showValueColumn = true,
  presenters,
  filterNames,
}: TokenTableProps) => {
  const [tokenValueOverwrites, setTokenValueOverwrites] = useState<{
    [tokenName: string]: any;
  }>({});

  const [panelHeight, setPanelHeight] = useState<number>(maxHeight || 100);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);

  const tokens = useFilteredTokens(categories, filterNames);

  const rowVirtualizer = useVirtual({
    size: tokens.length,
    parentRef,
    estimateSize: useCallback(() => 49, []),
  });

  const ScrollContainer = useMemo(
    () =>
      styled.div(() => ({
        maxHeight: panelHeight ? `${panelHeight + 30}px` : "none",
        overflow: "auto",
        padding: "15px",
      })),
    [panelHeight]
  );

  const Table = useMemo(
    () =>
      styled.table(({ theme }) => ({
        borderCollapse: "collapse",
        borderSpacing: 0,
        color: theme.color.defaultText,
        fontFamily: theme.typography.fonts.base,
        fontSize: theme.typography.size.s1,
        minWidth: 700,
        tableLayout: "fixed",
        textAlign: "left",
        width: "100%",

        "thead > tr": {
          display: "flex",
        },

        "tbody > tr": {
          borderTop: `1px solid ${theme.color.mediumlight}`,
          display: "flex",

          ":first-of-type": {
            borderTopColor: theme.color.medium,
          },

          ":last-of-type": {
            borderBottom: `1px solid ${theme.color.mediumlight}`,
          },

          ":hover": {
            backgroundColor: theme.background.hoverable,
          },
        },

        tr: {
          ":hover": {
            backgroundColor: "rgba(0,0,0, 0.1)",
          },
        },
        "td, th": {
          border: "none !important",
          textOverflow: "ellipsis",
          verticalAlign: "middle",

          ":nth-of-type(1)": {
            flexBasis: "50%",
            flexGrow: 1,
            flexShrink: 0,
          },

          ":nth-of-type(2)": {
            flexBasis: "25%",
            flexGrow: 0,
            flexShrink: 0,
          },

          ":nth-of-type(3)": {
            flexBasis: "25%",
            flexGrow: 0,
            flexShrink: 0,
          },
        },

        th: {
          color:
            theme.base === "light"
              ? transparentize(0.25, theme.color.defaultText)
              : transparentize(0.45, theme.color.defaultText),
          paddingBottom: 12,

          ":not(:first-of-type)": {
            paddingLeft: 15,
          },

          ":not(:last-of-type)": {
            paddingRight: 15,
          },

          ":last-of-type": {
            width: 200,
          },
        },

        td: {
          overflow: "hidden",
          paddingBottom: 8,
          paddingTop: 8,
          alignItems: "center",

          ":not(:first-of-type)": {
            paddingLeft: 15,
          },

          ":not(:last-of-type)": {
            paddingRight: 15,
          },

          svg: {
            maxWidth: "100%",
            maxHeight: "100%",
          },

          span: {
            alignItems: "center",
            display: "flex",
            height: "100%",
          },
        },
      })),
    []
  );

  const TokenName = styled.span(({ theme }) => ({
    fontFamily: theme.typography.fonts.mono,
    fontWeight: theme.typography.weight.bold,
    fontSize: theme.typography.size.s1,
  }));

  useLayoutEffect(() => {
    const container = document.querySelector("#storybook-panel-root");
    if (!container) {
      return;
    }

    const resizeHandler = () => {
      if (maxHeight !== undefined || !container) {
        return;
      }

      const vpHeight = window.innerHeight;
      const tableTop = parentRef.current?.getBoundingClientRect().top || 0;

      const height = vpHeight - tableTop - 40;

      setPanelHeight(height);
    };

    setTimeout(() => {
      resizeHandler();
    });

    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <ScrollContainer ref={parentRef}>
      <Table
        style={{
          height: `${
            rowVirtualizer.totalSize +
            (theadRef.current?.getBoundingClientRect().height || 0)
          }px`,
          position: "relative",
        }}
      >
        <thead
          className="docblock-argstable-head"
          ref={theadRef}
          style={{ height: "28px" }}
        >
          <tr>
            <th>Name</th>
            {showValueColumn && <th>Value</th>}
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const token = tokens[virtualRow.index];

            return (
              <tr
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${
                    virtualRow.start +
                    (theadRef.current?.getBoundingClientRect().height || 0)
                  }px)`,
                }}
              >
                <td>
                  <span>
                    <TokenName>{token.name}</TokenName>

                    <WithTooltip
                      hasChrome={false}
                      tooltip={<TooltipNote note="Copy to clipboard" />}
                    >
                      <ClipboardButton
                        button={
                          <ToolButton>
                            <Icons icon="copy" />
                          </ToolButton>
                        }
                        value={token.name}
                      />
                    </WithTooltip>

                    {token.description && (
                      <WithTooltip
                        tooltip={<TooltipMessage desc={token.description} />}
                      >
                        <ToolButton>
                          <Icons icon="info" />
                        </ToolButton>
                      </WithTooltip>
                    )}
                  </span>
                </td>
                {showValueColumn && (
                  <td>
                    <TokenValue
                      key={token.name}
                      onValueChange={(newValue) => {
                        setTokenValueOverwrites((tokenValueOverwrites) => ({
                          ...tokenValueOverwrites,
                          [token.name]:
                            newValue === token.rawValue ? undefined : newValue,
                        }));
                      }}
                      readonly={readonly}
                      token={token}
                    />
                  </td>
                )}
                <td>
                  <TokenPreview
                    presenters={presenters}
                    token={{
                      ...token,
                      value: tokenValueOverwrites[token.name] || token.value,
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </ScrollContainer>
  );
};
