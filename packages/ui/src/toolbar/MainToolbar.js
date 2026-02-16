import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../theme/ThemeProvider';
import { useAppStore } from '../store/app-store';
import { ToolButton } from './ToolButton';
import { Tabs } from '../common/Tabs';
import { Icon } from '../common/Icon';
const Separator = () => {
    const { theme } = useTheme();
    return (_jsx("div", { style: {
            width: 1,
            height: 20,
            backgroundColor: theme.colors.border,
            margin: '0 4px',
            flexShrink: 0,
        } }));
};
export const MainToolbar = () => {
    const { theme } = useTheme();
    const mode = useAppStore((s) => s.mode);
    const setMode = useAppStore((s) => s.setMode);
    const activeTool = useAppStore((s) => s.activeTool);
    const setActiveTool = useAppStore((s) => s.setActiveTool);
    const projectModified = useAppStore((s) => s.projectModified);
    const openFile = useAppStore((s) => s.openFile);
    const modeTabs = [
        { id: 'schematic', label: 'Schematic', icon: _jsx(Icon, { name: "wire", size: 14 }) },
        { id: 'pcb', label: 'PCB', icon: _jsx(Icon, { name: "layer", size: 14 }) },
        { id: '3d', label: '3D', icon: _jsx(Icon, { name: "isometric", size: 14 }) },
    ];
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            height: 40,
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.border}`,
            padding: '0 8px',
            gap: 2,
            flexShrink: 0,
            overflow: 'hidden',
        }, children: [_jsx(ToolButton, { icon: "file-new", label: "New Project (Ctrl+N)", onClick: () => { } }), _jsx(ToolButton, { icon: "file-open", label: "Open Project (Ctrl+O)", onClick: openFile }), _jsx(ToolButton, { icon: "file-save", label: `Save Project (Ctrl+S)${projectModified ? ' *' : ''}`, onClick: () => { } }), _jsx(ToolButton, { icon: "export", label: "Export...", onClick: () => { } }), _jsx(Separator, {}), _jsx(ToolButton, { icon: "undo", label: "Undo (Ctrl+Z)", onClick: () => { } }), _jsx(ToolButton, { icon: "redo", label: "Redo (Ctrl+Shift+Z)", onClick: () => { } }), _jsx(Separator, {}), _jsx(ToolButton, { icon: "cut", label: "Cut (Ctrl+X)", onClick: () => { } }), _jsx(ToolButton, { icon: "copy", label: "Copy (Ctrl+C)", onClick: () => { } }), _jsx(ToolButton, { icon: "paste", label: "Paste (Ctrl+V)", onClick: () => { } }), _jsx(ToolButton, { icon: "delete", label: "Delete (Del)", onClick: () => { } }), _jsx(Separator, {}), _jsx(Tabs, { tabs: modeTabs, activeTab: mode, onTabChange: (id) => setMode(id), style: { borderBottom: 'none', marginLeft: 4, marginRight: 4 } }), _jsx(Separator, {}), mode === 'schematic' && (_jsxs(_Fragment, { children: [_jsx(ToolButton, { icon: "select", label: "Select (S)", active: activeTool === 'select', onClick: () => setActiveTool('select') }), _jsx(ToolButton, { icon: "wire", label: "Draw Wire (W)", active: activeTool === 'wire', onClick: () => setActiveTool('wire') }), _jsx(ToolButton, { icon: "component", label: "Place Component (P)", active: activeTool === 'component', onClick: () => setActiveTool('component') }), _jsx(ToolButton, { icon: "net-label", label: "Net Label (L)", active: activeTool === 'net-label', onClick: () => setActiveTool('net-label') }), _jsx(ToolButton, { icon: "power", label: "Power Port", active: activeTool === 'power', onClick: () => setActiveTool('power') }), _jsx(Separator, {}), _jsx(ToolButton, { icon: "erc", label: "Run ERC", onClick: () => { } })] })), mode === 'pcb' && (_jsxs(_Fragment, { children: [_jsx(ToolButton, { icon: "select", label: "Select (S)", active: activeTool === 'select', onClick: () => setActiveTool('select') }), _jsx(ToolButton, { icon: "route", label: "Route Track (X)", active: activeTool === 'route', onClick: () => setActiveTool('route') }), _jsx(ToolButton, { icon: "via", label: "Place Via (V)", active: activeTool === 'via', onClick: () => setActiveTool('via') }), _jsx(ToolButton, { icon: "zone", label: "Draw Zone (Z)", active: activeTool === 'zone', onClick: () => setActiveTool('zone') }), _jsx(ToolButton, { icon: "footprint", label: "Place Footprint", active: activeTool === 'footprint', onClick: () => setActiveTool('footprint') }), _jsx(ToolButton, { icon: "measure", label: "Measure (M)", active: activeTool === 'measure', onClick: () => setActiveTool('measure') }), _jsx(Separator, {}), _jsx(ToolButton, { icon: "drc", label: "Run DRC", onClick: () => { } }), _jsx(ToolButton, { icon: "gerber", label: "Generate Gerber", onClick: () => { } })] })), mode === '3d' && (_jsxs(_Fragment, { children: [_jsx(ToolButton, { icon: "reset-view", label: "Reset View", onClick: () => { } }), _jsx(ToolButton, { icon: "top-view", label: "Top View", onClick: () => { } }), _jsx(ToolButton, { icon: "bottom-view", label: "Bottom View", onClick: () => { } }), _jsx(ToolButton, { icon: "isometric", label: "Isometric View", onClick: () => { } }), _jsx(Separator, {}), _jsx(ToolButton, { icon: "toggle-components", label: "Toggle Components", onClick: () => { } })] }))] }));
};
export default MainToolbar;
//# sourceMappingURL=MainToolbar.js.map