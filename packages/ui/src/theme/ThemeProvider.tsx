import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Theme, darkTheme, lightTheme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  themeName: string;
  setTheme: (name: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  themeName: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark',
}) => {
  const [themeName, setThemeName] = useState(defaultTheme);

  const theme = themeName === 'light' ? lightTheme : darkTheme;

  const setTheme = useCallback((name: string) => {
    setThemeName(name);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeName((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, toggleTheme }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          fontFamily: theme.fonts.sans,
          fontSize: 13,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
