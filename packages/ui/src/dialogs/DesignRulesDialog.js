import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
const DEFAULT_RULES = {
    minClearance: 0.2,
    minTrackWidth: 0.15,
    minViaDiameter: 0.6,
    minViaDrill: 0.3,
    minHoleDiameter: 0.3,
    copperToEdge: 0.3,
    netClasses: [
        { name: 'Default', clearance: 0.2, trackWidth: 0.25, viaDiameter: 0.6, viaDrill: 0.3 },
        { name: 'Power', clearance: 0.3, trackWidth: 0.5, viaDiameter: 0.8, viaDrill: 0.4 },
        { name: 'Signal', clearance: 0.2, trackWidth: 0.15, viaDiameter: 0.6, viaDrill: 0.3 },
    ],
};
export const DesignRulesDialog = ({ open, onClose, onSave }) => {
    const { theme } = useTheme();
    const [rules, setRules] = useState(DEFAULT_RULES);
    if (!open)
        return null;
    const inputStyle = {
        width: 80,
        padding: '4px 6px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 3,
        fontSize: 12,
        fontFamily: theme.fonts.mono,
        textAlign: 'right',
        outline: 'none',
    };
    const labelStyle = {
        fontSize: 12,
        color: theme.colors.text,
        minWidth: 140,
    };
    const rowStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0',
    };
    const updateRule = (key, value) => {
        setRules((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };
    const updateNetClass = (index, key, value) => {
        setRules((prev) => ({
            ...prev,
            netClasses: prev.netClasses.map((nc, i) => i === index
                ? { ...nc, [key]: key === 'name' ? value : parseFloat(value) || 0 }
                : nc),
        }));
    };
    const addNetClass = () => {
        setRules((prev) => ({
            ...prev,
            netClasses: [
                ...prev.netClasses,
                { name: `Class ${prev.netClasses.length}`, clearance: 0.2, trackWidth: 0.25, viaDiameter: 0.6, viaDrill: 0.3 },
            ],
        }));
    };
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
                width: 560,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }, children: [_jsx("div", { style: {
                        padding: '16px 20px',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.colors.text,
                    }, children: "Design Rules" }), _jsxs("div", { style: { padding: 20, overflowY: 'auto', flex: 1 }, children: [_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("div", { style: {
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: theme.colors.textSecondary,
                                        marginBottom: 8,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }, children: "Global Constraints" }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Min Clearance" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.minClearance, onChange: (e) => updateRule('minClearance', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Min Track Width" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.minTrackWidth, onChange: (e) => updateRule('minTrackWidth', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Min Via Diameter" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.minViaDiameter, onChange: (e) => updateRule('minViaDiameter', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Min Via Drill" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.minViaDrill, onChange: (e) => updateRule('minViaDrill', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Min Hole Diameter" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.minHoleDiameter, onChange: (e) => updateRule('minHoleDiameter', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] }), _jsxs("div", { style: rowStyle, children: [_jsx("span", { style: labelStyle, children: "Copper to Edge" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("input", { type: "number", step: "0.01", value: rules.copperToEdge, onChange: (e) => updateRule('copperToEdge', e.target.value), style: inputStyle }), _jsx("span", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: "mm" })] })] })] }), _jsxs("div", { children: [_jsxs("div", { style: {
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: theme.colors.textSecondary,
                                        marginBottom: 8,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }, children: ["Net Class Rules", _jsx("button", { onClick: addNetClass, style: {
                                                padding: '3px 10px',
                                                fontSize: 11,
                                                border: `1px solid ${theme.colors.border}`,
                                                borderRadius: 3,
                                                backgroundColor: 'transparent',
                                                color: theme.colors.primary,
                                                cursor: 'pointer',
                                            }, children: "+ Add Class" })] }), _jsxs("div", { style: {
                                        border: `1px solid ${theme.colors.border}`,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                    }, children: [_jsxs("div", { style: {
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 70px 70px 70px 70px',
                                                gap: 4,
                                                padding: '6px 8px',
                                                fontSize: 10,
                                                color: theme.colors.textSecondary,
                                                textTransform: 'uppercase',
                                                backgroundColor: theme.colors.background,
                                                borderBottom: `1px solid ${theme.colors.border}`,
                                            }, children: [_jsx("span", { children: "Class" }), _jsx("span", { children: "Clear." }), _jsx("span", { children: "Track W." }), _jsx("span", { children: "Via Dia." }), _jsx("span", { children: "Via Drill" })] }), rules.netClasses.map((nc, i) => (_jsxs("div", { style: {
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 70px 70px 70px 70px',
                                                gap: 4,
                                                padding: '4px 8px',
                                                borderBottom: i < rules.netClasses.length - 1
                                                    ? `1px solid ${theme.colors.border}`
                                                    : 'none',
                                            }, children: [_jsx("input", { type: "text", value: nc.name, onChange: (e) => updateNetClass(i, 'name', e.target.value), style: { ...inputStyle, width: '100%', textAlign: 'left' } }), _jsx("input", { type: "number", step: "0.01", value: nc.clearance, onChange: (e) => updateNetClass(i, 'clearance', e.target.value), style: inputStyle }), _jsx("input", { type: "number", step: "0.01", value: nc.trackWidth, onChange: (e) => updateNetClass(i, 'trackWidth', e.target.value), style: inputStyle }), _jsx("input", { type: "number", step: "0.01", value: nc.viaDiameter, onChange: (e) => updateNetClass(i, 'viaDiameter', e.target.value), style: inputStyle }), _jsx("input", { type: "number", step: "0.01", value: nc.viaDrill, onChange: (e) => updateNetClass(i, 'viaDrill', e.target.value), style: inputStyle })] }, i)))] })] })] }), _jsxs("div", { style: {
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
                            }, children: "Cancel" }), _jsx("button", { onClick: () => {
                                onSave(rules);
                                onClose();
                            }, style: {
                                padding: '6px 20px',
                                fontSize: 13,
                                border: 'none',
                                borderRadius: 4,
                                backgroundColor: theme.colors.primary,
                                color: '#fff',
                                cursor: 'pointer',
                                fontFamily: theme.fonts.sans,
                            }, children: "Save" })] })] }) }));
};
export default DesignRulesDialog;
//# sourceMappingURL=DesignRulesDialog.js.map