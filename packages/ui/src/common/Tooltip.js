import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../theme/ThemeProvider';
export const Tooltip = ({ text, children, position = 'bottom', delay = 400, }) => {
    const { theme } = useTheme();
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);
    const wrapperRef = useRef(null);
    const show = useCallback(() => {
        timeoutRef.current = setTimeout(() => setVisible(true), delay);
    }, [delay]);
    const hide = useCallback(() => {
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current);
        setVisible(false);
    }, []);
    useEffect(() => {
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, []);
    const positionStyles = (() => {
        switch (position) {
            case 'top':
                return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 };
            case 'bottom':
                return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 };
            case 'left':
                return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 };
            case 'right':
                return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 };
        }
    })();
    return (_jsxs("div", { ref: wrapperRef, onMouseEnter: show, onMouseLeave: hide, style: { position: 'relative', display: 'inline-flex' }, children: [children, visible && (_jsx("div", { style: {
                    position: 'absolute',
                    ...positionStyles,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }, children: text }))] }));
};
export default Tooltip;
//# sourceMappingURL=Tooltip.js.map