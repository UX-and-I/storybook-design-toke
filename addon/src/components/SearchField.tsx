import React, { useCallback } from 'react';
import { Icons } from '@storybook/components';
import { styled } from '@storybook/theming';
import { Input } from './Input';

const SearchHolder = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '&:focus-within svg': {
    color: theme.color.defaultText,
  },
}));

const SearchIcon = styled(Icons)(({ theme }) => ({
  width: 12,
  height: 12,
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1,
  pointerEvents: 'none',
  color: theme.textMutedColor,
}));

const ClearIcon = styled(Icons)(({ theme }) => ({
  width: 16,
  height: 16,
  padding: 4,
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  background: 'rgba(0,0,0,0.1)',
  borderRadius: 16,
  color: theme.color.defaultText,
  cursor: 'pointer',
}));

const SearchInput = styled(Input)(({ theme }) => ({
  paddingLeft: 28,
  paddingRight: 28, 
  height: 32
}));

interface SearchFieldProps {
  style?: React.CSSProperties;
  value: string;
  onChange: (value: string) => void;
}

export function SearchField({ value, onChange, style }: SearchFieldProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    onChange(e.target.value)
  }, [onChange]);

  const handleClear = useCallback(() => {
    () => onChange('');
  }, [onChange]);

  return (
    <SearchHolder style={style}>
      <SearchIcon icon="search" />
      <SearchInput value={value} onChange={handleChange} placeholder='Provide a token name'/>
      <ClearIcon icon="cross" onClick={handleClear} />
    </SearchHolder >
  )
}