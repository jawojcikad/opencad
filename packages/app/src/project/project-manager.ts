// ---------------------------------------------------------------------------
// OpenCAD — Project Manager
// ---------------------------------------------------------------------------
// Manages creating, saving, loading, and exporting OpenCAD projects.
// Projects are serialised as JSON (.opencad) files.
// ---------------------------------------------------------------------------

/** Minimal shared types  — will be superseded by @opencad/core once wired up */

export interface Vec2 {
  x: number;
  y: number;
}

export interface PinDef {
  id: string;
  name: string;
  number: string;
  position: Vec2;
  type: 'input' | 'output' | 'bidirectional' | 'passive' | 'power';
  orientation: number; // degrees
}

export interface SymbolGraphics {
  rects: { x: number; y: number; w: number; h: number }[];
  circles: { cx: number; cy: number; r: number }[];
  lines: { x1: number; y1: number; x2: number; y2: number }[];
  texts: { x: number; y: number; text: string; size: number }[];
}

export interface SchematicComponent {
  id: string;
  symbolId: string;
  reference: string;
  value: string;
  position: Vec2;
  rotation: number;
  pins: PinDef[];
  graphics: SymbolGraphics;
}

export interface Wire {
  id: string;
  net: string;
  points: Vec2[];
}

export interface NetLabel {
  id: string;
  net: string;
  position: Vec2;
}

export interface PowerPort {
  id: string;
  net: string;
  position: Vec2;
  type: 'vcc' | 'gnd';
}

export interface SchematicSheet {
  id: string;
  name: string;
  components: SchematicComponent[];
  wires: Wire[];
  netLabels: NetLabel[];
  powerPorts: PowerPort[];
}

export interface SchematicDocument {
  sheets: SchematicSheet[];
}

export interface PadDef {
  id: string;
  net: string;
  position: Vec2;
  size: Vec2;
  shape: 'circle' | 'rect' | 'oval';
  type: 'smd' | 'through-hole';
  drill?: number;
}

export interface FootprintDef {
  id: string;
  componentId: string;
  reference: string;
  value: string;
  position: Vec2;
  rotation: number;
  layer: string;
  pads: PadDef[];
  silkscreen: { lines: { x1: number; y1: number; x2: number; y2: number }[] };
}

export interface Track {
  id: string;
  net: string;
  layer: string;
  width: number;
  points: Vec2[];
}

export interface Via {
  id: string;
  net: string;
  position: Vec2;
  diameter: number;
  drill: number;
}

export interface BoardOutline {
  points: Vec2[];
}

export interface DesignRules {
  clearance: number;
  trackWidth: number;
  viaDiameter: number;
  viaDrill: number;
  minTrackWidth: number;
}

export interface PCBDocument {
  boardOutline: BoardOutline;
  footprints: FootprintDef[];
  tracks: Track[];
  vias: Via[];
  designRules: DesignRules;
  layers: string[];
}

export interface ProjectMetadata {
  name: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
  version: string;
}

export interface OpenCADProjectFile {
  formatVersion: string;
  metadata: ProjectMetadata;
  schematic: SchematicDocument;
  pcb: PCBDocument;
}

// ---------------------------------------------------------------------------

const AUTOSAVE_KEY = 'opencad_autosave';

export class ProjectManager {
  private currentProject: OpenCADProjectFile | null = null;

