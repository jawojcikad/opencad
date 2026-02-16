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

### 9. Centralized PCB Normalization (core + ui + pcb)
- **Was:** Normalization only happened inside `PCBEditor.loadDocument()`; 3D viewer consumed raw store data
- **Fixed:** Added shared `normalizePCBDocument()` in `@opencad/core`; import pipeline now normalizes before writing to store; PCB editor reuses the same normalizer
- **Impact:** PCB editor and 3D viewer now consume the same normalized runtime shape

### 10. Runtime Type Convergence (core + viewer3d)
- **Was:** Frequent `as any` usage for runtime aliases (`points`, `copperZones`, `width`, `height`, etc.)
- **Fixed:** Extended `pcb-types.ts` with runtime-compatible optional aliases; removed several critical casts in `board-builder.ts`
- **Impact:** Fewer type escapes in 3D build path, safer field access, less duplication of fallback logic

### 11. 3D Board Overlay Drift Fallback (viewer3d)
- **Was:** If `boardOutline` was missing/invalid, 3D board substrate fell back to a fixed 100×100 box at origin, causing visible drift from imported copper/components
- **Fixed:** `BoardBuilder` now derives a fallback outline from actual PCB geometry bounds (tracks/vias/footprints/zones) and reuses it for substrate + solder mask
- **Impact:** Green board overlay remains aligned with loaded PCB content even when explicit edge-cuts outline is absent

### 12. Schematic Contrast Overlay (schematic)
- **Was:** Grid + dark-green wires/symbols could be hard to read on dense sheets
- **Fixed:** Added a semi-transparent contrast panel under active schematic content before rendering wires/components/labels
- **Impact:** Better visual separation and readability without changing user data or schematic geometry

## Known Limitations (Still Present)

### 1. Type System Drift — `as any` Casts

The most critical runtime-shape drift has been reduced by:
- expanding `@opencad/core` PCB interfaces with compatibility aliases, and
- centralizing import normalization via `normalizePCBDocument()`.

Some drift remains, especially around strict `Vector2D` class typing vs plain `{x,y}` literals in editor/routing code paths. Key locations:

| File | Pattern | Why |
|---|---|---|
| `tools.ts` | Various `Vector2D` class vs `{x,y}` | Some code expects Vector2D class methods, gets plain objects |

**Resolution path:** Continue replacing plain `{x,y}` literals with `Vector2D` instances in editor/tools/router, then remove remaining escapes.

### 2. Legacy Binary Format Support

Legacy binary Eagle `.brd/.sch` files are now loadable via an **experimental approximate importer** that extracts probable tokens (references/nets) and builds placeholder runtime documents with explicit warnings.

- This improves practical import coverage for the corpus (legacy files open instead of hard failing).
- Imported geometry/connectivity from binary files is **non-authoritative** and can be incomplete.
- A full deterministic binary decoder is still required for production-grade fidelity.

### 3. Pre-existing TypeScript Errors (Non-Blocking)

`pcb-editor.ts`, `tools.ts`, and routing utilities still have pre-existing type errors related to `Vector2D` class instances vs plain `{x, y}` objects. These don't cause runtime failures but still cause `tsc --noEmit` failures in dependent packages.

### 4. Mixed Source Outputs

Generated `.js` inside `src/` can confuse tooling/runtime if Vite extension priority changes. The current `vite.config.ts` prefers `.ts/.tsx` over stale `.js`.

### 5. (Resolved) 3D Viewer Raw Data Path

Previously, `Viewer3DCanvas.tsx` received raw parser output from store. This is now resolved by normalizing in `file-import.ts` before documents are stored.

## Known Problematic Corpus Item

- `LCDs/LCD-OLinuXino-5CTS/Hardware revision B/LCD-OLinuXino-5TS_Rev.B.kicad_pcb`
  - Malformed KiCad text sample (parenthesis mismatch)
  - Tracked as known malformed in corpus test allowlist

## Next Recommended Engineering Steps

1. **Finish Vector2D strictness cleanup** — Replace plain `{x,y}` literals with `Vector2D` instances in PCB editor tools/router to eliminate remaining TS errors
2. **Continue cast removal** — Remove remaining non-critical escape hatches now that core runtime aliases exist
3. **Add binary format decoders** — Build format-specific binary decoders (Eagle, Altium, legacy KiCad) with same driver interface
4. **Add schematic corpus tests** — Currently only PCB bulk parsing is tested
