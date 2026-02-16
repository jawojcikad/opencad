import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../common/Icon';
const SAMPLE_VIOLATIONS = [
    {
        id: 'v1',
        severity: 'error',
        type: 'clearance',
        message: 'Clearance violation between track and pad (0.15mm < 0.20mm)',
        location: { x: 32.5, y: 48.2 },
        items: ['Track on F.Cu', 'Pad U1-3'],
    },
    {
        id: 'v2',
        severity: 'error',
        type: 'short',
        message: 'Short circuit between nets VCC and GND',
        location: { x: 45.0, y: 22.5 },
        items: ['Via at (45.0, 22.5)', 'Zone GND'],
    },
    {
        id: 'v3',
        severity: 'warning',
        type: 'width',
        message: 'Track width below minimum (0.10mm < 0.15mm)',
        location: { x: 18.3, y: 55.1 },
        items: ['Track on B.Cu'],
    },
    {
        id: 'v4',
        severity: 'warning',
        type: 'unconnected',
        message: 'Unconnected net: RESET (2 pads)',
        location: { x: 60.0, y: 35.0 },
        items: ['R3-1', 'U1-14'],
    },
    {
        id: 'v5',
        severity: 'info',
        type: 'courtyard',
        message: 'Courtyard overlap between C1 and C2',
        location: { x: 28.0, y: 40.0 },
        items: ['C1 F.CrtYd', 'C2 F.CrtYd'],
    },
];
export const DRCPanel = () => {
    const { theme } = useTheme();
    const violations = useAppStore((s) => s.violations);
    const setViolations = useAppStore((s) => s.setViolations);
    const mode = useAppStore((s) => s.mode);
    const displayViolations = violations.length > 0 ? violations : SAMPLE_VIOLATIONS;
    const stats = useMemo(() => {
        const errors = displayViolations.filter((v) => v.severity === 'error').length;
        const warnings = displayViolations.filter((v) => v.severity === 'warning').length;
        const infos = displayViolations.filter((v) => v.severity === 'info').length;
        return { errors, warnings, infos, total: displayViolations.length };
    }, [displayViolations]);
    const severityIcon = (severity) => {
        switch (severity) {
            case 'error':
                return _jsx(Icon, { name: "error", size: 14, color: theme.colors.error });
            case 'warning':
                return _jsx(Icon, { name: "warning", size: 14, color: theme.colors.warning });
            case 'info':
                return _jsx(Icon, { name: "info", size: 14, color: theme.colors.primary });
        }
    };
    const handleZoomToViolation = (violation) => {
        // In a real app, this would tell the editor to pan/zoom to the location
        console.log('Zoom to violation:', violation.location);
    };
    const handleRunCheck = () => {
        // In a real app, trigger DRC or ERC
        setViolations(SAMPLE_VIOLATIONS);
    };
    const handleClear = () => {
        setViolations([]);
    };
    const title = mode === 'schematic' ? 'ERC Results' : 'DRC Results';
    return (_jsxs("div", { style: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsx("span", { style: {
                            fontSize: 12,
                            fontWeight: 600,
                            color: theme.colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }, children: title }), _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("button", { onClick: handleRunCheck, style: {
                                    padding: '3px 10px',
                                    fontSize: 11,
                                    border: `1px solid ${theme.colors.primary}`,
                                    borderRadius: 3,
                                    backgroundColor: theme.colors.primary,
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontFamily: theme.fonts.sans,
                                }, children: mode === 'schematic' ? 'Run ERC' : 'Run DRC' }), _jsx("button", { onClick: handleClear, style: {
                                    padding: '3px 10px',
                                    fontSize: 11,
                                    border: `1px solid ${theme.colors.border}`,
                                    borderRadius: 3,
                                    backgroundColor: 'transparent',
                                    color: theme.colors.textSecondary,
                                    cursor: 'pointer',
                                    fontFamily: theme.fonts.sans,
                                }, children: "Clear" })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    gap: 16,
                    padding: '6px 12px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    fontSize: 11,
                }, children: [_jsxs("span", { style: { color: theme.colors.error, display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(Icon, { name: "error", size: 12, color: theme.colors.error }), stats.errors, " Errors"] }), _jsxs("span", { style: { color: theme.colors.warning, display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(Icon, { name: "warning", size: 12, color: theme.colors.warning }), stats.warnings, " Warnings"] }), _jsxs("span", { style: { color: theme.colors.primary, display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(Icon, { name: "info", size: 12, color: theme.colors.primary }), stats.infos, " Info"] })] }), _jsx("div", { style: { flex: 1, overflowY: 'auto' }, children: displayViolations.length === 0 ? (_jsxs("div", { style: {
                        textAlign: 'center',
                        padding: 32,
                        color: theme.colors.success,
                        fontSize: 13,
                    }, children: [_jsx(Icon, { name: "check", size: 32, color: theme.colors.success }), _jsx("div", { style: { marginTop: 12 }, children: "No violations found." }), _jsx("div", { style: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 }, children: "Design passes all checks." })] })) : (displayViolations.map((violation) => (_jsxs("div", { onClick: () => handleZoomToViolation(violation), style: {
                        display: 'flex',
                        gap: 8,
                        padding: '8px 12px',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.1s',
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }, children: [_jsx("div", { style: { flexShrink: 0, paddingTop: 2 }, children: severityIcon(violation.severity) }), _jsxs("div", { style: { flex: 1, overflow: 'hidden' }, children: [_jsx("div", { style: { fontSize: 12, color: theme.colors.text, marginBottom: 2 }, children: violation.message }), violation.items && (_jsx("div", { style: { fontSize: 10, color: theme.colors.textSecondary }, children: violation.items.join(' ↔ ') })), _jsxs("div", { style: {
                                        fontSize: 10,
                                        color: theme.colors.textSecondary,
                                        fontFamily: theme.fonts.mono,
                                        marginTop: 2,
                                    }, children: ["(", violation.location.x.toFixed(2), ", ", violation.location.y.toFixed(2), ") mm"] })] })] }, violation.id)))) })] }));
};
export default DRCPanel;
//# sourceMappingURL=DRCPanel.js.map