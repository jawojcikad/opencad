# Current State and Known Issues

## What Is Working

- App starts and serves on Vite (port 5173)
- Schematic/PCB/3D modes can be entered and switched
- KiCad S-expression files (`.kicad_sch`, `.kicad_pcb`) parse correctly
- 3D viewer renders PCB substrate, copper layers, solder mask, silkscreen, auto-generated components
- Schematic wires render as polylines from `wire.points` arrays
- PCB editor renders footprints, tracks, vias, zones, board outline with correct rotation (degrees)
- Import path supports KiCad/OpenCAD JSON, Eagle XML, and unsupported binary format rejection
- Test corpus: 18/19 KiCad PCBs + 14/14 Eagle XML boards + 14/14 Eagle XML schematics parse successfully
- Camera transforms work correctly for zoom/pan/coordinate mapping
- Sample "555 Timer LED Blinker" project loads on startup

## Fixes Applied (Most Recent Session)

### 1. Camera Matrix Translation (renderer/camera/camera.ts)
- **Was:** Translation elements at matrix indices [6,7] (bottom row)
- **Fixed:** Translation at indices [2,5] — `[z, 0, tx, 0, z, ty, 0, 0, 1]`
- **Impact:** Schematic grid positioning now correct

### 2. Layer Enum References (viewer3d/board/board-builder.ts)
- **Was:** `Layer.BottomCopper`, `Layer.TopCopper`, etc. (undefined — no such enum members)
- **Fixed:** `Layer.BCu`, `Layer.FCu`, `Layer.BSilk`, `Layer.FSilk`, `Layer.BMask`, `Layer.FMask`
- **Impact:** 3D viewer now renders actual copper/mask/silk layers instead of empty meshes

### 3. Wire Data Shape (fileio/kicad/kicad-project-parser.ts)
- **Was:** Parser emitted `{ start: Vector2D, end: Vector2D }` pairs
- **Fixed:** Parser emits `{ points: Vector2D[] }` polylines matching `Wire` interface
- **Impact:** Schematic wires now visible (WireRenderer reads `wire.points`)

### 4. Pad Shape Normalization (fileio/kicad/kicad-project-parser.ts)
- **Was:** `normalizeShape()` returned wrong values — `'rectangle'` instead of `'rect'`, `'obround'` instead of `'oval'`
- **Fixed:** Returns correct `PadShape` enum values matching `pcb-types.ts`
- **Impact:** Pad shapes render correctly; no more false-defaulting to circle

### 5. Rotation Unit Mismatch (pcb/editor/pcb-editor.ts + tools.ts)
- **Was:** `Math.cos(fp.rotation)` — treated degrees as radians
- **Fixed:** `Math.cos((fp.rotation * Math.PI) / 180)` in all 4 trig locations
- **Also fixed:** Tool rotation increment from `Math.PI/2` to `90` (degrees)
- **Locations:** `hitTest()` (~L548), `findPadAt()` (~L639), `renderFootprints()` (~L815), `computeFootprintBBox()` (~L947)
- **Impact:** Footprint rendering, hit testing, and rotation operations work correctly

### 6. Board Outline Property (fileio + viewer3d + pcb)
- **Was:** Inconsistent — parser used `vertices`, consumers expected `polygon` or `points`
- **Fixed:** Parser emits `{ polygon: [...] }`; consumers use `points ?? polygon` fallback chain
- **Impact:** Board outline renders in both PCB editor and 3D viewer

### 7. Copper Zone Fields (fileio + viewer3d)
- **Was:** Parser emitted `{ outline, layer, net }`
- **Fixed:** Parser emits `{ polygon, filledPolygon, layer, net }`; also emits `copperZones` alias alongside `zones`
- **Impact:** Zone fills render correctly in 3D viewer

### 8. Pad Dimension Fields (fileio + viewer3d)
- **Was:** Parser only emitted `size: { x, y }`; 3D builder read `width`/`height`
- **Fixed:** Parser also emits `width`, `height`, `type` fields for downstream compatibility
- **Impact:** 3D component sizing correct

## Known Limitations (Still Present)

### 1. Type System Drift — `as any` Casts

Multiple files use `as any` to bridge the gap between strict `@opencad/core` interfaces and actual runtime data. Key locations:

| File | Pattern | Why |
|---|---|---|
| `board-builder.ts` | `const doc = document as any` | Parser emits fields not in strict `PCBDocument` type |
| `board-builder.ts` | `(pad as any).width` | `Pad` type has `size: Vector2D`, not `width`/`height` |
| `pcb-editor.ts` | `const doc = document as any` | Same reason — normalizer operates on runtime shape |
| `tools.ts` | Various `Vector2D` class vs `{x,y}` | Some code expects Vector2D class methods, gets plain objects |

**Resolution path:** Update `@opencad/core` interfaces to match actual runtime shapes, then remove casts.

### 2. Legacy Binary Format Support

Binary `.brd/.sch` files are detected and rejected with a clear warning. The previous heuristic `LegacyBinaryDriver` (which generated fake/approximate geometry from token extraction) has been removed. Building format-specific binary decoders with the same driver interface is the next major engineering milestone.

### 3. Pre-existing TypeScript Errors (Non-Blocking)

`pcb-editor.ts` and `tools.ts` have pre-existing type errors related to `Vector2D` class instances vs plain `{x, y}` objects. These don't cause runtime failures but would cause `tsc --noEmit` to report errors. The errors predate the recent fixes and are not regressions.

### 4. Mixed Source Outputs

Generated `.js` inside `src/` can confuse tooling/runtime if Vite extension priority changes. The current `vite.config.ts` prefers `.ts/.tsx` over stale `.js`.

### 5. 3D Viewer Gets Raw Parser Output

`Viewer3DCanvas.tsx` passes raw `pcbDocument` from Zustand store to `PCB3DViewer.loadPCB()`. This means the 3D viewer receives un-normalized parser output. The `board-builder.ts` handles this via defensive fallback chains, but ideally the normalization should happen once before the store.

## Known Problematic Corpus Item

- `LCDs/LCD-OLinuXino-5CTS/Hardware revision B/LCD-OLinuXino-5TS_Rev.B.kicad_pcb`
  - Malformed KiCad text sample (parenthesis mismatch)
  - Tracked as known malformed in corpus test allowlist

## Next Recommended Engineering Steps

1. **Centralize document normalization** — Move PCBEditor's `loadDocument()` normalization to `file-import.ts` so both PCB editor and 3D viewer receive the same normalized data
2. **Converge types** — Update `@opencad/core` interfaces to include runtime fields (`width`, `height`, `copperZones`, `points` alias), remove `as any` casts
3. **Add binary format decoders** — Build format-specific binary decoders (Eagle, Altium, legacy KiCad) with same driver interface
4. **Add schematic corpus tests** — Currently only PCB bulk parsing is tested
