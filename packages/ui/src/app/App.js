import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useAppStore } from '../store/app-store';
import { Layout } from './Layout';
import { MainToolbar } from '../toolbar/MainToolbar';
import { SchematicCanvas } from '../canvas/SchematicCanvas';
import { PCBCanvas } from '../canvas/PCBCanvas';
import { Viewer3DCanvas } from '../canvas/Viewer3DCanvas';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { LayerPanel } from '../panels/LayerPanel';
import { LibraryPanel } from '../panels/LibraryPanel';
import { NetInspectorPanel } from '../panels/NetInspectorPanel';
import { Icon } from '../common/Icon';
import { applyImportResult, importFiles } from './file-import';
const StatusBar = () => {
    const { theme } = useTheme();
    const mode = useAppStore((s) => s.mode);
    const cursorX = useAppStore((s) => s.cursorX);
    const cursorY = useAppStore((s) => s.cursorY);
    const zoomLevel = useAppStore((s) => s.zoomLevel);
    const activeLayer = useAppStore((s) => s.activeLayer);
    const activeTool = useAppStore((s) => s.activeTool);
    const projectName = useAppStore((s) => s.projectName);
    const projectModified = useAppStore((s) => s.projectModified);
    const selectedIds = useAppStore((s) => s.selectedIds);
    const toggleTheme = useTheme().toggleTheme;
    const modeLabel = mode === 'schematic' ? 'Schematic' : mode === 'pcb' ? 'PCB' : '3D View';
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            height: 24,
            backgroundColor: theme.colors.surface,
            borderTop: `1px solid ${theme.colors.border}`,
            padding: '0 12px',
            gap: 16,
            fontSize: 11,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.mono,
            flexShrink: 0,
            overflow: 'hidden',
        }, children: [_jsxs("span", { style: { color: theme.colors.text, fontWeight: 500 }, children: [projectName, projectModified ? ' *' : ''] }), _jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsx("span", { children: modeLabel }), _jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsxs("span", { children: ["Tool: ", _jsx("span", { style: { color: theme.colors.text }, children: activeTool })] }), mode === 'pcb' && (_jsxs(_Fragment, { children: [_jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsxs("span", { children: ["Layer: ", _jsx("span", { style: { color: theme.colors.text }, children: activeLayer })] })] })), _jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsxs("span", { children: ["X: ", _jsx("span", { style: { color: theme.colors.text }, children: cursorX.toFixed(2) }), "\u00A0 Y: ", _jsx("span", { style: { color: theme.colors.text }, children: cursorY.toFixed(2) }), "\u00A0 mm"] }), _jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsxs("span", { children: ["Zoom: ", _jsxs("span", { style: { color: theme.colors.text }, children: [(zoomLevel * 100).toFixed(0), "%"] })] }), selectedIds.size > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { style: { color: theme.colors.border }, children: "|" }), _jsxs("span", { children: ["Selected: ", _jsx("span", { style: { color: theme.colors.text }, children: selectedIds.size })] })] })), _jsx("div", { style: { flex: 1 } }), _jsx("button", { onClick: toggleTheme, style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                }, title: "Toggle theme", children: _jsx(Icon, { name: "eye", size: 12, color: theme.colors.textSecondary }) })] }));
};
const AppContent = () => {
    const mode = useAppStore((s) => s.mode);
    const showLayerPanel = useAppStore((s) => s.showLayerPanel);
    const showPropertiesPanel = useAppStore((s) => s.showPropertiesPanel);
    const showLibraryPanel = useAppStore((s) => s.showLibraryPanel);
    const showNetInspector = useAppStore((s) => s.showNetInspector);
    const [isDragging, setIsDragging] = useState(false);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        if (!files.length)
            return;
        try {
            const result = await importFiles(files);
            applyImportResult(result);
            if (result.message) {
                alert(result.message);
            }
        }
        catch (err) {
            console.error('[OpenCAD] Failed to import dropped file:', err);
            alert(`Failed to open file: ${err.message}`);
        }
    }, []);
    const canvas = useMemo(() => {
        switch (mode) {
            case 'schematic':
                return _jsx(SchematicCanvas, {});
            case 'pcb':
                return _jsx(PCBCanvas, {});
            case '3d':
                return _jsx(Viewer3DCanvas, {});
        }
    }, [mode]);
    // Left panel: show library or net inspector depending on which is open
    const leftPanel = useMemo(() => {
        if (showLibraryPanel && showNetInspector) {
            return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx(LibraryPanel, {}) }), _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx(NetInspectorPanel, {}) })] }));
        }
        if (showLibraryPanel)
            return _jsx(LibraryPanel, {});
        if (showNetInspector)
            return _jsx(NetInspectorPanel, {});
        return null;
    }, [showLibraryPanel, showNetInspector]);
    // Right panel: properties + optional layer panel
    const rightPanel = useMemo(() => {
        if (showPropertiesPanel && showLayerPanel && mode === 'pcb') {
            return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%' }, children: [_jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx(PropertiesPanel, {}) }), _jsx("div", { style: { flex: 1, overflow: 'hidden' }, children: _jsx(LayerPanel, {}) })] }));
        }
        if (showPropertiesPanel)
            return _jsx(PropertiesPanel, {});
        if (showLayerPanel && mode === 'pcb')
            return _jsx(LayerPanel, {});
        return null;
    }, [showPropertiesPanel, showLayerPanel, mode]);
    const showLeft = showLibraryPanel || showNetInspector;
    const showRight = showPropertiesPanel || (showLayerPanel && mode === 'pcb');
    return (_jsxs("div", { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, style: { width: '100%', height: '100%', position: 'relative' }, children: [_jsx(Layout, { toolbar: _jsx(MainToolbar, {}), leftPanel: leftPanel, center: canvas, rightPanel: rightPanel, statusBar: _jsx(StatusBar, {}), showLeft: showLeft, showRight: showRight }), isDragging && (_jsx("div", { style: {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 125, 255, 0.15)',
                    border: '3px dashed #0f7dff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, pointerEvents: 'none',
                }, children: _jsx("div", { style: { color: '#0f7dff', fontSize: 24, fontWeight: 600 }, children: "Drop KiCad or OpenCAD file to open" }) }))] }));
};
export const App = () => {
    return (_jsx(ThemeProvider, { defaultTheme: "dark", children: _jsx(AppContent, {}) }));
};
export default App;
//# sourceMappingURL=App.js.map