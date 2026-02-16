# Agents Handoff Guide

This file is the entrypoint for future coding agents working on OpenCAD.

## Read First (in order)

1. [Project Overview](docs/00-Project-Overview.md) — Tech stack, workspace structure, unit/coordinate conventions
2. [Architecture Map](docs/10-Architecture-Map.md) — Data flow diagrams, package responsibilities, type system drift reference
3. [Import Formats & Registry](docs/20-Import-Formats-and-Registry.md) — Parser output shapes, pad normalization, driver interfaces
4. [Current State & Known Issues](docs/30-Current-State-and-Known-Issues.md) — Applied fixes, remaining limitations, next steps
5. [Runbook (commands + validation)](docs/40-Runbook.md) — Commands, debug checklists, key file reference table

## Critical Conventions (Read Before Making Changes)

### Rotation: Always Degrees

- KiCad files store rotation in **degrees**
- Zustand store holds rotation in **degrees**
- PCB/Schematic editors receive rotation in **degrees**
- 3D viewer receives rotation in **degrees**
- **Convert to radians ONLY at `Math.cos()`/`Math.sin()` call sites:**
  ```typescript
  const rotRad = (fp.rotation * Math.PI) / 180;
  const cos = Math.cos(rotRad);
  ```

### Units: Millimeters at Runtime

- KiCad files use mm
- Type comments in `@opencad/core` say "nanometers" but runtime values are actually **mm**
- The 3D viewer, PCB editor, and schematic editor all operate in mm

### Type System Drift: `as any` Pattern

Several files use `as any` to bridge strict `@opencad/core` interfaces vs actual parser output. Key discrepancies:

| Strict interface field | Actual runtime field |
|---|---|
| `BoardOutline.polygon` | Also available as `.points` |
| `PCBDocument.zones` | Also available as `.copperZones` |
| `CopperZone.polygon` | Also `.filledPolygon` |
| `Pad.size: Vector2D` | Also `.width`, `.height`, `.type` |
| `Footprint` (strict) | Runtime also has `.reference`, `.layer`, `.footprintName` |

Consumer code uses defensive fallbacks:
```typescript
const doc = document as any;
const zones = doc.copperZones ?? doc.zones ?? [];
```

### Dual Data Path (3D vs PCB Editor)

`PCBEditor.loadDocument()` normalizes raw parser output. But `Viewer3DCanvas` passes raw `pcbDocument` from Zustand directly to `PCB3DViewer.loadPCB()`. Both consumers must handle un-normalized data independently.

## Session Priorities

When resuming work, prioritize:

1. Runtime stability (no startup/runtime crashes in Schematic/PCB/3D mode switches)
2. Import reliability (clear user-visible feedback, avoid silent no-op)
3. Backward compatibility (legacy files) without regressing KiCad/OpenCAD imports
4. Modular file format support (new formats via drivers, not hardcoded branches)

## Ground Rules for Future Changes

- Keep format-specific logic inside file format drivers
- Avoid expanding UI importer logic with format-specific parsing branches
- Validate via both:
  - targeted parser/tests (`pnpm dlx vitest run packages/fileio/src/kicad/kicad-bulk-load.test.ts`), and
  - dev runtime (`pnpm --filter @opencad/app dev --host 127.0.0.1 --port 5173`)
- Prefer explicit user-facing warnings over silent failures
- When modifying parser output shapes, update BOTH `board-builder.ts` (3D) and `pcb-editor.ts` (2D)
- Check `normalizeShape()` in parser if pad rendering seems wrong

## Important Context

- Source tree includes both `.ts` and generated `.js` under `src/` in several packages
- Vite resolve extension priority was adjusted to prefer TypeScript sources
- Eagle XML `.brd/.sch` files are parsed via `EaglePCBParser`/`EagleSchematicParser` (14/14 boards + 14/14 schematics pass)
- Legacy binary `.brd/.sch` files (Eagle binary) are rejected with a clear warning
- Pre-existing type errors in `pcb-editor.ts` and `tools.ts` (Vector2D class vs `{x,y}`) are known and non-blocking
- 18/19 KiCad PCBs in Test data parse successfully; 1 known malformed file in allowlist
- 18/19 KiCad PCBs in Test data parse successfully; 1 known malformed file in allowlist
