# OpenCAD - Electronic Design Automation Tool

## Architecture Overview

A modern, web-based EDA tool inspired by Altium Designer and KiCad, built with
TypeScript, WebGL/Canvas 2D rendering, and a modular architecture.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Build | Vite + pnpm workspaces (monorepo) |
| Rendering | WebGL2 (PCB/3D) + Canvas 2D (schematic) |
| UI Framework | React 18 + Zustand (state) |
| Desktop | Electron (optional, later) |
| Testing | Vitest + Playwright |
| 3D | Three.js (PCB 3D viewer) |
| Math | gl-matrix (linear algebra) |

## Monorepo Package Structure

```
packages/
├── core/                  # Shared data model, math, utilities
│   ├── src/
│   │   ├── math/          # Vector2D, Matrix, BBox, geometry utils
│   │   ├── model/         # Component, Net, Pin, Wire, Footprint, Pad, Track...
│   │   ├── events/        # Event bus, command pattern, undo/redo
│   │   ├── units/         # mil, mm, inch conversions
│   │   └── index.ts
│   └── package.json
│
├── renderer/              # GPU-accelerated rendering engine
│   ├── src/
│   │   ├── webgl/         # WebGL2 renderer (PCB, copper, layers)
│   │   ├── canvas2d/      # Canvas 2D renderer (schematic)
│   │   ├── camera/        # Pan, zoom, viewport transforms
│   │   ├── layers/        # Layer management system
│   │   ├── picking/       # Hit testing, spatial indexing (R-tree)
│   │   └── grid/          # Grid drawing and snapping
│   └── package.json
│
├── schematic/             # Schematic editor
│   ├── src/
│   │   ├── editor/        # SchematicEditor, tools (wire, place, select)
│   │   ├── symbols/       # Symbol rendering, pin types
│   │   ├── sheets/        # Multi-sheet support, hierarchy
│   │   ├── erc/           # Electrical rule check
│   │   └── netlist/       # Netlist extraction from schematic
│   └── package.json
│
├── pcb/                   # PCB layout editor
│   ├── src/
│   │   ├── editor/        # PCBEditor, tools (route, place, select)
│   │   ├── routing/       # Interactive router, trace management
│   │   ├── copper/        # Copper zones, polygon fills
│   │   ├── drc/           # Design rule check engine
│   │   ├── layers/        # PCB layer stack (copper, silk, mask, etc.)
│   │   └── autorouter/    # Auto-routing engine
│   └── package.json
│
├── library/               # Component library system
│   ├── src/
│   │   ├── symbols/       # Schematic symbol definitions
│   │   ├── footprints/    # PCB footprint definitions
│   │   ├── models3d/      # 3D model references
│   │   ├── manager/       # Library browser, search, categories
│   │   └── formats/       # Import KiCad libs, Eagle libs
│   └── package.json
│
├── fileio/                # File import/export
│   ├── src/
│   │   ├── native/        # Native .opencad JSON format
│   │   ├── kicad/         # KiCad file import/export
│   │   ├── gerber/        # Gerber RS-274X generation
│   │   ├── drill/         # Excellon drill file generation
│   │   ├── bom/           # BOM export (CSV, XLSX)
│   │   ├── pdf/           # PDF/SVG export
│   │   └── pick-place/    # Pick and place file export
│   └── package.json
│
├── viewer3d/              # 3D PCB viewer
│   ├── src/
│   │   ├── scene/         # Three.js scene setup
│   │   ├── board/         # Board mesh generation
│   │   ├── components/    # 3D component models
│   │   └── raycasting/    # 3D picking and interaction
│   └── package.json
│
├── ui/                    # React UI components
│   ├── src/
│   │   ├── app/           # Main app shell, layout
│   │   ├── toolbar/       # Tool bars, menus
│   │   ├── panels/        # Properties, layers, library, net inspector
│   │   ├── dialogs/       # DRC results, settings, component picker
│   │   ├── canvas/        # Canvas host component
│   │   └── theme/         # Dark/light theme
│   └── package.json
│
└── app/                   # Main application entry
    ├── src/
    │   ├── main.tsx        # React entry
    │   ├── store/          # Global Zustand store
    │   └── workers/        # Web Workers (DRC, autorouter, gerber gen)
    ├── index.html
    └── package.json
```

## Core Data Model

### Schematic Domain
- **SchematicDocument**: Contains sheets, components, wires, labels, power ports
- **Sheet**: One page of schematic, can be hierarchical
- **SchematicComponent**: Instance of a symbol placed on sheet
- **Symbol**: Template defining graphical shape + pins
- **Pin**: Connection point with name, number, type (input/output/bidirectional/passive/power)
- **Wire**: Electrical connection between pins (polyline)
- **NetLabel**: Named net marker
- **PowerPort**: Power/ground symbol
- **Bus**: Bundle of related nets
- **Junction**: Wire junction indicator

### PCB Domain
- **PCBDocument**: Contains board outline, footprints, tracks, zones, vias
- **BoardOutline**: Closed polygon defining PCB shape
- **Footprint**: Physical component placement with pads and silkscreen
- **Pad**: SMD or through-hole connection point
- **Track**: Copper trace segment (line or arc)
- **Via**: Through-hole or blind/buried via
- **CopperZone**: Polygon copper pour with net assignment
- **LayerStack**: Ordered set of layers (F.Cu, B.Cu, F.Silk, F.Mask, etc.)
- **DesignRules**: Clearance, trace width, via size, etc.

### Shared
- **Net**: Named electrical connection spanning schematic and PCB
- **Netlist**: Complete set of nets extracted from schematic
- **Component**: Unified component linking symbol + footprint + 3D model
- **BOM Entry**: Part number, value, description, quantity

## Key Algorithms
1. **Spatial indexing** - R-tree for fast hit testing and region queries
2. **Polygon operations** - Clipper.js for copper zone fills, boolean ops
3. **Graph connectivity** - Union-Find for net connectivity
4. **A* / Lee router** - For auto-routing traces
5. **Push-and-shove** - Interactive routing algorithm
6. **DRC sweep** - Spatial sweep for clearance violations
7. **Gerber aperture** - RS-274X aperture definition and drawing commands

## Rendering Pipeline

### Schematic (Canvas 2D)
1. Camera transform (pan/zoom)
2. Grid layer
3. Wires and buses
4. Component symbols (transformed)
5. Pin markers and names
6. Net labels and power ports
7. Selection overlay
8. Tool preview (rubber-band wire, ghost component)

### PCB (WebGL2)
1. Layer visibility filter
2. Board outline
3. Copper zones (filled polygons via triangulation)
4. Tracks and vias
5. Footprint pads
6. Silkscreen / fabrication layers
7. Solder mask / paste mask
8. Ratsnest (unrouted connections)
9. DRC violation markers
10. Selection and tool preview

## Command / Undo System
All mutations go through a Command pattern:
```typescript
interface Command {
  execute(): void;
  undo(): void;
  description: string;
}
```
Commands are pushed to an undo stack. Redo stack clears on new command.

## Event System
Decoupled modules communicate via typed event bus:
- `schematic:component-placed`
- `schematic:wire-drawn`
- `pcb:track-routed`
- `pcb:footprint-moved`
- `netlist:updated`
- `drc:violation-found`
