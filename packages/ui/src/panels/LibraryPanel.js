import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';
const SAMPLE_COMPONENTS = [
    { id: 'r1', name: 'Resistor', category: 'Passive', description: 'Standard resistor', symbolPreview: 'R', footprint: '0402 / 0603 / 0805' },
    { id: 'c1', name: 'Capacitor', category: 'Passive', description: 'Standard capacitor', symbolPreview: 'C', footprint: '0402 / 0603 / 0805' },
    { id: 'l1', name: 'Inductor', category: 'Passive', description: 'Standard inductor', symbolPreview: 'L', footprint: '0603 / 0805 / 1206' },
    { id: 'd1', name: 'Diode', category: 'Semiconductor', description: 'General purpose diode', symbolPreview: 'D', footprint: 'SOD-123' },
    { id: 'led1', name: 'LED', category: 'Semiconductor', description: 'Light emitting diode', symbolPreview: 'LED', footprint: '0603 / 0805' },
    { id: 'q1', name: 'NPN Transistor', category: 'Semiconductor', description: 'NPN BJT', symbolPreview: 'Q', footprint: 'SOT-23' },
    { id: 'q2', name: 'PNP Transistor', category: 'Semiconductor', description: 'PNP BJT', symbolPreview: 'Q', footprint: 'SOT-23' },
    { id: 'q3', name: 'N-MOSFET', category: 'Semiconductor', description: 'N-Channel MOSFET', symbolPreview: 'M', footprint: 'SOT-23 / DPAK' },
    { id: 'u1', name: '74HC00', category: 'Logic', description: 'Quad 2-input NAND gate', symbolPreview: 'U', footprint: 'SOIC-14 / DIP-14' },
    { id: 'u2', name: '74HC04', category: 'Logic', description: 'Hex Inverter', symbolPreview: 'U', footprint: 'SOIC-14 / DIP-14' },
    { id: 'u3', name: 'ATmega328', category: 'Microcontroller', description: 'AVR 8-bit MCU', symbolPreview: 'U', footprint: 'TQFP-32 / DIP-28' },
    { id: 'u4', name: 'STM32F103', category: 'Microcontroller', description: 'ARM Cortex-M3 MCU', symbolPreview: 'U', footprint: 'LQFP-48' },
    { id: 'u5', name: 'LM7805', category: 'Power', description: '5V voltage regulator', symbolPreview: 'U', footprint: 'TO-220' },
    { id: 'u6', name: 'AMS1117-3.3', category: 'Power', description: '3.3V LDO regulator', symbolPreview: 'U', footprint: 'SOT-223' },
    { id: 'j1', name: 'USB-C Connector', category: 'Connector', description: 'USB Type-C receptacle', symbolPreview: 'J', footprint: 'USB-C-SMD' },
    { id: 'j2', name: 'Pin Header 1x10', category: 'Connector', description: '10-pin header', symbolPreview: 'J', footprint: '2.54mm pitch' },
    { id: 'sw1', name: 'Tactile Switch', category: 'Mechanical', description: 'Push button', symbolPreview: 'SW', footprint: '6x6mm' },
    { id: 'y1', name: 'Crystal 8MHz', category: 'Passive', description: 'Quartz crystal', symbolPreview: 'Y', footprint: 'HC-49' },
];
export const LibraryPanel = () => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const categories = useMemo(() => {
        const cats = new Set(SAMPLE_COMPONENTS.map((c) => c.category));
        return Array.from(cats).sort();
    }, []);
    const filteredComponents = useMemo(() => {
        return SAMPLE_COMPONENTS.filter((comp) => {
            const matchesCategory = !selectedCategory || comp.category === selectedCategory;
            const matchesSearch = !searchQuery ||
                comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                comp.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);
    const handleDragStart = useCallback((e, component) => {
        e.dataTransfer.setData('application/opencad-component', JSON.stringify(component));
        e.dataTransfer.effectAllowed = 'copy';
    }, []);
    return (_jsxs("div", { style: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.surface,
            borderRight: `1px solid ${theme.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    fontSize: 12,
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsx("span", { children: "Library" }), _jsxs("div", { style: { display: 'flex', gap: 4 }, children: [_jsx("button", { onClick: () => setViewMode('grid'), style: {
                                    background: viewMode === 'grid' ? theme.colors.primary : 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 2,
                                    borderRadius: 3,
                                }, children: _jsx(Icon, { name: "grid", size: 14, color: viewMode === 'grid' ? '#fff' : theme.colors.textSecondary }) }), _jsx("button", { onClick: () => setViewMode('list'), style: {
                                    background: viewMode === 'list' ? theme.colors.primary : 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 2,
                                    borderRadius: 3,
                                }, children: _jsx(Icon, { name: "component", size: 14, color: viewMode === 'list' ? '#fff' : theme.colors.textSecondary }) })] })] }), _jsx("div", { style: { padding: '8px 12px', borderBottom: `1px solid ${theme.colors.border}` }, children: _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Icon, { name: "search", size: 14, color: theme.colors.textSecondary, style: { position: 'absolute', left: 8, top: 7 } }), _jsx("input", { type: "text", placeholder: "Search components...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
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
                            } })] }) }), _jsxs("div", { style: {
                    padding: '4px 0',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    flexShrink: 0,
                }, children: [_jsxs("div", { onClick: () => setSelectedCategory(null), style: {
                            padding: '4px 12px',
                            fontSize: 12,
                            cursor: 'pointer',
                            color: selectedCategory === null ? theme.colors.primary : theme.colors.text,
                            fontWeight: selectedCategory === null ? 600 : 400,
                            backgroundColor: selectedCategory === null ? theme.colors.surfaceHover : 'transparent',
                        }, children: ["All Components (", SAMPLE_COMPONENTS.length, ")"] }), categories.map((cat) => {
                        const count = SAMPLE_COMPONENTS.filter((c) => c.category === cat).length;
                        const isActive = selectedCategory === cat;
                        return (_jsxs("div", { onClick: () => setSelectedCategory(cat), style: {
                                padding: '4px 12px 4px 24px',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: isActive ? theme.colors.primary : theme.colors.text,
                                fontWeight: isActive ? 600 : 400,
                                backgroundColor: isActive ? theme.colors.surfaceHover : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }, onMouseEnter: (e) => {
                                if (!isActive)
                                    e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                            }, onMouseLeave: (e) => {
                                if (!isActive)
                                    e.currentTarget.style.backgroundColor = 'transparent';
                            }, children: [_jsx(Icon, { name: "chevron-right", size: 10, color: theme.colors.textSecondary }), cat, _jsx("span", { style: { color: theme.colors.textSecondary, marginLeft: 'auto' }, children: count })] }, cat));
                    })] }), _jsx("div", { style: { flex: 1, overflowY: 'auto', padding: 8 }, children: viewMode === 'grid' ? (_jsx("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 6,
                    }, children: filteredComponents.map((comp) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, comp), onClick: () => setSelectedComponent(comp), style: {
                            padding: 8,
                            backgroundColor: selectedComponent?.id === comp.id
                                ? theme.colors.surfaceHover
                                : theme.colors.background,
                            border: `1px solid ${selectedComponent?.id === comp.id ? theme.colors.primary : theme.colors.border}`,
                            borderRadius: 4,
                            cursor: 'grab',
                            textAlign: 'center',
                            transition: 'border-color 0.1s',
                        }, children: [_jsx("div", { style: {
                                    width: '100%',
                                    height: 50,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: theme.colors.primary,
                                    fontFamily: theme.fonts.mono,
                                }, children: comp.symbolPreview }), _jsx("div", { style: {
                                    fontSize: 11,
                                    color: theme.colors.text,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: 4,
                                }, children: comp.name })] }, comp.id))) })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 2 }, children: filteredComponents.map((comp) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, comp), onClick: () => setSelectedComponent(comp), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 8px',
                            cursor: 'grab',
                            borderRadius: 3,
                            backgroundColor: selectedComponent?.id === comp.id ? theme.colors.surfaceHover : 'transparent',
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                        }, onMouseLeave: (e) => {
                            if (selectedComponent?.id !== comp.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }, children: [_jsx("span", { style: {
                                    width: 28,
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    color: theme.colors.primary,
                                    fontFamily: theme.fonts.mono,
                                    fontSize: 13,
                                }, children: comp.symbolPreview }), _jsxs("div", { style: { flex: 1, overflow: 'hidden' }, children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.text }, children: comp.name }), _jsx("div", { style: {
                                            fontSize: 10,
                                            color: theme.colors.textSecondary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }, children: comp.description })] })] }, comp.id))) })) }), selectedComponent && (_jsxs("div", { style: {
                    borderTop: `1px solid ${theme.colors.border}`,
                    padding: 12,
                    flexShrink: 0,
                }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600, color: theme.colors.text }, children: selectedComponent.name }), _jsx("div", { style: {
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                            marginTop: 4,
                        }, children: selectedComponent.description }), _jsxs("div", { style: {
                            display: 'flex',
                            gap: 8,
                            marginTop: 8,
                        }, children: [_jsxs("div", { style: {
                                    flex: 1,
                                    height: 60,
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                }, children: [_jsx("span", { style: { fontSize: 22, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.fonts.mono }, children: selectedComponent.symbolPreview }), _jsx("span", { style: { fontSize: 9, color: theme.colors.textSecondary }, children: "Symbol" })] }), _jsxs("div", { style: {
                                    flex: 1,
                                    height: 60,
                                    backgroundColor: theme.colors.background,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                }, children: [_jsx("span", { style: { fontSize: 10, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }, children: selectedComponent.footprint }), _jsx("span", { style: { fontSize: 9, color: theme.colors.textSecondary }, children: "Footprint" })] })] })] }))] }));
};
export default LibraryPanel;
//# sourceMappingURL=LibraryPanel.js.map