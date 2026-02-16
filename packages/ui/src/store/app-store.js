import { create } from 'zustand';
import { applyImportResult, importFiles } from '../app/file-import';
export const useAppStore = create((set) => ({
    // Mode
    mode: 'schematic',
    setMode: (mode) => set({ mode, activeTool: 'select' }),
    // Project
    projectName: 'Untitled Project',
    projectModified: false,
    setProjectName: (projectName) => set({ projectName }),
    setProjectModified: (projectModified) => set({ projectModified }),
    // Selection
    selectedIds: new Set(),
    setSelection: (selectedIds) => set({ selectedIds }),
    // Active layer
    activeLayer: 'F.Cu',
    setActiveLayer: (activeLayer) => set({ activeLayer }),
    // Tool
    activeTool: 'select',
    setActiveTool: (activeTool) => set({ activeTool }),
    // Panels
    showLayerPanel: true,
    showPropertiesPanel: true,
    showLibraryPanel: false,
    showNetInspector: false,
    togglePanel: (panel) => set((state) => {
        switch (panel) {
            case 'layer':
                return { showLayerPanel: !state.showLayerPanel };
            case 'properties':
                return { showPropertiesPanel: !state.showPropertiesPanel };
            case 'library':
                return { showLibraryPanel: !state.showLibraryPanel };
            case 'netInspector':
                return { showNetInspector: !state.showNetInspector };
            default:
                return {};
        }
    }),
    // Violations
    violations: [],
    setViolations: (violations) => set({ violations }),
    // Cursor
    cursorX: 0,
    cursorY: 0,
    setCursorPosition: (cursorX, cursorY) => set({ cursorX, cursorY }),
    // Zoom
    zoomLevel: 1.0,
    setZoomLevel: (zoomLevel) => set({ zoomLevel }),
    // Documents
    schematicDocument: null,
    pcbDocument: null,
    setSchematicDocument: (schematicDocument) => set({ schematicDocument }),
    setPCBDocument: (pcbDocument) => set({ pcbDocument }),
    // File open
    openFile: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.kicad_pro,.kicad_sch,.kicad_pcb,.opencad,.json';
        input.onchange = async (e) => {
            const selectedFiles = Array.from(e.target.files ?? []);
            if (!selectedFiles.length)
                return;
            try {
                const result = await importFiles(selectedFiles);
                applyImportResult(result);
                if (result.message) {
                    alert(result.message);
                }
            }
            catch (err) {
                console.error('[OpenCAD] Failed to import file:', err);
                alert(`Failed to open file: ${err.message}`);
            }
        };
        input.click();
    },
}));
//# sourceMappingURL=app-store.js.map