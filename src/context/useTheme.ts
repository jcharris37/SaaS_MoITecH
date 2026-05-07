import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextProps } from './ThemeContext';

export const useTheme = (): ThemeContextProps => {
  return useContext(ThemeContext);
};