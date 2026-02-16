import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
export const Tabs = ({ tabs, activeTab, onTabChange, style }) => {
    const { theme } = useTheme();
    return (_jsx("div", { style: {
            display: 'flex',
            gap: 0,
            borderBottom: `2px solid ${theme.colors.border}`,
            ...style,
        }, children: tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (_jsxs("button", { onClick: () => onTabChange(tab.id), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                    marginBottom: -2,
                    background: isActive ? theme.colors.surfaceHover : 'transparent',
                    color: isActive ? theme.colors.text : theme.colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: theme.fonts.sans,
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                }, onMouseEnter: (e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                            theme.colors.surfaceHover;
                    }
                }, onMouseLeave: (e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }, children: [tab.icon, tab.label] }, tab.id));
        }) }));
};
export default Tabs;
//# sourceMappingURL=Tabs.js.map