# Runbook

## Environment

- Node >= 20
- pnpm >= 9

## Install

```bash
pnpm install
```

## Start App (fixed port)

```bash
pnpm --filter @opencad/app dev --host 127.0.0.1 --port 5173
```

## Run Tests

### Eagle XML Corpus Regression

```bash
pnpm dlx vitest run packages/fileio/src/eagle/eagle-bulk-load.test.ts
```

Expected output:
- 1 test passed
- 14/14 Eagle XML boards parsed, 14/14 Eagle XML schematics parsed

### KiCad Corpus Regression (primary validation)

```bash
pnpm dlx vitest run packages/fileio/src/kicad/kicad-bulk-load.test.ts
```

Expected output:
- 1 test passed
- Logs show 18/19 KiCad PCBs parsed successfully
- 1 known malformed file skipped (`LCD-OLinuXino-5TS_Rev.B.kicad_pcb`)
- Multiple legacy `.brd/.sch` files skipped (not KiCad format)

### All Tests

```bash
pnpm test
```

### Type Checking

```bash
pnpm typecheck
```

Note: Pre-existing type errors exist in `pcb-editor.ts` and `tools.ts` (Vector2D class vs plain objects). These don't cause runtime failures.

## Verify Served Modules

```bash
curl -sS http://127.0.0.1:5173/@fs/home/kuba/dev/cad/packages/ui/src/app/file-import.ts | head -80
```

## Import Debug Checklist

1. Confirm app is running on `5173`
2. Open one file from `Test data/`
3. If no design loads, accept folder scan prompt
4. Check warning alert text:
   - parse failure → check `kicad-project-parser.ts`
   - unsupported binary format → `UnsupportedBinaryDriver` warning (clear rejection, no heuristic geometry)
   - metadata-only project → `.kicad_pro` without matching `.kicad_sch`/`.kicad_pcb`
5. Switch mode manually (Schematic/PCB/3D) and validate content visibility

## Rendering Debug Checklist

### Schematic shows nothing / wrong positions
1. Check `wire.points` exists (should be `Vector2D[]` array)
2. Check camera matrix in `camera.ts` — translation at indices [2,5]
3. Check `SchematicRenderer` render order: wires → symbols → labels → ports → junctions

### PCB footprints look wrong / rotated incorrectly
1. Check rotation conversion: must use `(degrees * Math.PI) / 180` before `Math.cos()`/`Math.sin()`
2. Check `pcb-editor.ts` locations: `hitTest()`, `findPadAt()`, `renderFootprints()`, `computeFootprintBBox()`
3. Tool rotation increment should be `90` (degrees), NOT `Math.PI/2`

### 3D viewer shows "chip with grid of same pieces"
1. Check `Layer` enum references in `board-builder.ts` — must use `Layer.FCu`, `Layer.BCu`, etc.
2. Check board outline property: `outline?.points ?? outline?.polygon`
3. Check copper zones: `doc.copperZones ?? doc.zones`
4. Check pad dimensions: `(pad as any).width ?? (pad as any).size?.x`
5. Remember: 3D viewer gets **raw** parser output, not PCB editor's normalized version

### Pad shapes render as wrong shape or default circle
1. Check `normalizeShape()` in `kicad-project-parser.ts`
2. Values must match `PadShape` enum: `'circle'`, `'rect'`, `'oval'`, `'roundrect'`, `'custom'`
3. Check `PadShape.RoundRect` in `board-builder.ts` (NOT `PadShape.RoundedRect`)

## Adding New Format Driver

1. Implement driver in `packages/fileio/src/import/`
2. Implement `canHandle(files)` and `parse(files)` methods
3. Match output shapes documented in `20-Import-Formats-and-Registry.md`
4. Register in registry with appropriate priority
5. Add fixture/corpus test
6. Verify UI import still unchanged

## Key File Quick Reference

| What | File |
|---|---|
| Eagle XML parser | `packages/fileio/src/eagle/eagle-xml-parser.ts` |
| Eagle corpus regression test | `packages/fileio/src/eagle/eagle-bulk-load.test.ts` |
| S-expression parser + KiCad parsers | `packages/fileio/src/kicad/kicad-project-parser.ts` |
| Format registry + drivers | `packages/fileio/src/import/format-registry.ts` |
| PCB type definitions | `packages/core/src/model/pcb-types.ts` |
| Schematic type definitions | `packages/core/src/model/schematic-types.ts` |
| Camera transforms | `packages/renderer/src/camera/camera.ts` |
| PCB editor + document normalizer | `packages/pcb/src/editor/pcb-editor.ts` |
| PCB tools (rotation, selection) | `packages/pcb/src/editor/tools.ts` |
| 3D board mesh builder | `packages/viewer3d/src/board/board-builder.ts` |
| 3D component generator | `packages/viewer3d/src/components/component-builder.ts` |
| 3D viewer scene manager | `packages/viewer3d/src/scene/viewer3d.ts` |
| Wire renderer | `packages/schematic/src/rendering/wire-renderer.ts` |
| Schematic renderer | `packages/schematic/src/rendering/schematic-renderer.ts` |
| Zustand store | `packages/ui/src/store/app-store.ts` |
| File import flow | `packages/ui/src/app/file-import.ts` |
| Corpus regression test | `packages/fileio/src/kicad/kicad-bulk-load.test.ts` |

## Practical Guardrails

- Do not put format parsing branches in UI store/canvas components
- Keep source of truth for format selection in FileIO registry
- Prefer warnings over hard throw for partial import scenarios
- Rotation is always in **degrees** — convert to radians only at `Math.cos()`/`Math.sin()` call sites
- All `as any` patterns are documented — aim to remove them by updating core types
