import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';
export const PropertiesPanel = () => {
    const { theme } = useTheme();
    const selectedIds = useAppStore((s) => s.selectedIds);
    const mode = useAppStore((s) => s.mode);
    // Mock properties based on selection
    const [properties, setProperties] = useState([
        { key: 'reference', label: 'Reference', value: 'U1', type: 'text' },
        { key: 'value', label: 'Value', value: '74HC00', type: 'text' },
        { key: 'footprint', label: 'Footprint', value: 'SOIC-14', type: 'text' },
        { key: 'x', label: 'Position X', value: '25.40', type: 'number' },
        { key: 'y', label: 'Position Y', value: '50.80', type: 'number' },
        { key: 'rotation', label: 'Rotation', value: '0', type: 'number' },
    ]);
    const pcbProperties = [
        ...properties,
        {
            key: 'layer',
            label: 'Layer',
            value: 'F.Cu',
            type: 'select',
            options: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS', 'F.Mask', 'B.Mask', 'Edge.Cuts'],
        },
        { key: 'net', label: 'Net', value: 'VCC', type: 'text', readOnly: true },
    ];
    const displayProps = mode === 'pcb' ? pcbProperties : properties;
    const handleChange = useCallback((key, value) => {
        setProperties((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)));
    }, []);
    const noSelection = selectedIds.size === 0;
    const inputStyle = {
        width: '100%',
        padding: '4px 6px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 3,
        fontSize: 12,
        fontFamily: theme.fonts.mono,
        outline: 'none',
        boxSizing: 'border-box',
    };
    return (_jsxs("div", { style: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.surface,
            borderLeft: `1px solid ${theme.colors.border}`,
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
                }, children: "Properties" }), _jsx("div", { style: { flex: 1, overflowY: 'auto', padding: '8px 12px' }, children: noSelection ? (_jsxs("div", { style: {
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 40,
                    }, children: ["No item selected.", _jsx("br", {}), _jsx("span", { style: { fontSize: 11 }, children: "Click an item in the canvas to view its properties." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                fontSize: 11,
                                color: theme.colors.textSecondary,
                                marginBottom: 8,
                            }, children: selectedIds.size === 1
                                ? '1 item selected'
                                : `${selectedIds.size} items selected` }), displayProps.map((prop) => (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsx("label", { style: {
                                        display: 'block',
                                        fontSize: 11,
                                        color: theme.colors.textSecondary,
                                        marginBottom: 2,
                                    }, children: prop.label }), prop.type === 'select' ? (_jsx("select", { value: prop.value, onChange: (e) => handleChange(prop.key, e.target.value), style: {
                                        ...inputStyle,
                                        appearance: 'none',
                                        cursor: 'pointer',
                                    }, children: prop.options?.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })) : (_jsx("input", { type: prop.type, value: prop.value, readOnly: prop.readOnly, onChange: (e) => handleChange(prop.key, e.target.value), style: {
                                        ...inputStyle,
                                        opacity: prop.readOnly ? 0.6 : 1,
                                        cursor: prop.readOnly ? 'default' : 'text',
                                    }, onFocus: (e) => {
                                        e.currentTarget.style.borderColor =
                                            theme.colors.primary;
                                    }, onBlur: (e) => {
                                        e.currentTarget.style.borderColor =
                                            theme.colors.border;
                                    } }))] }, prop.key)))] })) })] }));
};
export default PropertiesPanel;
//# sourceMappingURL=PropertiesPanel.js.map