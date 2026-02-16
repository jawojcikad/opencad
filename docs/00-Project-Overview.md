# Project Overview

OpenCAD is a browser-based EDA (Electronic Design Automation) application built as a TypeScript monorepo. It provides schematic and PCB editors with a 3D PCB viewer, supporting KiCad file import and interactive design workflows.

## Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| State management | Zustand | 5 |
| Build / Dev server | Vite | 7 |
| Language | TypeScript | 5.9 |
| 2D rendering | Canvas2D (schematic) + WebGL2 (PCB) | custom renderers |
| 3D rendering | Three.js | 0.182 |
| Testing | Vitest | latest |
| Package manager | pnpm workspaces | ≥9 |
| Runtime | Node.js | ≥20 |

## Workspace Structure

```
packages/
├── core/        — Domain models (schematic + PCB types), math (Vector2D, BBox, Matrix3),
│                  spatial index (RTree), units, events/command system
├── renderer/    — Camera transforms, Canvas2D renderer, WebGL renderer,
│                  grid, layer manager, hit-testing
├── schematic/   — SchematicEditor, tools (Select/Wire/Place), rendering
│                  (SchematicRenderer → SymbolRenderer + WireRenderer), ERC, netlist
├── pcb/         — PCBEditor, tools (Select/Route/PlaceFootprint/DrawOutline/PlaceVia/Measure),
│                  interactive router, ratsnest, DRC, zone filler, autorouter
├── fileio/      — Format registry + drivers (KiCad S-expr parser, legacy binary fallback),
│                  export generators (Gerber, Excellon drill, BOM, pick-place, SVG)
├── viewer3d/    — Three.js PCB3DViewer, BoardBuilder (substrate/copper/mask/silk meshes),
│                  ComponentBuilder (auto-generated 3D components), OrbitControls, raycasting
├── library/     — Component library management
├── ui/          — React UI layer: Zustand store (app-store.ts), mode canvases
│                  (SchematicCanvas, PCBCanvas, Viewer3DCanvas), toolbar, panels, dialogs
└── app/         — Vite app host, main.tsx bootstrap, sample project loader, web workers
```

## Data Corpus

`Test data/` contains Olimex Open Hardware projects in mixed historical formats:

- **Modern KiCad** text-based files (`.kicad_pcb`, `.kicad_sch`) — fully parsed
- **Eagle XML** text-based files (`.brd`, `.sch`) — parsed via `EaglePCBParser` / `EagleSchematicParser`
- **Legacy binary** `.brd/.sch` — detected and rejected with a clear warning (no heuristic parsing)

Used for importer regression testing via:
- `packages/fileio/src/kicad/kicad-bulk-load.test.ts` — **18/19 KiCad PCBs** parse successfully
- `packages/fileio/src/eagle/eagle-bulk-load.test.ts` — **14/14 Eagle XML boards** + **14/14 schematics** parse successfully

## Unit & Coordinate Conventions

| Convention | Value |
|---|---|
| **Internal units** | Type comments say nanometers; runtime actually uses **millimeters** throughout |
| **Rotation** | **Degrees** everywhere (KiCad native, store, editors, 3D viewer) |
| **Coordinate system (2D)** | Y-down (matches KiCad and Canvas2D native) |
| **Coordinate system (3D)** | Z-up, board on XY plane (Three.js convention) |

## High-Level Goals

1. Stable runtime startup and mode switching (schematic/pcb/3d)
2. Practical multi-format import behavior with clear user feedback
3. Modular format architecture for future format support (Eagle, Altium, etc.)
4. Incremental movement from compatibility shims to full-fidelity parsers
5. Type system convergence — reduce `as any` casts as interfaces stabilize
