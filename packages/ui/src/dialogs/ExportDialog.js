import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';
const FORMATS = [
    { id: 'gerber', label: 'Gerber (RS-274X)', description: 'Industry-standard PCB fabrication format' },
    { id: 'bom', label: 'Bill of Materials', description: 'CSV component list with references and values' },
    { id: 'pdf', label: 'PDF', description: 'Print-ready schematic or PCB layout' },
    { id: 'svg', label: 'SVG', description: 'Scalable vector graphics for documentation' },
    { id: 'pick-and-place', label: 'Pick & Place', description: 'Component placement data for assembly' },
];
export const ExportDialog = ({ open, onClose, onExport }) => {
    const { theme } = useTheme();
    const [selectedFormat, setSelectedFormat] = useState('gerber');
    const [outputDir, setOutputDir] = useState('./output');
    // Format-specific options
    const [gerberOptions, setGerberOptions] = useState({
        includeTopCopper: true,
        includeBottomCopper: true,
        includeSilkscreen: true,
        includeSolderMask: true,
        includeDrill: true,
        includeEdgeCuts: true,
        useProtel: true,
    });
    const [bomOptions, setBomOptions] = useState({
        groupByValue: true,
        includeRefDes: true,
        includeFootprint: true,
        includeQuantity: true,
        delimiter: 'comma',
    });
    const [pdfOptions, setPdfOptions] = useState({
        pageSize: 'A4',
        orientation: 'landscape',
        includeTitle: true,
        includeBorder: true,
        scale: 1.0,
    });
    if (!open)
        return null;
    const checkboxStyle = {
        accentColor: theme.colors.primary,
        marginRight: 8,
        cursor: 'pointer',
    };
    const labelStyle = {
        fontSize: 12,
        color: theme.colors.text,
        display: 'flex',
        alignItems: 'center',
        padding: '3px 0',
        cursor: 'pointer',
    };
    const selectStyle = {
        padding: '4px 8px',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 3,
        fontSize: 12,
        outline: 'none',
        fontFamily: theme.fonts.sans,
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
                width: 520,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }, children: [_jsxs("div", { style: {
                        padding: '16px 20px',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        fontSize: 16,
                        fontWeight: 600,
                        color: theme.colors.text,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }, children: ["Export", _jsx("button", { onClick: onClose, style: {
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                            }, children: _jsx(Icon, { name: "close", size: 18, color: theme.colors.textSecondary }) })] }), _jsxs("div", { style: { padding: 20, overflowY: 'auto', flex: 1 }, children: [_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }, children: "Output Format" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: FORMATS.map((fmt) => (_jsxs("label", { style: {
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 8,
                                            padding: '6px 10px',
                                            borderRadius: 4,
                                            backgroundColor: selectedFormat === fmt.id ? theme.colors.surfaceHover : 'transparent',
                                            border: `1px solid ${selectedFormat === fmt.id ? theme.colors.primary : 'transparent'}`,
                                            cursor: 'pointer',
                                        }, children: [_jsx("input", { type: "radio", name: "format", checked: selectedFormat === fmt.id, onChange: () => setSelectedFormat(fmt.id), style: { accentColor: theme.colors.primary, marginTop: 2 } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.text, fontWeight: 500 }, children: fmt.label }), _jsx("div", { style: { fontSize: 11, color: theme.colors.textSecondary }, children: fmt.description })] })] }, fmt.id))) })] }), _jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }, children: "Options" }), selectedFormat === 'gerber' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [[
                                            { key: 'includeTopCopper', label: 'Top Copper (F.Cu)' },
                                            { key: 'includeBottomCopper', label: 'Bottom Copper (B.Cu)' },
                                            { key: 'includeSilkscreen', label: 'Silkscreen' },
                                            { key: 'includeSolderMask', label: 'Solder Mask' },
                                            { key: 'includeDrill', label: 'Drill File (Excellon)' },
                                            { key: 'includeEdgeCuts', label: 'Board Outline (Edge.Cuts)' },
                                        ].map((opt) => (_jsxs("label", { style: labelStyle, children: [_jsx("input", { type: "checkbox", checked: gerberOptions[opt.key], onChange: (e) => setGerberOptions((prev) => ({
                                                        ...prev,
                                                        [opt.key]: e.target.checked,
                                                    })), style: checkboxStyle }), opt.label] }, opt.key))), _jsxs("label", { style: { ...labelStyle, marginTop: 8 }, children: [_jsx("input", { type: "checkbox", checked: gerberOptions.useProtel, onChange: (e) => setGerberOptions((prev) => ({ ...prev, useProtel: e.target.checked })), style: checkboxStyle }), "Use Protel filename extensions"] })] })), selectedFormat === 'bom' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [[
                                            { key: 'groupByValue', label: 'Group by value' },
                                            { key: 'includeRefDes', label: 'Include reference designators' },
                                            { key: 'includeFootprint', label: 'Include footprints' },
                                            { key: 'includeQuantity', label: 'Include quantity' },
                                        ].map((opt) => (_jsxs("label", { style: labelStyle, children: [_jsx("input", { type: "checkbox", checked: bomOptions[opt.key], onChange: (e) => setBomOptions((prev) => ({
                                                        ...prev,
                                                        [opt.key]: e.target.checked,
                                                    })), style: checkboxStyle }), opt.label] }, opt.key))), _jsxs("div", { style: { marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 12, color: theme.colors.text }, children: "Delimiter:" }), _jsxs("select", { value: bomOptions.delimiter, onChange: (e) => setBomOptions((prev) => ({
                                                        ...prev,
                                                        delimiter: e.target.value,
                                                    })), style: selectStyle, children: [_jsx("option", { value: "comma", children: "Comma (,)" }), _jsx("option", { value: "tab", children: "Tab" }), _jsx("option", { value: "semicolon", children: "Semicolon (;)" })] })] })] })), selectedFormat === 'pdf' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 6 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 12, color: theme.colors.text, minWidth: 90 }, children: "Page Size:" }), _jsxs("select", { value: pdfOptions.pageSize, onChange: (e) => setPdfOptions((prev) => ({ ...prev, pageSize: e.target.value })), style: selectStyle, children: [_jsx("option", { value: "A4", children: "A4" }), _jsx("option", { value: "A3", children: "A3" }), _jsx("option", { value: "Letter", children: "Letter" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: 12, color: theme.colors.text, minWidth: 90 }, children: "Orientation:" }), _jsxs("select", { value: pdfOptions.orientation, onChange: (e) => setPdfOptions((prev) => ({
                                                        ...prev,
                                                        orientation: e.target.value,
                                                    })), style: selectStyle, children: [_jsx("option", { value: "landscape", children: "Landscape" }), _jsx("option", { value: "portrait", children: "Portrait" })] })] }), _jsxs("label", { style: labelStyle, children: [_jsx("input", { type: "checkbox", checked: pdfOptions.includeTitle, onChange: (e) => setPdfOptions((prev) => ({ ...prev, includeTitle: e.target.checked })), style: checkboxStyle }), "Include title block"] }), _jsxs("label", { style: labelStyle, children: [_jsx("input", { type: "checkbox", checked: pdfOptions.includeBorder, onChange: (e) => setPdfOptions((prev) => ({
                                                        ...prev,
                                                        includeBorder: e.target.checked,
                                                    })), style: checkboxStyle }), "Include border"] })] })), selectedFormat === 'svg' && (_jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary }, children: "SVG output will include all visible layers in the current view." })), selectedFormat === 'pick-and-place' && (_jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary }, children: "Generates CSV with component reference, value, footprint, position (X, Y), side, and rotation." }))] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: 600 }, children: "Output Directory" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { type: "text", value: outputDir, onChange: (e) => setOutputDir(e.target.value), style: {
                                                flex: 1,
                                                padding: '6px 10px',
                                                backgroundColor: theme.colors.background,
                                                color: theme.colors.text,
                                                border: `1px solid ${theme.colors.border}`,
                                                borderRadius: 4,
                                                fontSize: 12,
                                                outline: 'none',
                                                fontFamily: theme.fonts.mono,
                                            } }), _jsx("button", { style: {
                                                padding: '6px 12px',
                                                fontSize: 12,
                                                border: `1px solid ${theme.colors.border}`,
                                                borderRadius: 4,
                                                backgroundColor: 'transparent',
                                                color: theme.colors.text,
                                                cursor: 'pointer',
                                                fontFamily: theme.fonts.sans,
                                            }, children: "Browse..." })] })] })] }), _jsxs("div", { style: {
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
                            }, children: "Cancel" }), _jsxs("button", { onClick: () => {
                                const options = selectedFormat === 'gerber'
                                    ? gerberOptions
                                    : selectedFormat === 'bom'
                                        ? bomOptions
                                        : selectedFormat === 'pdf'
                                            ? pdfOptions
                                            : {};
                                onExport(selectedFormat, { ...options, outputDir });
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }, children: [_jsx(Icon, { name: "export", size: 14, color: "#fff" }), "Export"] })] })] }) }));
};
export default ExportDialog;
//# sourceMappingURL=ExportDialog.js.map