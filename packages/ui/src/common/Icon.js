import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
const iconPaths = {
    'file-new': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 9h-2v2a1 1 0 11-2 0v-2H7a1 1 0 110-2h2V7a1 1 0 112 0v2h2a1 1 0 110 2z',
    'file-open': 'M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm0 12H4V8h16v10z',
    'file-save': 'M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z',
    export: 'M19 9h-4V3H9v6H5l7 7 7-7zm-14 9v2h14v-2H5z',
    undo: 'M12.5 8c-2.65 0-5.05 1.04-6.83 2.73L3 8v8h8l-2.7-2.7A7.42 7.42 0 0112.5 11c3.13 0 5.83 1.93 6.95 4.67l1.92-.68A9.5 9.5 0 0012.5 8z',
    redo: 'M18.33 10.73A9.48 9.48 0 0011.5 8a9.5 9.5 0 00-8.87 6.99l1.92.68A7.48 7.48 0 0111.5 11c1.63 0 3.13.53 4.35 1.42L13 15h8V7l-2.67 3.73z',
    cut: 'M9.64 7.64c.23-.5.36-1.05.36-1.64a4 4 0 10-4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36A3.93 3.93 0 006 14a4 4 0 104 4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64z',
    copy: 'M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z',
    paste: 'M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V4a2 2 0 00-2-2zm-7 0a1 1 0 110 2 1 1 0 010-2zm7 18H5V4h2v3h10V4h2v16z',
    delete: 'M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    select: 'M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18.5V2z',
    wire: 'M2 12h8v2H2v-2zm12 0h8v2h-8v-2zm-4-2v6l2-2v-2l-2-2z',
    component: 'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z',
    'net-label': 'M3 5h12v4H3V5zm2 6h14v4H5v-4zm-2 6h12v4H3v-4z',
    power: 'M11 2v7h2l-3 12 1-8H9l2-11z',
    erc: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 15a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm1-5h-2V7h2v5z',
    route: 'M3 17h4v-4l4-4h6V5h4v4h-2v-2h-1l-7 7v5H5v-2H3z',
    via: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12zm0-8a2 2 0 100 4 2 2 0 000-4z',
    zone: 'M3 3h18v18H3V3zm2 2v14h14V5H5z',
    footprint: 'M6 2h12v4H6V2zm0 6h12v4H6V8zm0 6h12v4H6v-4zm0 6h12v2H6v-2z',
    measure: 'M3 5v14h2v-6h4v6h2V5H9v6H5V5H3zm12 0v14h2V5h-2zm4 0v14h2V5h-2z',
    drc: 'M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z',
    gerber: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h2v2H9V9zm4 0h2v2h-2V9zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z',
    'top-view': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z',
    'bottom-view': 'M12 19.5c5 0 9.27-3.11 11-7.5-1.73-4.39-6-7.5-11-7.5S2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5zM12 7a5 5 0 110 10A5 5 0 0112 7z',
    isometric: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    'reset-view': 'M17.65 6.35A7.96 7.96 0 0012 4a8 8 0 108 8h-3a5 5 0 11-5-5c1.38 0 2.63.56 3.54 1.46L13 11h7V4l-2.35 2.35z',
    'toggle-components': 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zM16 4v4h4V4h-4zm-6-4h4v4h-4V0zm6 10h4v-4h-4v4zm0 6h4v-4h-4v4z',
    eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z',
    'eye-off': 'M12 7a5 5 0 015 5 4.85 4.85 0 01-.36 1.83l2.92 2.92A11.82 11.82 0 0023 12c-1.73-4.39-6-7.5-11-7.5a11.65 11.65 0 00-3.98.7l2.16 2.16A4.85 4.85 0 0112 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.49 4.49 0 019.5 14z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',
    'chevron-right': 'M10 6l6 6-6 6V6z',
    'chevron-down': 'M7 10l5 5 5-5H7z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    error: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    info: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    check: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
    layer: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    grid: 'M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z',
    drag: 'M11 18a2 2 0 11-4 0 2 2 0 014 0zm0-6a2 2 0 11-4 0 2 2 0 014 0zm0-6a2 2 0 11-4 0 2 2 0 014 0zm6 12a2 2 0 11-4 0 2 2 0 014 0zm0-6a2 2 0 11-4 0 2 2 0 014 0zm0-6a2 2 0 11-4 0 2 2 0 014 0z',
};
export const Icon = ({ name, size = 18, color, style }) => {
    const { theme } = useTheme();
    const fillColor = color || theme.colors.text;
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: fillColor, style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }, children: _jsx("path", { d: iconPaths[name] || iconPaths.info }) }));
};
export default Icon;
//# sourceMappingURL=Icon.js.map