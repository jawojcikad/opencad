import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  direction?: 'horizontal' | 'vertical';
  initialSplit?: number; // percentage 0-100
  minSize?: number; // px
  style?: React.CSSProperties;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  direction = 'horizontal',
  initialSplit = 50,
  minSize = 100,
  style,
}) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(initialSplit);
  const dragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let ratio: number;
      if (direction === 'horizontal') {
        const x = e.clientX - rect.left;
        ratio = (x / rect.width) * 100;
      } else {
        const y = e.clientY - rect.top;
        ratio = (y / rect.height) * 100;
      }
      const minPercent =
        direction === 'horizontal'
          ? (minSize / rect.width) * 100
          : (minSize / rect.height) * 100;
      ratio = Math.max(minPercent, Math.min(100 - minPercent, ratio));
      setSplit(ratio);
    };

    const handleMouseUp = () => {
      dragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [direction, minSize]);

  const isH = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isH ? 'row' : 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          [isH ? 'width' : 'height']: `${split}%`,
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        {left}
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          [isH ? 'width' : 'height']: 4,
          [isH ? 'minWidth' : 'minHeight']: 4,
          cursor: isH ? 'col-resize' : 'row-resize',
          backgroundColor: theme.colors.border,
          flexShrink: 0,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.primary;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = theme.colors.border;
        }}
      />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
        }}
      >
        {right}
      </div>
    </div>
  );
};

export default SplitPane;
