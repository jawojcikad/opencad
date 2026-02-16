import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
import { SplitPane } from '../common/SplitPane';
export const Layout = ({ toolbar, leftPanel, center, rightPanel, statusBar, showLeft, showRight, }) => {
    const { theme } = useTheme();
    const mainContent = (() => {
        if (showLeft && showRight && leftPanel && rightPanel) {
            return (_jsx(SplitPane, { direction: "horizontal", initialSplit: 18, minSize: 180, left: leftPanel, right: _jsx(SplitPane, { direction: "horizontal", initialSplit: 78, minSize: 200, left: center, right: rightPanel }) }));
        }
        if (showLeft && leftPanel) {
            return (_jsx(SplitPane, { direction: "horizontal", initialSplit: 20, minSize: 180, left: leftPanel, right: center }));
        }
        if (showRight && rightPanel) {
            return (_jsx(SplitPane, { direction: "horizontal", initialSplit: 78, minSize: 200, left: center, right: rightPanel }));
        }
        return center;
    })();
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: theme.colors.background,
        }, children: [toolbar, _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: mainContent }), statusBar] }));
};
export default Layout;
//# sourceMappingURL=Layout.js.map