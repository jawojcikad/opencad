import React, { useEffect, useCallback, useState, useRef } from 'react';
import { ProjectManager } from './project/project-manager';
import { createSampleProject } from './sample/sample-project';

// ---------------------------------------------------------------------------
// Types for the App-level state shared with keybindings
// ---------------------------------------------------------------------------

type EditorMode = 'schematic' | 'pcb' | '3d';
type ActiveTool = 'select' | 'wire' | 'route' | 'move' | 'place' | null;

interface AppState {
  mode: EditorMode;
  activeTool: ActiveTool;
  projectLoaded: boolean;
}

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[OpenCAD] Uncaught error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <pre style={styles.errorMessage}>{this.state.error?.message}</pre>
          <button
            style={styles.errorButton}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
          <button
            style={{ ...styles.errorButton, marginLeft: 8, background: '#555' }}
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Keyboard Shortcut Manager
// ---------------------------------------------------------------------------

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: (state: AppState) => void;
  description: string;
  /** If set, shortcut only fires in this mode */
  modeFilter?: EditorMode;
}

function matchesShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  const ctrl = s.ctrl ?? false;
  const shift = s.shift ?? false;
  const alt = s.alt ?? false;
  return (
    e.key.toLowerCase() === s.key.toLowerCase() &&
    (e.ctrlKey || e.metaKey) === ctrl &&
    e.shiftKey === shift &&
    e.altKey === alt
  );
}

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------

