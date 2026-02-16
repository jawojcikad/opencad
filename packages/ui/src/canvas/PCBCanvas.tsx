import React, { useRef, useEffect } from 'react';
import { PCBEditor } from '@opencad/pcb';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';

export const PCBCanvas: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<PCBEditor | null>(null);

  const activeTool = useAppStore((s) => s.activeTool);
  const activeLayer = useAppStore((s) => s.activeLayer);
  const layerVisibility = useAppStore((s) => s.pcbLayerVisibility);
  const pcbDocument = useAppStore((s) => s.pcbDocument);

  // Initialize editor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editor = new PCBEditor(canvas);
    for (const [layerName, visible] of Object.entries(useAppStore.getState().pcbLayerVisibility)) {
      editor.setLayerVisibility(layerName as any, visible);
    }
    editorRef.current = editor;
    editor.startRenderLoop();

    // Subscribe to selection events and push to store
    const unsub = editor.getEventBus().on('pcb:selection-changed', (event: { selection: string[] }) => {
      useAppStore.getState().setSelection(new Set(event.selection));
    });

    return () => {
      unsub();
      editor.stopRenderLoop();
      editorRef.current = null;
    };
  }, []);

  // Load document into editor when store data changes
  useEffect(() => {
    if (editorRef.current && pcbDocument) {
      editorRef.current.loadDocument(pcbDocument);
    }
  }, [pcbDocument]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        editorRef.current?.resize?.(width, height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Sync active layer
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setActiveLayer(activeLayer as any);
    }
  }, [activeLayer]);

  useEffect(() => {
    if (!editorRef.current) return;
    for (const [layerName, visible] of Object.entries(layerVisibility)) {
      editorRef.current.setLayerVisibility(layerName as any, visible);
    }
  }, [layerVisibility]);

  const cursorMap: Record<string, string> = {
    select: 'default',
    route: 'crosshair',
    via: 'crosshair',
    zone: 'crosshair',
    footprint: 'copy',
    measure: 'crosshair',
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0a0a1a',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{
          display: 'block',
          outline: 'none',
          cursor: cursorMap[activeTool] || 'default',
        }}
      />
    </div>
  );
};

export default PCBCanvas;
