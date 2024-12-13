import React from "react";
import { useMemo } from "react";
import { styled } from "@storybook/theming";
import { useTokenSearch } from "../hooks/useTokenSearch";
import { useTokenTabs } from "../hooks/useTokenTabs";
import { Category } from "../types/category.types";
import { SearchField } from "./SearchField";
import { TokenCards } from "./TokenCards";
import { TokenTable } from "./TokenTable";
import type { TokenViewType } from "./TokenTab";
import { PresenterMapType } from "./TokenPreview";

export interface DesignTokenDocBlockProps {
  categoryName: string;
  maxHeight?: number;
  showValueColumn?: boolean;
  viewType: TokenViewType;
  filterNames?: string[];
  /**
   * @default true
   */
  showSearch?: boolean;
  pageSize?: number;
  presenters?: PresenterMapType;
}

const Container = styled.div(() => ({
  margin: "25px 0 40px",

  "*": {
    boxSizing: "border-box",
  },
}));

const Card = styled.div(() => ({
  boxShadow:
    "rgb(0 0 0 / 10%) 0px 1px 3px 1px, rgb(0 0 0 / 7%) 0px 0px 0px 1px",
  borderRadius: 4,
}));

export const DesignTokenDocBlock = ({
  filterNames,
  categoryName,
  maxHeight = 600,
  showValueColumn = true,
  viewType = "table",
  showSearch = true,
  pageSize,
  presenters,
}: DesignTokenDocBlockProps) => {
  const { tabs } = useTokenTabs({ pageSize, showSearch, presenters });

  const tab = useMemo(
    () => tabs.find((t) => t.label === categoryName),
    [categoryName, tabs]
  );

  if (!tab) {
    return null;
  }

  return (
    <DesignTokenDocBlockView
      filterNames={filterNames}
      categories={tab.categories}
      viewType={viewType}
      maxHeight={maxHeight}
      showValueColumn={showValueColumn}
      showSearch={showSearch}
      pageSize={pageSize}
      presenters={presenters}
    />
  );
};

interface DesignTokenDocBlockViewProps
  extends Omit<DesignTokenDocBlockProps, "categoryName"> {
  categories: Category[];
}
/**
 * NOTE: Every searchText change causes full page mount/unmount, so input loses focus after input of every next character.
 * So the aim of DesignTokenDocBlockView component prevent re-renders, as it contains searchText change inside.
 */
function DesignTokenDocBlockView({
  viewType,
  categories: categoriesProp,
  maxHeight,
  showValueColumn,
  showSearch,
  pageSize,
  presenters,
  filterNames,
}: DesignTokenDocBlockViewProps) {
  const { searchText, setSearchText, categories } = useTokenSearch(
    categoriesProp ?? []
  );

  return (
    <Container className="design-token-container">
      {showSearch && (
        <SearchField
          value={searchText}
          onChange={(value) => {
            setSearchText(value);
          }}
          style={{ margin: "12px 0" }}
        />
      )}
      {viewType === "table" && (
        <Card className="design-token-card">
          <TokenTable
            categories={categories}
            maxHeight={maxHeight}
            readonly
            showValueColumn={showValueColumn}
            presenters={presenters}
            filterNames={filterNames}
          />
        </Card>
      )}
      {viewType === "card" && (
        <TokenCards
          filterNames={filterNames}
          categories={categories}
          padded={false}
          readonly
          showValueColumn={showValueColumn}
          pageSize={pageSize}
          presenters={presenters}
        />
      )}
    </Container>
  );
}
