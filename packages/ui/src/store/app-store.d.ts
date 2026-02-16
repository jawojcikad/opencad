export type EditorMode = 'schematic' | 'pcb' | '3d';
interface AppState {
    mode: EditorMode;
    setMode: (mode: EditorMode) => void;
    projectName: string;
    projectModified: boolean;
    setProjectName: (name: string) => void;
    setProjectModified: (modified: boolean) => void;
    selectedIds: Set<string>;
    setSelection: (ids: Set<string>) => void;
    activeLayer: string;
    setActiveLayer: (layer: string) => void;
    activeTool: string;
    setActiveTool: (tool: string) => void;
    showLayerPanel: boolean;
    showPropertiesPanel: boolean;
    showLibraryPanel: boolean;
    showNetInspector: boolean;
    togglePanel: (panel: string) => void;
    violations: any[];
    setViolations: (violations: any[]) => void;
    cursorX: number;
    cursorY: number;
    setCursorPosition: (x: number, y: number) => void;
    zoomLevel: number;
    setZoomLevel: (zoom: number) => void;
    schematicDocument: any | null;
    pcbDocument: any | null;
    setSchematicDocument: (doc: any) => void;
    setPCBDocument: (doc: any) => void;
    openFile: () => void;
}
export declare const useAppStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AppState>>;
export {};
//# sourceMappingURL=app-store.d.ts.map