import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { PCBEditor } from '@opencad/pcb';
import { useAppStore } from '../store/app-store';
import { useTheme } from '../theme/ThemeProvider';
export const PCBCanvas = () => {
    const { theme } = useTheme();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const activeTool = useAppStore((s) => s.activeTool);
    const activeLayer = useAppStore((s) => s.activeLayer);
    const pcbDocument = useAppStore((s) => s.pcbDocument);
    // Initialize editor
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const editor = new PCBEditor(canvas);
        editorRef.current = editor;
        editor.startRenderLoop();
        return () => {
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
        if (!container || !canvas)
            return;
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
            editorRef.current.setActiveLayer(activeLayer);
        }
    }, [activeLayer]);
    const cursorMap = {
        select: 'default',
        route: 'crosshair',
        via: 'crosshair',
        zone: 'crosshair',
        footprint: 'copy',
        measure: 'crosshair',
    };
    return (_jsx("div", { ref: containerRef, style: {
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#0a0a1a',
            position: 'relative',
        }, children: _jsx("canvas", { ref: canvasRef, tabIndex: 0, style: {
                display: 'block',
                outline: 'none',
                cursor: cursorMap[activeTool] || 'default',
            } }) }));
};
export default PCBCanvas;
//# sourceMappingURL=PCBCanvas.js.map