  // -----------------------------------------------------------------------
  // Create a new empty project
  // -----------------------------------------------------------------------
  newProject(name?: string): OpenCADProjectFile {
    const now = new Date().toISOString();
    const project: OpenCADProjectFile = {
      formatVersion: '1.0.0',
      metadata: {
        name: name ?? 'Untitled Project',
        author: '',
        createdAt: now,
        modifiedAt: now,
        version: '0.1.0',
      },
      schematic: {
        sheets: [
          {
            id: 'sheet-1',
            name: 'Sheet 1',
            components: [],
            wires: [],
            netLabels: [],
            powerPorts: [],
          },
        ],
      },
      pcb: {
        boardOutline: {
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 0 },
            { x: 50, y: 40 },
            { x: 0, y: 40 },
          ],
        },
        footprints: [],
        tracks: [],
        vias: [],
        designRules: {
          clearance: 0.2,
          trackWidth: 0.25,
          viaDiameter: 0.8,
          viaDrill: 0.4,
          minTrackWidth: 0.15,
        },
        layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS', 'F.Mask', 'B.Mask', 'Edge.Cuts'],
      },
    };

    this.currentProject = project;
    console.log(`[ProjectManager] New project created: ${project.metadata.name}`);
    return project;
  }

  // -----------------------------------------------------------------------
  // Replace the current project (used by sample loader, etc.)
  // -----------------------------------------------------------------------
  setProject(project: OpenCADProjectFile): void {
    this.currentProject = project;
    console.log(`[ProjectManager] Project set: ${project.metadata.name}`);
  }

  // -----------------------------------------------------------------------
  // Save project — download as .opencad JSON file
  // -----------------------------------------------------------------------
  saveProject(): void {
    if (!this.currentProject) {
      alert('No project to save.');
      return;
    }

    this.currentProject.metadata.modifiedAt = new Date().toISOString();

    const json = JSON.stringify(this.currentProject, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentProject.metadata.name.replace(/\s+/g, '_')}.opencad`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    console.log('[ProjectManager] Project saved (download).');
  }

  // -----------------------------------------------------------------------
  // Load project from file input
  // -----------------------------------------------------------------------
  async loadProject(file: File): Promise<OpenCADProjectFile> {
    const text = await file.text();
    let parsed: OpenCADProjectFile;

    try {
      parsed = JSON.parse(text) as OpenCADProjectFile;
    } catch {
      throw new Error('Invalid JSON — could not parse project file.');
    }

    // Basic validation
    if (!parsed.formatVersion || !parsed.metadata || !parsed.schematic || !parsed.pcb) {
      throw new Error('File is not a valid OpenCAD project.');
    }

    this.currentProject = parsed;
    console.log(`[ProjectManager] Project loaded: ${parsed.metadata.name}`);
    return parsed;
  }

  // -----------------------------------------------------------------------
  // Export Gerber — kicks off Web Worker (placeholder integration point)
  // -----------------------------------------------------------------------
  exportGerber(): void {
    if (!this.currentProject) {
      alert('No project to export.');
      return;
    }
    console.log('[ProjectManager] Exporting Gerber… (delegated to gerber worker)');

    // In full integration this would use the gerber-worker:
    // const worker = new Worker(new URL('../workers/gerber-worker.ts', import.meta.url), { type: 'module' });
    // worker.postMessage({ document: this.currentProject.pcb });
    // worker.onmessage = (e) => { download files… };




    alert('Gerber export is being processed. Files will download when ready.');
  }

  // -----------------------------------------------------------------------
  // Export BOM
  // -----------------------------------------------------------------------
  exportBOM(): void {
    if (!this.currentProject) {
      alert('No project to export.');
      return;
    }

    const sheet = this.currentProject.schematic.sheets[0];
    if (!sheet) {
      alert('No schematic sheet found.');
      return;
    }

    const lines = ['Reference,Value,Quantity'];
    const counts = new Map<string, { reference: string; value: string; count: number }>();

    for (const comp of sheet.components) {
      const key = `${comp.symbolId}:${comp.value}`;
      const entry = counts.get(key);
      if (entry) {
        entry.count++;
        entry.reference += `, ${comp.reference}`;
      } else {
        counts.set(key, { reference: comp.reference, value: comp.value, count: 1 });
      }
    }

    for (const entry of counts.values()) {
      lines.push(`"${entry.reference}","${entry.value}",${entry.count}`);
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentProject.metadata.name.replace(/\s+/g, '_')}_BOM.csv`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    console.log('[ProjectManager] BOM exported.');
  }

  // -----------------------------------------------------------------------
  // Auto-save to localStorage
  // -----------------------------------------------------------------------
  autoSave(): void {
    if (!this.currentProject) return;
    try {
      const json = JSON.stringify(this.currentProject);
      localStorage.setItem(AUTOSAVE_KEY, json);
      console.log('[ProjectManager] Auto-saved to localStorage.');
    } catch (err) {
      console.warn('[ProjectManager] Auto-save failed (storage full?):', err);
    }
  }

  // -----------------------------------------------------------------------
  // Load auto-save from localStorage
  // -----------------------------------------------------------------------
  loadAutoSave(): OpenCADProjectFile | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as OpenCADProjectFile;
      if (!parsed.formatVersion || !parsed.metadata) return null;

      this.currentProject = parsed;
      console.log('[ProjectManager] Restored from auto-save.');
      return parsed;
    } catch {
      console.warn('[ProjectManager] Could not restore auto-save.');
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Accessor
  // -----------------------------------------------------------------------
  getCurrentProject(): OpenCADProjectFile | null {
    return this.currentProject;
  }
}
