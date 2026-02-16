import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore, EditorMode } from '../store/app-store';
import { ToolButton } from './ToolButton';
import { Tabs } from '../common/Tabs';
import { Icon } from '../common/Icon';

const Separator: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        width: 1,
        height: 20,
        backgroundColor: theme.colors.border,
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  );
};

export const MainToolbar: React.FC = () => {
  const { theme } = useTheme();
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const activeTool = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const projectModified = useAppStore((s) => s.projectModified);
  const openFile = useAppStore((s) => s.openFile);

  const modeTabs = [
    { id: 'schematic' as const, label: 'Schematic', icon: <Icon name="wire" size={14} /> },
    { id: 'pcb' as const, label: 'PCB', icon: <Icon name="layer" size={14} /> },
    { id: '3d' as const, label: '3D', icon: <Icon name="isometric" size={14} /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 40,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: '0 8px',
        gap: 2,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* File buttons */}
      <ToolButton icon="file-new" label="New Project (Ctrl+N)" onClick={() => {}} />
      <ToolButton icon="file-open" label="Open Project (Ctrl+O)" onClick={openFile} />
      <ToolButton
        icon="file-save"
        label={`Save Project (Ctrl+S)${projectModified ? ' *' : ''}`}
        onClick={() => {}}
      />
      <ToolButton icon="export" label="Export..." onClick={() => {}} />

      <Separator />

      {/* Edit buttons */}
      <ToolButton icon="undo" label="Undo (Ctrl+Z)" onClick={() => {}} />
      <ToolButton icon="redo" label="Redo (Ctrl+Shift+Z)" onClick={() => {}} />
      <Separator />
      <ToolButton icon="cut" label="Cut (Ctrl+X)" onClick={() => {}} />
      <ToolButton icon="copy" label="Copy (Ctrl+C)" onClick={() => {}} />
      <ToolButton icon="paste" label="Paste (Ctrl+V)" onClick={() => {}} />
      <ToolButton icon="delete" label="Delete (Del)" onClick={() => {}} />

      <Separator />

      {/* Mode tabs */}
      <Tabs
        tabs={modeTabs}
        activeTab={mode}
        onTabChange={(id) => setMode(id as EditorMode)}
        style={{ borderBottom: 'none', marginLeft: 4, marginRight: 4 }}
      />

      <Separator />

      {/* Tool-specific buttons */}
      {mode === 'schematic' && (
        <>
          <ToolButton
            icon="select"
            label="Select (S)"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
          <ToolButton
            icon="wire"
            label="Draw Wire (W)"
            active={activeTool === 'wire'}
            onClick={() => setActiveTool('wire')}
          />
          <ToolButton
            icon="component"
            label="Place Component (P)"
            active={activeTool === 'component'}
            onClick={() => setActiveTool('component')}
          />
          <ToolButton
            icon="net-label"
            label="Net Label (L)"
            active={activeTool === 'net-label'}
            onClick={() => setActiveTool('net-label')}
          />
          <ToolButton
            icon="power"
            label="Power Port"
            active={activeTool === 'power'}
            onClick={() => setActiveTool('power')}
          />
          <Separator />
          <ToolButton icon="erc" label="Run ERC" onClick={() => {}} />
        </>
      )}

      {mode === 'pcb' && (
        <>
          <ToolButton
            icon="select"
            label="Select (S)"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
          <ToolButton
            icon="route"
            label="Route Track (X)"
            active={activeTool === 'route'}
            onClick={() => setActiveTool('route')}
          />
          <ToolButton
            icon="via"
            label="Place Via (V)"
            active={activeTool === 'via'}
            onClick={() => setActiveTool('via')}
          />
          <ToolButton
            icon="zone"
            label="Draw Zone (Z)"
            active={activeTool === 'zone'}
            onClick={() => setActiveTool('zone')}
          />
          <ToolButton
            icon="footprint"
            label="Place Footprint"
            active={activeTool === 'footprint'}
            onClick={() => setActiveTool('footprint')}
          />
          <ToolButton
            icon="measure"
            label="Measure (M)"
            active={activeTool === 'measure'}
            onClick={() => setActiveTool('measure')}
          />
          <Separator />
          <ToolButton icon="drc" label="Run DRC" onClick={() => {}} />
          <ToolButton icon="gerber" label="Generate Gerber" onClick={() => {}} />
        </>
      )}

      {mode === '3d' && (
        <>
          <ToolButton icon="reset-view" label="Reset View" onClick={() => {}} />
          <ToolButton icon="top-view" label="Top View" onClick={() => {}} />
          <ToolButton icon="bottom-view" label="Bottom View" onClick={() => {}} />
          <ToolButton icon="isometric" label="Isometric View" onClick={() => {}} />
          <Separator />
          <ToolButton icon="toggle-components" label="Toggle Components" onClick={() => {}} />
        </>
      )}
    </div>
  );
};

export default MainToolbar;
