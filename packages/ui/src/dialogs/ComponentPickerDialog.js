import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';
const COMPONENTS = [
    { id: 'r', name: 'Resistor', category: 'Passive', description: 'Standard resistor', symbolPreview: 'R', footprint: '0402 / 0603 / 0805', pins: 2 },
    { id: 'c', name: 'Capacitor', category: 'Passive', description: 'Standard capacitor', symbolPreview: 'C', footprint: '0402 / 0603 / 0805', pins: 2 },
    { id: 'l', name: 'Inductor', category: 'Passive', description: 'Standard inductor', symbolPreview: 'L', footprint: '0603 / 0805', pins: 2 },
    { id: 'd', name: 'Diode', category: 'Semiconductor', description: 'General purpose diode', symbolPreview: 'D', footprint: 'SOD-123', pins: 2 },
    { id: 'led', name: 'LED', category: 'Semiconductor', description: 'Light emitting diode', symbolPreview: 'LED', footprint: '0603 / 0805', pins: 2 },
    { id: 'npn', name: 'NPN Transistor', category: 'Semiconductor', description: 'NPN BJT', symbolPreview: 'Q', footprint: 'SOT-23', pins: 3 },
    { id: 'pnp', name: 'PNP Transistor', category: 'Semiconductor', description: 'PNP BJT', symbolPreview: 'Q', footprint: 'SOT-23', pins: 3 },
    { id: 'nmos', name: 'N-MOSFET', category: 'Semiconductor', description: 'N-Channel MOSFET', symbolPreview: 'M', footprint: 'SOT-23 / DPAK', pins: 3 },
    { id: 'pmos', name: 'P-MOSFET', category: 'Semiconductor', description: 'P-Channel MOSFET', symbolPreview: 'M', footprint: 'SOT-23', pins: 3 },
    { id: 'opamp', name: 'Op-Amp', category: 'Analog', description: 'Operational amplifier', symbolPreview: 'U', footprint: 'SOIC-8', pins: 8 },
    { id: '555', name: 'NE555', category: 'Analog', description: 'Timer IC', symbolPreview: 'U', footprint: 'SOIC-8 / DIP-8', pins: 8 },
    { id: '7805', name: 'LM7805', category: 'Power', description: '5V voltage regulator', symbolPreview: 'U', footprint: 'TO-220', pins: 3 },
    { id: 'ams1117', name: 'AMS1117-3.3', category: 'Power', description: '3.3V LDO regulator', symbolPreview: 'U', footprint: 'SOT-223', pins: 3 },
    { id: '74hc00', name: '74HC00', category: 'Logic', description: 'Quad 2-input NAND', symbolPreview: 'U', footprint: 'SOIC-14', pins: 14 },
    { id: '74hc04', name: '74HC04', category: 'Logic', description: 'Hex Inverter', symbolPreview: 'U', footprint: 'SOIC-14', pins: 14 },
    { id: '74hc595', name: '74HC595', category: 'Logic', description: '8-bit shift register', symbolPreview: 'U', footprint: 'SOIC-16', pins: 16 },
    { id: 'atmega328', name: 'ATmega328P', category: 'MCU', description: 'AVR 8-bit MCU', symbolPreview: 'U', footprint: 'TQFP-32 / DIP-28', pins: 28 },
    { id: 'stm32f103', name: 'STM32F103', category: 'MCU', description: 'ARM Cortex-M3', symbolPreview: 'U', footprint: 'LQFP-48', pins: 48 },
    { id: 'esp32', name: 'ESP32-WROOM', category: 'MCU', description: 'Wi-Fi + BT module', symbolPreview: 'U', footprint: 'Module', pins: 38 },
    { id: 'usbc', name: 'USB-C', category: 'Connector', description: 'USB Type-C receptacle', symbolPreview: 'J', footprint: 'USB-C-SMD', pins: 24 },
    { id: 'header10', name: 'Pin Header 1x10', category: 'Connector', description: '10-pin header 2.54mm', symbolPreview: 'J', footprint: 'PinHeader_1x10', pins: 10 },
    { id: 'sw', name: 'Tactile Switch', category: 'Mechanical', description: 'Push button', symbolPreview: 'SW', footprint: '6x6mm', pins: 4 },
    { id: 'xtal', name: 'Crystal 8MHz', category: 'Passive', description: 'Quartz crystal oscillator', symbolPreview: 'Y', footprint: 'HC-49', pins: 2 },
];
export const ComponentPickerDialog = ({ open, onClose, onSelect, }) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const categories = useMemo(() => {
        const cats = new Set(COMPONENTS.map((c) => c.category));
        return Array.from(cats).sort();
    }, []);
    const filtered = useMemo(() => {
        return COMPONENTS.filter((c) => {
            const matchCat = !selectedCategory || c.category === selectedCategory;
            const matchSearch = !searchQuery ||
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [searchQuery, selectedCategory]);
    const handleSelect = useCallback(() => {
        if (selectedComponent) {
            onSelect(selectedComponent);
            onClose();
        }
    }, [selectedComponent, onSelect, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }, onClick: onClose, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 8,
                width: 680,
                height: '75vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }, children: [_jsxs("div", { style: {
                        padding: '16px 20px',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }, children: [_jsx("span", { style: { fontSize: 16, fontWeight: 600, color: theme.colors.text }, children: "Choose Component" }), _jsx("button", { onClick: onClose, style: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 }, children: _jsx(Icon, { name: "close", size: 18, color: theme.colors.textSecondary }) })] }), _jsx("div", { style: { padding: '12px 20px', borderBottom: `1px solid ${theme.colors.border}` }, children: _jsxs("div", { style: { position: 'relative' }, children: [_jsx(Icon, { name: "search", size: 16, color: theme.colors.textSecondary, style: { position: 'absolute', left: 10, top: 8 } }), _jsx("input", { type: "text", placeholder: "Search components...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), autoFocus: true, style: {
                                    width: '100%',
                                    padding: '8px 12px 8px 34px',
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 6,
                                    fontSize: 13,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    fontFamily: theme.fonts.sans,
                                } })] }) }), _jsxs("div", { style: { flex: 1, display: 'flex', overflow: 'hidden' }, children: [_jsxs("div", { style: {
                                width: 150,
                                borderRight: `1px solid ${theme.colors.border}`,
                                overflowY: 'auto',
                                flexShrink: 0,
                            }, children: [_jsx("div", { onClick: () => setSelectedCategory(null), style: {
                                        padding: '8px 14px',
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        color: !selectedCategory ? theme.colors.primary : theme.colors.text,
                                        fontWeight: !selectedCategory ? 600 : 400,
                                        backgroundColor: !selectedCategory ? theme.colors.surfaceHover : 'transparent',
                                    }, children: "All" }), categories.map((cat) => {
                                    const isActive = selectedCategory === cat;
                                    return (_jsx("div", { onClick: () => setSelectedCategory(cat), style: {
                                            padding: '8px 14px',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                            color: isActive ? theme.colors.primary : theme.colors.text,
                                            fontWeight: isActive ? 600 : 400,
                                            backgroundColor: isActive ? theme.colors.surfaceHover : 'transparent',
                                        }, onMouseEnter: (e) => {
                                            if (!isActive)
                                                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                                        }, onMouseLeave: (e) => {
                                            if (!isActive)
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                        }, children: cat }, cat));
                                })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto' }, children: [filtered.map((comp) => {
                                    const isSelected = selectedComponent?.id === comp.id;
                                    return (_jsxs("div", { onClick: () => setSelectedComponent(comp), onDoubleClick: () => {
                                            setSelectedComponent(comp);
                                            onSelect(comp);
                                            onClose();
                                        }, style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '8px 14px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? theme.colors.surfaceHover : 'transparent',
                                            borderLeft: isSelected
                                                ? `3px solid ${theme.colors.primary}`
                                                : '3px solid transparent',
                                            borderBottom: `1px solid ${theme.colors.border}`,
                                        }, onMouseEnter: (e) => {
                                            if (!isSelected)
                                                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                                        }, onMouseLeave: (e) => {
                                            if (!isSelected)
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                        }, children: [_jsx("div", { style: {
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 4,
                                                    backgroundColor: theme.colors.background,
                                                    border: `1px solid ${theme.colors.border}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    color: theme.colors.primary,
                                                    fontFamily: theme.fonts.mono,
                                                    fontSize: 14,
                                                    flexShrink: 0,
                                                }, children: comp.symbolPreview }), _jsxs("div", { style: { flex: 1, overflow: 'hidden' }, children: [_jsx("div", { style: { fontSize: 13, color: theme.colors.text, fontWeight: 500 }, children: comp.name }), _jsxs("div", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: [comp.description, " \u00B7 ", comp.pins, " pins"] })] }), _jsx("div", { style: {
                                                    fontSize: 10,
                                                    color: theme.colors.textSecondary,
                                                    fontFamily: theme.fonts.mono,
                                                    textAlign: 'right',
                                                    flexShrink: 0,
                                                }, children: comp.footprint })] }, comp.id));
                                }), filtered.length === 0 && (_jsx("div", { style: {
                                        textAlign: 'center',
                                        padding: 40,
                                        color: theme.colors.textSecondary,
                                        fontSize: 13,
                                    }, children: "No components found." }))] })] }), selectedComponent && (_jsxs("div", { style: {
                        padding: '12px 20px',
                        borderTop: `1px solid ${theme.colors.border}`,
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                    }, children: [_jsxs("div", { style: {
                                width: 80,
                                height: 60,
                                backgroundColor: theme.colors.background,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                flexShrink: 0,
                            }, children: [_jsx("span", { style: {
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: theme.colors.primary,
                                        fontFamily: theme.fonts.mono,
                                    }, children: selectedComponent.symbolPreview }), _jsx("span", { style: { fontSize: 9, color: theme.colors.textSecondary }, children: "Symbol" })] }), _jsxs("div", { style: {
                                width: 80,
                                height: 60,
                                backgroundColor: theme.colors.background,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                flexShrink: 0,
                            }, children: [_jsx("span", { style: {
                                        fontSize: 10,
                                        color: theme.colors.textSecondary,
                                        fontFamily: theme.fonts.mono,
                                        textAlign: 'center',
                                        padding: '0 4px',
                                    }, children: selectedComponent.footprint }), _jsx("span", { style: { fontSize: 9, color: theme.colors.textSecondary }, children: "Footprint" })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 14, fontWeight: 600, color: theme.colors.text }, children: selectedComponent.name }), _jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary }, children: selectedComponent.description }), _jsxs("div", { style: { fontSize: 11, color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }, children: [selectedComponent.pins, " pins \u00B7 ", selectedComponent.category] })] })] })), _jsxs("div", { style: {
                        padding: '12px 20px',
                        borderTop: `1px solid ${theme.colors.border}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                    }, children: [_jsx("button", { onClick: onClose, style: {
                                padding: '6px 20px',
                                fontSize: 13,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: 4,
                                backgroundColor: 'transparent',
                                color: theme.colors.text,
                                cursor: 'pointer',
                                fontFamily: theme.fonts.sans,
                            }, children: "Cancel" }), _jsx("button", { disabled: !selectedComponent, onClick: handleSelect, style: {
                                padding: '6px 20px',
                                fontSize: 13,
                                border: 'none',
                                borderRadius: 4,
                                backgroundColor: selectedComponent ? theme.colors.primary : theme.colors.border,
                                color: '#fff',
                                cursor: selectedComponent ? 'pointer' : 'default',
                                fontFamily: theme.fonts.sans,
                                opacity: selectedComponent ? 1 : 0.5,
                            }, children: "Place Component" })] })] }) }));
};
export default ComponentPickerDialog;
//# sourceMappingURL=ComponentPickerDialog.js.map