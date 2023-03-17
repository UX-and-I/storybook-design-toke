import React, { useMemo, useState } from 'react';

import {
  Button,
  Icons,
  TooltipMessage,
  TooltipNote,
  WithTooltip
} from '@storybook/components';
import { styled } from '@storybook/theming';

import { Category } from '../types/category.types';
import { Token } from '../types/token.types';
import { ClipboardButton } from './ClipboardButton';
import { PresenterMapType, TokenPreview } from './TokenPreview';
import { TokenValue } from './TokenValue';
import { ToolButton } from './ToolButton';

interface TokenCardsProps {
  categories: Category[];
  padded?: boolean;
  readonly?: boolean;
  showValueColumn?: boolean;
  pageSize?: number;
  presenters: PresenterMapType;
}

export const TokenCards = ({
  categories,
  padded = true,
  readonly,
  showValueColumn = true,
  pageSize = 50,
  presenters
}: TokenCardsProps) => {
  const [tokenValueOverwrites, setTokenValueOverwrites] = useState<{
    [tokenName: string]: any;
  }>({});

  const [page, setPage] = useState(0);

  const Container = useMemo(
    () =>
      styled.div(() => ({
        display: 'grid',
        columnGap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        padding: padded ? 15 : undefined,
        rowGap: 12
      })),
    []
  );

  const Card = useMemo(
    () =>
      styled.div(({ theme }) => ({
        boxShadow:
          'rgb(0 0 0 / 10%) 0px 1px 3px 1px, rgb(0 0 0 / 7%) 0px 0px 0px 1px',
        borderRadius: 4,
        color: theme.color.defaultText,
        fontFamily: theme.typography.fonts.base,
        fontSize: theme.typography.size.s1,
        padding: 12,
        overflow: 'hidden',

        ':hover': {
          backgroundColor: 'rgba(0,0,0, 0.1)',
        },

        '> *:not(:last-child)': {
          marginBottom: 8
        },

        svg: {
          maxWidth: '100%',
          maxHeight: '100%'
        }
      })),
    []
  );

  const Pagination = useMemo(
    () =>
      styled.div(({ theme }) => ({
        alignItems: 'center',
        color: theme.color.defaultText,
        display: 'flex',
        fontFamily: theme.typography.fonts.base,
        fontSize: theme.typography.size.s1,
        justifyContent: 'space-between',
        paddingRight: padded ? 15 : undefined,
        paddingBottom: padded ? 48 : undefined,
        paddingLeft: padded ? 15 : undefined,
        marginTop: 8,

        '& > div': {
          display: 'flex',
          gap: 8
        }
      })),
    []
  );

  const tokens = useMemo(
    () =>
      categories.reduce(
        (tokens, category) => [...tokens, ...category.tokens],
        [] as Token[]
      ),
    [categories]
  );

  const pages = useMemo(() => Math.ceil(tokens.length / pageSize), [tokens]);

  return (
    <>
      <Container>
        {tokens
          .slice(page * pageSize, page * pageSize + pageSize)
          .map((token, index) => (
            <Card key={token.name + '-card-' + index}>
              {token.name}

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

              {showValueColumn && (
                <TokenValue
                  onValueChange={(newValue) => {
                    setTokenValueOverwrites((tokenValueOverwrites) => ({
                      ...tokenValueOverwrites,
                      [token.name]:
                        newValue === token.rawValue ? undefined : newValue
                    }));
                  }}
                  readonly={readonly}
                  token={token}
                />
              )}

              <TokenPreview
                presenters={presenters}
                token={{
                  ...token,
                  value: tokenValueOverwrites[token.name] || token.value
                }}
              />
            </Card>
          ))}
      </Container>

      {pages > 1 && (
        <Pagination>
          <span>
            Page {page + 1} of {pages}
          </span>
          <div>
            <Button
              disabled={page === 0}
              onClick={() => setPage((page) => Math.max(0, page - 1))}
              tertiary
              small
            >
              Previous page
            </Button>
            <Button
              disabled={page >= pages - 1}
              onClick={() => setPage((page) => Math.min(page + 1, pages - 1))}
              tertiary
              small
            >
              Next page
            </Button>
          </div>
        </Pagination>
      )}
    </>
  );
};
