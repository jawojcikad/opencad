import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';
const SAMPLE_NETS = [
    { id: 'n1', name: 'VCC', pinCount: 12, routed: true, partiallyRouted: false },
    { id: 'n2', name: 'GND', pinCount: 18, routed: true, partiallyRouted: false },
    { id: 'n3', name: '3V3', pinCount: 6, routed: true, partiallyRouted: false },
    { id: 'n4', name: 'SDA', pinCount: 4, routed: true, partiallyRouted: false },
    { id: 'n5', name: 'SCL', pinCount: 4, routed: true, partiallyRouted: false },
    { id: 'n6', name: 'MOSI', pinCount: 3, routed: false, partiallyRouted: true },
    { id: 'n7', name: 'MISO', pinCount: 3, routed: false, partiallyRouted: true },
    { id: 'n8', name: 'SCK', pinCount: 3, routed: false, partiallyRouted: false },
    { id: 'n9', name: 'CS', pinCount: 2, routed: false, partiallyRouted: false },
    { id: 'n10', name: 'TX', pinCount: 2, routed: true, partiallyRouted: false },
    { id: 'n11', name: 'RX', pinCount: 2, routed: true, partiallyRouted: false },
    { id: 'n12', name: 'RESET', pinCount: 3, routed: false, partiallyRouted: false },
    { id: 'n13', name: 'D0', pinCount: 2, routed: false, partiallyRouted: false },
    { id: 'n14', name: 'D1', pinCount: 2, routed: false, partiallyRouted: false },
    { id: 'n15', name: 'A0', pinCount: 2, routed: true, partiallyRouted: false },
];
export const NetInspectorPanel = () => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedNet, setHighlightedNet] = useState(null);
    const [filterMode, setFilterMode] = useState('all');
    const filteredNets = useMemo(() => {
        return SAMPLE_NETS.filter((net) => {
            const matchesSearch = !searchQuery || net.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterMode === 'all' ||
                (filterMode === 'routed' && net.routed) ||
                (filterMode === 'unrouted' && !net.routed);
            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, filterMode]);
    const stats = useMemo(() => {
        const total = SAMPLE_NETS.length;
        const routed = SAMPLE_NETS.filter((n) => n.routed).length;
        return { total, routed, unrouted: total - routed };
    }, []);
    return (_jsxs("div", { style: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.surface,
            borderRight: `1px solid ${theme.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsx("div", { style: {
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }, children: "Net Inspector" }), _jsxs("div", { style: {
                    display: 'flex',
                    gap: 12,
                    padding: '6px 12px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    fontSize: 11,
                }, children: [_jsxs("span", { style: { color: theme.colors.text }, children: ["Total: ", _jsx("strong", { children: stats.total })] }), _jsxs("span", { style: { color: theme.colors.success }, children: ["Routed: ", _jsx("strong", { children: stats.routed })] }), _jsxs("span", { style: { color: theme.colors.warning }, children: ["Unrouted: ", _jsx("strong", { children: stats.unrouted })] })] }), _jsxs("div", { style: { padding: '8px 12px', borderBottom: `1px solid ${theme.colors.border}` }, children: [_jsxs("div", { style: { position: 'relative', marginBottom: 6 }, children: [_jsx(Icon, { name: "search", size: 14, color: theme.colors.textSecondary, style: { position: 'absolute', left: 8, top: 7 } }), _jsx("input", { type: "text", placeholder: "Filter nets...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                                    width: '100%',
                                    padding: '6px 8px 6px 28px',
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    fontFamily: theme.fonts.sans,
                                } })] }), _jsx("div", { style: { display: 'flex', gap: 4 }, children: ['all', 'routed', 'unrouted'].map((mode) => (_jsx("button", { onClick: () => setFilterMode(mode), style: {
                                padding: '3px 8px',
                                fontSize: 11,
                                border: `1px solid ${filterMode === mode ? theme.colors.primary : theme.colors.border}`,
                                borderRadius: 3,
                                backgroundColor: filterMode === mode ? theme.colors.primary : 'transparent',
                                color: filterMode === mode ? '#fff' : theme.colors.textSecondary,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }, children: mode }, mode))) })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto' }, children: [_jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: '1fr 60px 70px',
                            padding: '4px 12px',
                            fontSize: 10,
                            color: theme.colors.textSecondary,
                            textTransform: 'uppercase',
                            borderBottom: `1px solid ${theme.colors.border}`,
                            position: 'sticky',
                            top: 0,
                            backgroundColor: theme.colors.surface,
                        }, children: [_jsx("span", { children: "Net" }), _jsx("span", { style: { textAlign: 'center' }, children: "Pins" }), _jsx("span", { style: { textAlign: 'center' }, children: "Status" })] }), filteredNets.map((net) => (_jsxs("div", { onClick: () => setHighlightedNet(net.id === highlightedNet ? null : net.id), style: {
                            display: 'grid',
                            gridTemplateColumns: '1fr 60px 70px',
                            padding: '5px 12px',
                            cursor: 'pointer',
                            backgroundColor: highlightedNet === net.id ? theme.colors.surfaceHover : 'transparent',
                            borderLeft: highlightedNet === net.id
                                ? `3px solid ${theme.colors.primary}`
                                : '3px solid transparent',
                            transition: 'background-color 0.1s',
                        }, onMouseEnter: (e) => {
                            if (highlightedNet !== net.id)
                                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                        }, onMouseLeave: (e) => {
                            if (highlightedNet !== net.id)
                                e.currentTarget.style.backgroundColor = 'transparent';
                        }, children: [_jsx("span", { style: {
                                    fontSize: 12,
                                    color: theme.colors.text,
                                    fontFamily: theme.fonts.mono,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }, children: net.name }), _jsx("span", { style: {
                                    fontSize: 12,
                                    color: theme.colors.textSecondary,
                                    textAlign: 'center',
                                }, children: net.pinCount }), _jsx("span", { style: {
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                }, children: net.routed ? (_jsxs(_Fragment, { children: [_jsx(Icon, { name: "check", size: 12, color: theme.colors.success }), _jsx("span", { style: { fontSize: 10, color: theme.colors.success }, children: "Routed" })] })) : net.partiallyRouted ? (_jsxs(_Fragment, { children: [_jsx(Icon, { name: "warning", size: 12, color: theme.colors.warning }), _jsx("span", { style: { fontSize: 10, color: theme.colors.warning }, children: "Partial" })] })) : (_jsxs(_Fragment, { children: [_jsx(Icon, { name: "close", size: 12, color: theme.colors.error }), _jsx("span", { style: { fontSize: 10, color: theme.colors.error }, children: "Open" })] })) })] }, net.id)))] })] }));
};
export default NetInspectorPanel;
//# sourceMappingURL=NetInspectorPanel.js.map