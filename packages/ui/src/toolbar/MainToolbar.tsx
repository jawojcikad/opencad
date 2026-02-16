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
    {
      id: 'schematic' as const,
      label: 'Schematic',
      icon: <Icon name="wire" size={14} />,
      tooltip: 'Switch to schematic editor view',
    },
    {
      id: 'pcb' as const,
      label: 'PCB',
      icon: <Icon name="layer" size={14} />,
      tooltip: 'Switch to PCB layout editor view',
    },
    {
      id: '3d' as const,
      label: '3D',
      icon: <Icon name="isometric" size={14} />,
      tooltip: 'Switch to interactive 3D board viewer',
    },
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
      <ToolButton
        icon="file-new"
        label="New Project (Ctrl+N)"
        tooltip="Create a new empty project"
        onClick={() => {}}
      />
      <ToolButton
        icon="file-open"
        label="Open Project (Ctrl+O)"
        tooltip="Open design files from disk"
        onClick={openFile}
      />
      <ToolButton
        icon="file-save"
        label={`Save Project (Ctrl+S)${projectModified ? ' *' : ''}`}
        tooltip="Save current project"
        onClick={() => {}}
      />
      <ToolButton icon="export" label="Export..." tooltip="Export manufacturing/output files" onClick={() => {}} />

      <Separator />

      {/* Edit buttons */}
      <ToolButton icon="undo" label="Undo (Ctrl+Z)" tooltip="Undo last action" onClick={() => {}} />
      <ToolButton icon="redo" label="Redo (Ctrl+Shift+Z)" tooltip="Redo last undone action" onClick={() => {}} />
      <Separator />
      <ToolButton icon="cut" label="Cut (Ctrl+X)" tooltip="Cut selected items" onClick={() => {}} />
      <ToolButton icon="copy" label="Copy (Ctrl+C)" tooltip="Copy selected items" onClick={() => {}} />
      <ToolButton icon="paste" label="Paste (Ctrl+V)" tooltip="Paste from clipboard" onClick={() => {}} />
      <ToolButton icon="delete" label="Delete (Del)" tooltip="Delete selected items" onClick={() => {}} />

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
            tooltip="Select and move schematic objects"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
          <ToolButton
            icon="wire"
            label="Draw Wire (W)"
            tooltip="Draw electrical wires"
            active={activeTool === 'wire'}
            onClick={() => setActiveTool('wire')}
          />
          <ToolButton
            icon="component"
            label="Place Component (P)"
            tooltip="Place component symbols"
            active={activeTool === 'component'}
            onClick={() => setActiveTool('component')}
          />
          <ToolButton
            icon="net-label"
            label="Net Label (L)"
            tooltip="Place net labels"
            active={activeTool === 'net-label'}
            onClick={() => setActiveTool('net-label')}
          />
          <ToolButton
            icon="power"
            label="Power Port"
            tooltip="Place power and ground ports"
            active={activeTool === 'power'}
            onClick={() => setActiveTool('power')}
          />
          <Separator />
          <ToolButton icon="erc" label="Run ERC" tooltip="Run electrical rule check" onClick={() => {}} />
        </>
      )}

      {mode === 'pcb' && (
        <>
          <ToolButton
            icon="select"
            label="Select (S)"
            tooltip="Select and move PCB objects"
            active={activeTool === 'select'}
            onClick={() => setActiveTool('select')}
          />
          <ToolButton
            icon="route"
            label="Route Track (X)"
            tooltip="Route copper tracks"
            active={activeTool === 'route'}
            onClick={() => setActiveTool('route')}
          />
          <ToolButton
            icon="via"
            label="Place Via (V)"
            tooltip="Place a via between layers"
            active={activeTool === 'via'}
            onClick={() => setActiveTool('via')}
          />
          <ToolButton
            icon="zone"
            label="Draw Zone (Z)"
            tooltip="Draw copper pour zone"
            active={activeTool === 'zone'}
            onClick={() => setActiveTool('zone')}
          />
          <ToolButton
            icon="footprint"
            label="Place Footprint"
            tooltip="Place PCB footprint"
            active={activeTool === 'footprint'}
            onClick={() => setActiveTool('footprint')}
          />
          <ToolButton
            icon="measure"
            label="Measure (M)"
            tooltip="Measure distances on PCB"
            active={activeTool === 'measure'}
            onClick={() => setActiveTool('measure')}
          />
          <Separator />
          <ToolButton icon="drc" label="Run DRC" tooltip="Run design rule check" onClick={() => {}} />
          <ToolButton icon="gerber" label="Generate Gerber" tooltip="Generate Gerber fabrication files" onClick={() => {}} />
        </>
      )}

      {mode === '3d' && (
        <>
          <ToolButton icon="reset-view" label="Reset View" tooltip="Reset camera to default view" onClick={() => {}} />
          <ToolButton icon="top-view" label="Top View" tooltip="View board from top" onClick={() => {}} />
          <ToolButton icon="bottom-view" label="Bottom View" tooltip="View board from bottom" onClick={() => {}} />
          <ToolButton icon="isometric" label="Isometric View" tooltip="View board in isometric perspective" onClick={() => {}} />
          <Separator />
          <ToolButton icon="toggle-components" label="Toggle Components" tooltip="Show or hide 3D components" onClick={() => {}} />
        </>
      )}
    </div>
  );
};

export default MainToolbar;
