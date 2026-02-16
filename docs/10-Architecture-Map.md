# Architecture Map

## Data Flow: File Import → Store → Canvas → Editor/Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Open File"                                      │
│    app-store.ts → openFile()                                    │
│    ↓ creates <input type="file"> picker                         │
│    accepts: .kicad_pro/.kicad_sch/.sch/.schm/                   │
│             .kicad_pcb/.pcb/.brd/.opencad/.json                 │
├─────────────────────────────────────────────────────────────────┤
│ 2. file-import.ts → importFiles(File[])                         │
│    ↓ decodeFileContent(): ArrayBuffer → detect binary vs text   │
│      (NUL-byte ratio >2% = binaryLike)                         │
│    ↓ builds DesignImportFile[] { name, content, binaryLike }    │
├─────────────────────────────────────────────────────────────────┤
│ 3. format-registry.ts → parseDesignFiles(files)                 │
│    FormatRegistry with priority-sorted drivers:                  │
│      [100] KiCadAndJsonDriver — text-based KiCad/JSON files     │
│      [ 75] EagleXMLDriver — Eagle XML .brd/.sch files           │
│      [ 10] UnsupportedBinaryDriver — rejects binary .brd/.pcb/ │
│             .sch/.schm with clear warning                        │
│    driver.canHandle() → driver.parse() → merges result          │
│    → { projectName, schematicDocument, pcbDocument, warnings }  │
├─────────────────────────────────────────────────────────────────┤
│ 4. file-import.ts → applyImportResult(result)                   │
│    ↓ store.setSchematicDocument(doc)                            │
│    ↓ store.setPCBDocument(doc)                                  │
│    ↓ store.setProjectName(name)                                 │
│    ↓ store.setMode('pcb' | 'schematic')                        │
├─────────────────────────────────────────────────────────────────┤
│ 5. Zustand store (app-store.ts) triggers React re-renders       │
│    schematicDocument / pcbDocument state changes                 │
├─────────────────────────────────────────────────────────────────┤
│ 6a. SchematicCanvas.tsx                                         │
│     useEffect → editor.loadDocument(schDoc)                     │
│     SchematicEditor → Canvas2DRenderer → SchematicRenderer      │
│     Render order: wires → symbols → net labels →                │
│                   power ports → junctions                       │
│                                                                 │
│ 6b. PCBCanvas.tsx                                               │
│     useEffect → editor.loadDocument(pcbDoc)                     │
│     PCBEditor → WebGLRenderer / Canvas2DRenderer                │
│     loadDocument() normalizes raw parser output (see below)     │
│                                                                 │
│ 6c. Viewer3DCanvas.tsx  ← IMPORTANT: GETS RAW PARSER OUTPUT    │
│     useEffect → viewer.loadPCB(pcbDoc)                          │
│     Gets pcbDocument directly from Zustand store                │
│     PCB3DViewer → BoardBuilder + ComponentBuilder               │
│     Does NOT receive PCBEditor's normalized document            │
└─────────────────────────────────────────────────────────────────┘
```

### Critical: Dual Data Path

The PCB editor normalizes the raw parser output in `loadDocument()` (line ~154 of `pcb-editor.ts`), fixing up property names. But the 3D viewer gets the **raw** parser output straight from Zustand. Both `board-builder.ts` and `pcb-editor.ts` therefore contain defensive fallback chains like:

```typescript
outline?.points ?? outline?.polygon ?? []
doc.copperZones ?? doc.zones ?? []
(pad as any).width ?? (pad as any).size?.x ?? 1
```

### Startup Path (No File Open)

`main.tsx` dynamically imports `sample-project-loader`, then calls `loadSampleSchematic()` + `loadSamplePCB()` to populate the store with a built-in "555 Timer LED Blinker" project.

## Package Responsibilities

### Core (`@opencad/core`)

- **Canonical type definitions** for schematic and PCB domains
- Geometry: `Vector2D` (class with methods), `BBox`, `Matrix3`
- Spatial index: `RTree` for efficient spatial queries
- Units: `Unit` enum (MM/MIL/INCH), conversion functions (`mmToNm`, `nmToMm`, etc.)
- Events: `EventBus`, `Command` interface, `CommandHistory`
- Zero external dependencies

### Renderer (`@opencad/renderer`)

- `Camera` — viewport transforms, zoom, pan, coordinate conversions
  - `getViewMatrix()` returns `[z,0,tx, 0,z,ty, 0,0,1]` (column indices 2,5 = translation)
  - `screenToWorld()` / `worldToScreen()` for coordinate mapping
- `Canvas2DRenderer` — used by SchematicEditor
- `WebGLRenderer` — used by PCBEditor (custom shaders in `shaders.ts`)
- `GridRenderer` — snap-to-grid functionality
- `LayerManager` — visibility/color per layer
- `HitTester` — geometric hit testing primitives

### Schematic (`@opencad/schematic`)

- `SchematicEditor` — sheet-level operations, command history, rendering orchestration
- Tools: `SelectTool`, `WireTool`, `PlaceComponentTool`, `PlaceNetLabelTool`
- Rendering: `SchematicRenderer` → delegates to `SymbolRenderer` + `WireRenderer`
- `WireRenderer.renderWire()` reads `wire.points` (polyline `Vector2D[]`)
- ERC checker, netlist extractor

### PCB (`@opencad/pcb`)

- `PCBEditor` — board-level operations, layer-aware rendering, hit testing
  - `loadDocument()` normalizes raw parser output (property name fixups)
  - All trig uses degrees→radians conversion: `const rotRad = (fp.rotation * Math.PI) / 180`
- Tools: `SelectTool`, `RouteTool`, `PlaceFootprintTool`, `DrawBoardOutlineTool`, `PlaceViaTool`, `MeasureTool`
  - Rotation increment: **90 degrees** per step
- `InteractiveRouter`, `RatsnestCalculator`
- `ZoneFiller`, `DRCChecker`, `Autorouter`

### FileIO (`@opencad/fileio`)

- Format registry with priority-sorted driver system
- `KiCadSchematicParser` / `KiCadPCBParser` — parse S-expression `.kicad_*` files
- `LegacyBinaryDriver` — heuristic fallback for binary `.brd/.sch`
- Export: `GerberGenerator`, `ExcellonGenerator`, `BOMGenerator`, `PickPlaceGenerator`, `SVGExporter`
- `NativeSerializer` — OpenCAD JSON format

### Viewer3D (`@opencad/viewer3d`)

- `PCB3DViewer` — Three.js scene management, camera fit-to-board
- `BoardBuilder` — generates meshes for board substrate, copper layers, solder mask, silkscreen
  - Uses `Layer.FCu`/`BCu`/`FSilk`/`BSilk`/`FMask`/`BMask` enum values
  - Reads raw parser output with defensive fallback chains
- `ComponentBuilder` — auto-generates 3D chip bodies via footprint name pattern matching
  - Patterns: SOIC, QFP, DIP, TO-220, SMD chip sizes (0402–2512), connectors, etc.
  - Rotation: `(rotation * Math.PI) / 180` — expects degrees input
- `OrbitControls` — mouse/touch camera control
- `PCBRaycaster` — click picking in 3D

### UI (`@opencad/ui`)

- `app-store.ts` — Zustand store: `useAppStore` global state
- Canvas components: `SchematicCanvas`, `PCBCanvas`, `Viewer3DCanvas`
  - `useRef` for editor/viewer instances
  - `ResizeObserver` for responsive sizing with `devicePixelRatio`
  - Editors: `startRenderLoop()` / `stopRenderLoop()` on mount/unmount
  - 3D viewer: `destroy()` on unmount (disposes Three.js resources)
- `file-import.ts` — file open flow, `importFiles()`, `applyImportResult()`
- Panels: Layer, Properties, Library, NetInspector, DRC
- Dialogs: ComponentPicker, DesignRules, Export

### App (`@opencad/app`)

- Vite host, `main.tsx` entry point
- Sample project loader (555 Timer LED Blinker)
- Web workers: DRC, autorouter, Gerber generation

## Type System: Strict Interfaces vs Runtime Reality

**Critical for future work:** The type definitions in `@opencad/core` don't always match what the parser emits or what consumers read. Several `as any` casts exist to bridge this gap.

### Key Discrepancies (Parser Output vs Strict Types)

| Property | Strict Type (`pcb-types.ts`) | Parser Output / Runtime |
|---|---|---|
| Board outline vertices | `BoardOutline.polygon` | Parser emits both `polygon` and `points` |
| Copper zones array | `PCBDocument.zones` | Parser emits both `zones` and `copperZones` |
| Zone polygon | `CopperZone.polygon` | Parser emits `polygon`, `filledPolygon`, some code reads `outline` |
| Pad dimensions | `Pad.size: Vector2D` (x/y) | Parser also emits `width`, `height` for convenience |
| Pad type | `Pad.type: PadType` enum | Parser emits `type` field |
| Footprint extras | Not in type: reference, layer, silkscreen, footprintName | Present at runtime via parser |

### Convention for Handling Drift

Consumers use defensive fallback chains:
```typescript
const doc = document as any;
const outline = doc.boardOutline?.points ?? doc.boardOutline?.polygon ?? [];
const zones = doc.copperZones ?? doc.zones ?? [];
const width = (pad as any).width ?? (pad as any).size?.x ?? 1;
```

This pattern exists in both `board-builder.ts` and `pcb-editor.ts`.

## Source File Notes

- `src/` includes both `.ts` and generated `.js` artifacts in several packages
- Vite resolve extension priority was adjusted to prefer `.ts/.tsx` over stale `.js`
- Runtime module resolution can accidentally pick stale `.js` without this safeguard