export const App: React.FC = () => {
  const projectManagerRef = useRef<ProjectManager>(new ProjectManager());

  const [state, setState] = useState<AppState>({
    mode: 'schematic',
    activeTool: 'select',
    projectLoaded: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // -----------------------------------------------------------------------
  // Initialise project on first load
  // -----------------------------------------------------------------------
  useEffect(() => {
    const pm = projectManagerRef.current;

    // Try restoring autosave, otherwise create sample project
    const autoSaved = pm.loadAutoSave();
    if (autoSaved) {
      setState((s) => ({ ...s, projectLoaded: true }));
    } else {
      const sample = createSampleProject();
      pm.setProject(sample);
      setState((s) => ({ ...s, projectLoaded: true }));
    }

    // Set up periodic autosave every 30s
    const interval = setInterval(() => pm.autoSave(), 30_000);
    return () => clearInterval(interval);
  }, []);

  // -----------------------------------------------------------------------
  // Shortcut definitions
  // -----------------------------------------------------------------------
  const shortcuts = useCallback((): Shortcut[] => {
    const pm = projectManagerRef.current;

    return [
      // ---- Undo / Redo ----
      {
        key: 'z',
        ctrl: true,
        description: 'Undo',
        action: () => {
          console.log('[OpenCAD] Undo');
          // Integration point: call commandHistory.undo()
        },
      },
      {
        key: 'z',
        ctrl: true,
        shift: true,
        description: 'Redo',
        action: () => {
          console.log('[OpenCAD] Redo');
        },
      },
      {
        key: 'y',
        ctrl: true,
        description: 'Redo (Ctrl+Y)',
        action: () => {
          console.log('[OpenCAD] Redo');
        },
      },

      // ---- File operations ----
      {
        key: 's',
        ctrl: true,
        description: 'Save project',
        action: () => pm.saveProject(),
      },
      {
        key: 'n',
        ctrl: true,
        description: 'New project',
        action: () => {
          if (confirm('Create a new project? Unsaved changes will be lost.')) {
            pm.newProject();
            setState((s) => ({ ...s, projectLoaded: true, mode: 'schematic', activeTool: 'select' }));
          }
        },
      },
      {
        key: 'o',
        ctrl: true,
        description: 'Open project',
        action: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.opencad,.json';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (file) {
              try {
                await pm.loadProject(file);
                setState((s) => ({ ...s, projectLoaded: true, mode: 'schematic', activeTool: 'select' }));
              } catch (err) {
                alert(`Failed to load project: ${(err as Error).message}`);
              }
            }
          };
          input.click();
        },
      },

      // ---- Editing ----
      {
        key: 'Delete',
        description: 'Delete selection',
        action: () => {
          console.log('[OpenCAD] Delete selection');
        },
      },
      {
        key: 'Backspace',
        description: 'Delete selection',
        action: () => {
          console.log('[OpenCAD] Delete selection');
        },
      },
      {
        key: 'Escape',
        description: 'Cancel / Deselect',
        action: () => {
          setState((s) => ({ ...s, activeTool: 'select' }));
          console.log('[OpenCAD] Cancelled current action');
        },
      },

      // ---- Tools ----
      {
        key: 'w',
        description: 'Wire tool (schematic)',
        modeFilter: 'schematic',
        action: () => {
          setState((s) => ({ ...s, activeTool: 'wire' }));
          console.log('[OpenCAD] Wire tool activated');
        },
      },
      {
        key: 'r',
        description: 'Route tool (PCB)',
        modeFilter: 'pcb',
        action: () => {
          setState((s) => ({ ...s, activeTool: 'route' }));
          console.log('[OpenCAD] Route tool activated');
        },
      },
      {
        key: 'm',
        description: 'Move tool',
        action: () => {
          setState((s) => ({ ...s, activeTool: 'move' }));
          console.log('[OpenCAD] Move tool activated');
        },
      },
      {
        key: 'f',
        description: 'Fit view to content',
        action: () => {
          console.log('[OpenCAD] Fit view');
        },
      },

      // ---- Mode switching ----
      {
        key: '1',
        description: 'Schematic mode',
        action: () => {
          setState((s) => ({ ...s, mode: 'schematic', activeTool: 'select' }));
          console.log('[OpenCAD] Switched to Schematic mode');
        },
      },
      {
        key: '2',
        description: 'PCB mode',
        action: () => {
          setState((s) => ({ ...s, mode: 'pcb', activeTool: 'select' }));
          console.log('[OpenCAD] Switched to PCB mode');
        },
      },
      {
        key: '3',
        description: '3D mode',
        action: () => {
          setState((s) => ({ ...s, mode: '3d', activeTool: null }));
          console.log('[OpenCAD] Switched to 3D mode');
        },
      },

      // ---- Checks ----
      {
        key: 'e',
        ctrl: true,
        shift: true,
        description: 'Run ERC (Electrical Rule Check)',
        modeFilter: 'schematic',
        action: () => {
          console.log('[OpenCAD] Running ERC…');
        },
      },
      {
        key: 'd',
        ctrl: true,
        shift: true,
        description: 'Run DRC (Design Rule Check)',
        modeFilter: 'pcb',
        action: () => {
          console.log('[OpenCAD] Running DRC…');
        },
      },
    ];
  }, []);

  // -----------------------------------------------------------------------
  // Register global keyboard handler
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const defs = shortcuts();
      for (const s of defs) {
        if (matchesShortcut(e, s)) {
          // Skip if mode-filtered and we're in a different mode
          if (s.modeFilter && stateRef.current.mode !== s.modeFilter) continue;

          e.preventDefault();
          e.stopPropagation();
          s.action(stateRef.current);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [shortcuts]);

  // -----------------------------------------------------------------------
  // UI (placeholder until @opencad/ui is wired up)
  // -----------------------------------------------------------------------
  const project = projectManagerRef.current.getCurrentProject();

  return (
    <ErrorBoundary>
      <div style={styles.root}>
        {/* Header */}
        <header style={styles.header}>
          <span style={styles.logo}>OpenCAD</span>
          <nav style={styles.nav}>
            <button
              style={state.mode === 'schematic' ? styles.navBtnActive : styles.navBtn}
              onClick={() => setState((s) => ({ ...s, mode: 'schematic', activeTool: 'select' }))}
            >
              1 Schematic
            </button>
            <button
              style={state.mode === 'pcb' ? styles.navBtnActive : styles.navBtn}
              onClick={() => setState((s) => ({ ...s, mode: 'pcb', activeTool: 'select' }))}
            >
              2 PCB
            </button>
            <button
              style={state.mode === '3d' ? styles.navBtnActive : styles.navBtn}
              onClick={() => setState((s) => ({ ...s, mode: '3d', activeTool: null }))}
            >
              3 3D
            </button>
          </nav>
          <div style={styles.headerRight}>
            <span style={styles.projectName}>
              {project?.metadata.name ?? 'No Project'}
            </span>
            <span style={styles.tool}>
              Tool: {state.activeTool ?? 'none'}
            </span>
          </div>
        </header>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          {state.mode === 'schematic' && (
            <>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'select' }))}>Select</button>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'wire' }))}>Wire (W)</button>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'move' }))}>Move (M)</button>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'place' }))}>Place</button>
              <div style={styles.sep} />
              <button style={styles.toolBtn} onClick={() => console.log('[OpenCAD] Running ERC…')}>ERC</button>
            </>
          )}
          {state.mode === 'pcb' && (
            <>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'select' }))}>Select</button>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'route' }))}>Route (R)</button>
              <button style={styles.toolBtn} onClick={() => setState((s) => ({ ...s, activeTool: 'move' }))}>Move (M)</button>
              <div style={styles.sep} />
              <button style={styles.toolBtn} onClick={() => console.log('[OpenCAD] Running DRC…')}>DRC</button>
              <button style={styles.toolBtn} onClick={() => projectManagerRef.current.exportGerber()}>Gerber</button>
              <button style={styles.toolBtn} onClick={() => projectManagerRef.current.exportBOM()}>BOM</button>
            </>
          )}
          {state.mode === '3d' && (
            <span style={{ color: '#ccc', fontSize: 13, padding: 6 }}>
              3D Viewer — orbit with mouse, scroll to zoom
            </span>
          )}
        </div>

        {/* Canvas area (placeholder) */}
        <main style={styles.canvas}>
          <div style={styles.placeholder}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>
              {state.mode === 'schematic'
                ? '📐 Schematic Editor'
                : state.mode === 'pcb'
                ? '🔧 PCB Layout'
                : '🧊 3D Viewer'}
            </p>
            <p style={{ fontSize: 13, color: '#888' }}>
              {state.projectLoaded
                ? `Project: ${project?.metadata.name} — ${
                    project?.schematic.sheets[0]?.components.length ?? 0
                  } schematic components, ${
                    project?.pcb.footprints.length ?? 0
                  } footprints`
                : 'Loading…'}
            </p>
            <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
              Press <kbd>Ctrl+N</kbd> New · <kbd>Ctrl+O</kbd> Open · <kbd>Ctrl+S</kbd> Save
            </p>
          </div>
        </main>

        {/* Status bar */}
        <footer style={styles.statusBar}>
          <span>Mode: {state.mode}</span>
          <span>|</span>
          <span>Tool: {state.activeTool ?? 'none'}</span>
          <span>|</span>
          <span>OpenCAD v0.1.0</span>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

