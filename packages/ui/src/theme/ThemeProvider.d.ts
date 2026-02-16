import React, { ReactNode } from 'react';
import { Theme } from './theme';
interface ThemeContextValue {
    theme: Theme;
    themeName: string;
    setTheme: (name: string) => void;
    toggleTheme: () => void;
}
export declare const useTheme: () => ThemeContextValue;
interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: string;
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export {};
//# sourceMappingURL=ThemeProvider.d.ts.map