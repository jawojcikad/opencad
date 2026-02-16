import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'bottom',
  delay = 400,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionStyles: React.CSSProperties = (() => {
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

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      {children}
      {visible && (
        <div
          style={{
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
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
