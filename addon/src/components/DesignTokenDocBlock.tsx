import React, { useContext, useMemo } from 'react';

import { DocsContext, DocsContextProps } from '@storybook/addon-docs';
import { styled } from '@storybook/theming';

import { useTokenTabs } from '../hooks/useTokenTabs';
import type { TokenViewType } from './TokenTab';
import { TokenTable } from './TokenTable';
import { TokenCards } from './TokenCards';
import { useTokenSearch } from '../hooks/useTokenSearch';
import { SearchField } from './SearchField';
import { Category } from '../types/category.types';
import { PresenterMapType } from './TokenPreview';

export interface DesignTokenDocBlockProps {
  categoryName: string;
  maxHeight?: number;
  showValueColumn?: boolean;
  viewType: TokenViewType;
  /**
   * @default true
   */
  showSearch?: boolean;
  pageSize?: number;
  presenters: PresenterMapType;
}

interface CompatDocsContextProps extends DocsContextProps {
  storyById?: (id: string) => any;
}

/**
 * Storybook 6.4 changed the DocsContextProps interface.
 * This is a compatibility method to get docs parameters across Storybook versions.
 */
function getMainStory(context: CompatDocsContextProps) {
  return typeof context.storyById === 'function'
    ? context.storyById(context.id!)
    : context;
}

const Container = styled.div(() => ({
  margin: '25px 0 40px',

  '*': {
    boxSizing: 'border-box'
  }
}));

const Card = styled.div(() => ({
  boxShadow:
    'rgb(0 0 0 / 10%) 0px 1px 3px 1px, rgb(0 0 0 / 7%) 0px 0px 0px 1px',
  borderRadius: 4
}));

export const DesignTokenDocBlock = ({
  categoryName,
  maxHeight = 600,
  showValueColumn = true,
  viewType = 'table',
  showSearch = true,
  pageSize,
  presenters,
}: DesignTokenDocBlockProps) => {
  const context = useContext(DocsContext);
  const story = getMainStory(context);
  const { tabs } = useTokenTabs(story.parameters.designToken);

  const tab = useMemo(() => tabs.find((t) => t.label === categoryName), [
    categoryName,
    tabs
  ]);

  if (!tab) {
    return null;
  }

  return (
    <DesignTokenDocBlockView
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
  extends Omit<DesignTokenDocBlockProps, 'categoryName'> {
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
  presenters
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
            console.log(value);
            setSearchText(value);
          }}
          style={{ margin: '12px 0' }}
        />
      )}
      {viewType === 'table' && (
        <Card className="design-token-card">
          <TokenTable
            categories={categories}
            maxHeight={maxHeight}
            readonly
            showValueColumn={showValueColumn}
            presenters={presenters}
          />
        </Card>
      )}
      {viewType === 'card' && (
        <TokenCards
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
