import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
import { darkTheme, lightTheme } from './theme';
const ThemeContext = createContext({
    theme: darkTheme,
    themeName: 'dark',
    setTheme: () => { },
    toggleTheme: () => { },
});
export const useTheme = () => useContext(ThemeContext);
export const ThemeProvider = ({ children, defaultTheme = 'dark', }) => {
    const [themeName, setThemeName] = useState(defaultTheme);
    const theme = themeName === 'light' ? lightTheme : darkTheme;
    const setTheme = useCallback((name) => {
        setThemeName(name);
    }, []);
    const toggleTheme = useCallback(() => {
        setThemeName((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);
    return (_jsx(ThemeContext.Provider, { value: { theme, themeName, setTheme, toggleTheme }, children: _jsx("div", { style: {
                width: '100%',
                height: '100%',
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontFamily: theme.fonts.sans,
                fontSize: 13,
            }, children: children }) }));
};
//# sourceMappingURL=ThemeProvider.js.map