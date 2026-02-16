import React, { useCallback, useMemo, useState } from 'react';
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
import { DRCPanel } from '../panels/DRCPanel';
import { Icon } from '../common/Icon';
import { applyImportResult, importFiles } from './file-import';

const StatusBar: React.FC = () => {
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

  return (
    <div
      style={{
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
      }}
    >
      {/* Project name */}
      <span style={{ color: theme.colors.text, fontWeight: 500 }}>
        {projectName}
        {projectModified ? ' *' : ''}
      </span>

      <span style={{ color: theme.colors.border }}>|</span>

      {/* Mode */}
      <span>{modeLabel}</span>

      <span style={{ color: theme.colors.border }}>|</span>

      {/* Tool */}
      <span>
        Tool: <span style={{ color: theme.colors.text }}>{activeTool}</span>
      </span>

      {/* Active layer (PCB only) */}
      {mode === 'pcb' && (
        <>
          <span style={{ color: theme.colors.border }}>|</span>
          <span>
            Layer: <span style={{ color: theme.colors.text }}>{activeLayer}</span>
          </span>
        </>
      )}

      <span style={{ color: theme.colors.border }}>|</span>

      {/* Coordinates */}
      <span>
        X: <span style={{ color: theme.colors.text }}>{cursorX.toFixed(2)}</span>
        &nbsp; Y: <span style={{ color: theme.colors.text }}>{cursorY.toFixed(2)}</span>
        &nbsp; mm
      </span>

      <span style={{ color: theme.colors.border }}>|</span>

      {/* Zoom */}
      <span>
        Zoom: <span style={{ color: theme.colors.text }}>{(zoomLevel * 100).toFixed(0)}%</span>
      </span>

      {/* Selection count */}
      {selectedIds.size > 0 && (
        <>
          <span style={{ color: theme.colors.border }}>|</span>
          <span>
            Selected: <span style={{ color: theme.colors.text }}>{selectedIds.size}</span>
          </span>
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
        }}
        title="Toggle theme"
      >
        <Icon name="eye" size={12} color={theme.colors.textSecondary} />
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const mode = useAppStore((s) => s.mode);
  const showLayerPanel = useAppStore((s) => s.showLayerPanel);
  const showPropertiesPanel = useAppStore((s) => s.showPropertiesPanel);
  const showLibraryPanel = useAppStore((s) => s.showLibraryPanel);
  const showNetInspector = useAppStore((s) => s.showNetInspector);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;

    try {
      const result = await importFiles(files);
      applyImportResult(result);
      if (result.message) {
        alert(result.message);
      }
    } catch (err) {
      console.error('[OpenCAD] Failed to import dropped file:', err);
      alert(`Failed to open file: ${(err as Error).message}`);
    }
  }, []);

  const canvas = useMemo(() => {
    switch (mode) {
      case 'schematic':
        return <SchematicCanvas />;
      case 'pcb':
        return <PCBCanvas />;
      case '3d':
        return <Viewer3DCanvas />;
    }
  }, [mode]);

  // Left panel: show library or net inspector depending on which is open
  const leftPanel = useMemo(() => {
    if (showLibraryPanel && showNetInspector) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LibraryPanel />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NetInspectorPanel />
          </div>
        </div>
      );
    }
    if (showLibraryPanel) return <LibraryPanel />;
    if (showNetInspector) return <NetInspectorPanel />;
    return null;
  }, [showLibraryPanel, showNetInspector]);

  // Right panel: properties + optional layer panel
  const rightPanel = useMemo(() => {
    if (showPropertiesPanel && showLayerPanel && mode === 'pcb') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PropertiesPanel />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LayerPanel />
          </div>
        </div>
      );
    }
    if (showPropertiesPanel) return <PropertiesPanel />;
    if (showLayerPanel && mode === 'pcb') return <LayerPanel />;
    return null;
  }, [showPropertiesPanel, showLayerPanel, mode]);

  const showLeft = showLibraryPanel || showNetInspector;
  const showRight = showPropertiesPanel || (showLayerPanel && mode === 'pcb');

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Layout
        toolbar={<MainToolbar />}
        leftPanel={leftPanel}
        center={canvas}
        rightPanel={rightPanel}
        statusBar={<StatusBar />}
        showLeft={showLeft}
        showRight={showRight}
      />
      {isDragging && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 125, 255, 0.15)',
          border: '3px dashed #0f7dff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, pointerEvents: 'none',
        }}>
          <div style={{ color: '#0f7dff', fontSize: 24, fontWeight: 600 }}>
            Drop KiCad or OpenCAD file to open
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
