import { create } from 'zustand';
import { applyImportResult, importFiles } from '../app/file-import';

export type EditorMode = 'schematic' | 'pcb' | '3d';

interface AppState {
  // Mode
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;

  // Project
  projectName: string;
  projectModified: boolean;
  setProjectName: (name: string) => void;
  setProjectModified: (modified: boolean) => void;

  // Selection
  selectedIds: Set<string>;
  setSelection: (ids: Set<string>) => void;

  // Active layer (PCB mode)
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  pcbLayerVisibility: Record<string, boolean>;
  setPCBLayerVisibility: (layer: string, visible: boolean) => void;

  // Tool
  activeTool: string;
  setActiveTool: (tool: string) => void;

  // Panels
  showLayerPanel: boolean;
  showPropertiesPanel: boolean;
  showLibraryPanel: boolean;
  showNetInspector: boolean;
  togglePanel: (panel: string) => void;

  // DRC/ERC results
  violations: any[];
  setViolations: (violations: any[]) => void;

  // Cursor position (for status bar)
  cursorX: number;
  cursorY: number;
  setCursorPosition: (x: number, y: number) => void;

  // Zoom
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  // Documents
  schematicDocument: any | null;
  pcbDocument: any | null;
  setSchematicDocument: (doc: any) => void;
  setPCBDocument: (doc: any) => void;

  // File open
  openFile: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Mode
  mode: 'schematic',
  setMode: (mode) => set({ mode, activeTool: 'select' }),

  // Project
  projectName: 'Untitled Project',
  projectModified: false,
  setProjectName: (projectName) => set({ projectName }),
  setProjectModified: (projectModified) => set({ projectModified }),

  // Selection
  selectedIds: new Set<string>(),
  setSelection: (selectedIds) => set({ selectedIds }),

  // Active layer
  activeLayer: 'F.Cu',
  setActiveLayer: (activeLayer) => set({ activeLayer }),
  pcbLayerVisibility: {
    'F.Cu': true,
    'B.Cu': true,
    'F.SilkS': true,
    'B.SilkS': true,
    'F.Mask': true,
    'B.Mask': true,
    'F.Paste': false,
    'B.Paste': false,
    'F.CrtYd': true,
    'B.CrtYd': false,
    'Edge.Cuts': true,
    'Dwgs.User': true,
    'Cmts.User': false,
    'In1.Cu': false,
    'In2.Cu': false,
  },
  setPCBLayerVisibility: (layer, visible) =>
    set((state) => ({
      pcbLayerVisibility: {
        ...state.pcbLayerVisibility,
        [layer]: visible,
      },
    })),

  // Tool
  activeTool: 'select',
  setActiveTool: (activeTool) => set({ activeTool }),

  // Panels
  showLayerPanel: true,
  showPropertiesPanel: true,
  showLibraryPanel: false,
  showNetInspector: false,
  togglePanel: (panel) =>
    set((state) => {
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
    const runPicker = (directory: boolean): Promise<File[]> => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.kicad_pro,.kicad_sch,.sch,.schm,.kicad_pcb,.pcb,.brd,.opencad,.json';
      if (directory) {
        (input as any).webkitdirectory = true;
      }
      input.onchange = (e) => {
        resolve(Array.from((e.target as HTMLInputElement).files ?? []));
      };
      input.click();
    });

    const handleImport = async (selectedFiles: File[], fromDirectory = false): Promise<void> => {
      if (!selectedFiles.length) return;
      try {
        const result = await importFiles(selectedFiles);
        applyImportResult(result);
        if (result.message) {
          alert(result.message);
        }

        if (
          !fromDirectory &&
          selectedFiles.length === 1 &&
          !result.schematicDocument &&
          !result.pcbDocument
        ) {
          const shouldScanFolder = confirm(
            'No design content loaded from the selected file. Scan the whole project folder to auto-load matching files?',
          );
          if (shouldScanFolder) {
            const folderFiles = await runPicker(true);
            await handleImport(folderFiles, true);
          }
        }
      } catch (err) {
        console.error('[OpenCAD] Failed to import file:', err);
        alert(`Failed to open file: ${(err as Error).message}`);
      }
    };

    void runPicker(false).then((selectedFiles) => handleImport(selectedFiles));
  },
}));
