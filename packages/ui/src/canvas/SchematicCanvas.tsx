import React, { useRef, useEffect } from 'react';
import { SchematicEditor } from '@opencad/schematic';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';

export const SchematicCanvas: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<SchematicEditor | null>(null);

  const activeTool = useAppStore((s) => s.activeTool);
  const schematicDocument = useAppStore((s) => s.schematicDocument);

  // Initialize editor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editor = new SchematicEditor(canvas);
    editorRef.current = editor;
    editor.startRenderLoop();

    // Subscribe to selection events and push to store
    const unsub = editor.getEventBus().on('selection:changed', (selection: Set<string>) => {
      useAppStore.getState().setSelection(new Set(selection));
    });

    return () => {
      unsub();
      editor.stopRenderLoop();
      editorRef.current = null;
    };
  }, []);

  // Load document into editor when store data changes
  useEffect(() => {
    if (editorRef.current && schematicDocument) {
      editorRef.current.loadDocument(schematicDocument);
    }
  }, [schematicDocument]);

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

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: theme.colors.schematicBackground,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{
          display: 'block',
          outline: 'none',
          cursor: activeTool === 'select' ? 'default' : 'crosshair',
        }}
      />
    </div>
  );
};

export default SchematicCanvas;