// ---------------------------------------------------------------------------
// Inline styles (minimal — will be replaced by @opencad/ui theme system)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#1a1a2e',
    color: '#e0e0e0',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#1a1a2e',
    color: '#e0e0e0',
    padding: 32,
  },
  errorTitle: { color: '#ef5350', marginBottom: 16 },
  errorMessage: {
    background: '#111',
    padding: 16,
    borderRadius: 6,
    maxWidth: 600,
    overflow: 'auto',
    marginBottom: 16,
    fontSize: 13,
  },
  errorButton: {
    padding: '8px 20px',
    background: '#4fc3f7',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 600,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    height: 44,
    padding: '0 16px',
    background: '#16213e',
    borderBottom: '1px solid #0f3460',
    flexShrink: 0,
  },
  logo: {
    fontWeight: 700,
    fontSize: 16,
    color: '#4fc3f7',
    letterSpacing: '0.1em',
  },
  nav: { display: 'flex', gap: 4 },
  navBtn: {
    padding: '4px 14px',
    background: 'transparent',
    color: '#aaa',
    border: '1px solid transparent',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  },
  navBtnActive: {
    padding: '4px 14px',
    background: '#0f3460',
    color: '#4fc3f7',
    border: '1px solid #4fc3f7',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
  },
  headerRight: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    fontSize: 13,
    color: '#888',
  },
  projectName: { color: '#ccc' },
  tool: { color: '#4fc3f7' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    height: 36,
    padding: '0 12px',
    background: '#1e2a4a',
    borderBottom: '1px solid #0f3460',
    flexShrink: 0,
  },
  toolBtn: {
    padding: '3px 12px',
    background: '#253561',
    color: '#ccc',
    border: '1px solid #333e5a',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 12,
  },
  sep: { width: 1, height: 20, background: '#333e5a', margin: '0 6px' },
  canvas: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111827',
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    textAlign: 'center',
    color: '#aaa',
  },
  statusBar: {
    display: 'flex',
    gap: 12,
    height: 24,
    padding: '0 12px',
    background: '#16213e',
    borderTop: '1px solid #0f3460',
    alignItems: 'center',
    fontSize: 11,
    color: '#888',
    flexShrink: 0,
  },
};
