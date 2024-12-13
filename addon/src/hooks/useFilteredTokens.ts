import { useMemo } from "react";
import { Token } from "../types/token.types";
import { Category } from "../types/category.types";

export const useFilteredTokens = (
  categories: Category[],
  filterNames?: string[]
): Token[] => {
  return useMemo(() => {
    const allTokens = categories.flatMap((category) => category.tokens);

    const uniqueTokens = allTokens.filter(
      (token, index, self) =>
        self.findIndex((t) => t.name === token.name) === index &&
        (!filterNames || filterNames.includes(token.name))
    );

    return uniqueTokens;
  }, [categories, filterNames]);
};
