import React, { useRef, useEffect } from 'react';
import { PCB3DViewer } from '@opencad/viewer3d';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from '../store/app-store';

export const Viewer3DCanvas: React.FC = () => {
  const { theme } = useTheme();
  const pcbDocument = useAppStore((state) => state.pcbDocument);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PCB3DViewer | null>(null);

  // Initialize 3D viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const viewer = new PCB3DViewer(container);
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Load PCB into 3D view whenever document changes
  useEffect(() => {
    if (!pcbDocument || !viewerRef.current) return;
    viewerRef.current.loadPCB(pcbDocument);
  }, [pcbDocument]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          viewerRef.current?.onResize();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        position: 'relative',
      }}
    />
  );
};

export default Viewer3DCanvas;
