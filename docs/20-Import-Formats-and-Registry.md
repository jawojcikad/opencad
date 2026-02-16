# Import Formats and Registry Design

## Import Entry Point

UI file import flow:

1. `packages/ui/src/app/file-import.ts` — `importFiles(File[])` decodes files, detects binary vs text
2. `packages/fileio/src/import/format-registry.ts` — `parseDesignFiles(files)` dispatches to drivers
3. `packages/ui/src/app/file-import.ts` — `applyImportResult()` pushes documents to Zustand store

## Modular Registry

Defined in `packages/fileio/src/import/format-registry.ts`.

### Core Interfaces

```typescript
interface DesignImportFile {
  name: string;       // filename
  content: string;    // decoded text content
  binaryLike: boolean; // true if NUL-byte ratio >2%
}

interface DesignImportResult {
  projectName: string;
  schematicDocument?: SchematicDocument;
  pcbDocument?: PCBDocument;
  warnings: string[];
}

interface DesignFormatDriver {
  name: string;
  priority: number;
  canHandle(files: DesignImportFile[]): boolean;
  parse(files: DesignImportFile[]): DesignImportResult;
}
```

### Registry Behavior

- Drivers are sorted by priority (highest first)
- Each driver parses relevant files only
- Results are merged (`projectName` / `schematicDocument` / `pcbDocument` / `warnings`)
- Parsing continues across all drivers; per-file failures are caught and added to warnings

## Existing Drivers

### 1. `KiCadAndJsonDriver` (priority 100)

**Handles:** `.kicad_pro`, `.kicad_sch`, `.kicad_pcb`, `.opencad`, `.json` (text-based only)

**Parser internals:**
- `SExpressionParser` — tokenizes and builds S-expression AST from KiCad text format
- `KiCadSchematicParser` — parses `.kicad_sch` → `SchematicDocument`
- `KiCadPCBParser` — parses `.kicad_pcb` → `PCBDocument`

**Parser output shapes (important for consumers):**

| Output field | Type | Notes |
|---|---|---|
| `schDoc.sheets[].wires[]` | `{ points: Vector2D[] }` | Polyline vertices, NOT `{start, end}` |
| `schDoc.sheets[].components[]` | `SchematicComponent` | With `reference`, `value`, `pinNetMap` |
| `pcbDoc.footprints[]` | `Footprint` | Plus runtime extras: `reference`, `layer`, `footprintName` |
| `pcbDoc.footprints[].pads[]` | `Pad` | `shape` normalized to PadShape enum values; also has `width`, `height`, `type` fields |
| `pcbDoc.boardOutline` | `{ polygon: Vector2D[] }` | Closed polygon from Edge.Cuts layer |
| `pcbDoc.zones[]` | `CopperZone[]` | Each has `polygon`, `filledPolygon`, `layer`, `net` |
| `pcbDoc.copperZones` | Same as `zones` | Alias for backward compatibility |
| `pcbDoc.tracks[]` | `Track[]` | `{ start, end, width, layer }` |
| `pcbDoc.vias[]` | `Via[]` | `{ position, diameter, drill, layers }` |

**Pad shape normalization (`normalizeShape()`):**

| KiCad value | Output `PadShape` |
|---|---|
| `'circle'` | `PadShape.Circle` (`'circle'`) |
| `'rect'`, `'rectangle'` | `PadShape.Rect` (`'rect'`) |
| `'oval'`, `'obround'` | `PadShape.Oval` (`'oval'`) |
| `'roundrect'` | `PadShape.RoundRect` (`'roundrect'`) |
| `'custom'` | `PadShape.Custom` (`'custom'`) |
| anything else | `PadShape.Rect` (`'rect'`) — default |

### 2. `EagleXMLDriver` (priority 75)

**Handles:** text-based Eagle XML `.brd`, `.pcb`, `.sch`, `.schm` files (detected by `<!DOCTYPE eagle` + `<eagle` markers)

**Parser internals:**
- `EaglePCBParser` — parses Eagle XML board files → `PCBDocument`-compatible output
- `EagleSchematicParser` — parses Eagle XML schematic files → `SchematicDocument`-compatible output
- Minimal DOM parser (`parseXML`) built-in — no external XML dependency

**Behavior:**
- Extracts full PCB data: footprints (with SMD/TH/NPTH pads), tracks, vias, copper zones, board outline
- Extracts schematic data: components (with symbol geometry), wires, net labels, junctions
- Eagle layer numbers mapped to KiCad-style layer names (F.Cu, B.Cu, etc.) for downstream renderer compatibility
- Rotation parsed from Eagle's string format (R90, MR270) to degrees
- All coordinates already in mm (native Eagle XML coordinate system)

### 3. `UnsupportedBinaryDriver` (priority 10)

**Handles:** binary-like `.brd`, `.pcb`, `.sch`, `.schm` files

**Behavior:**
- Produces a clear user-facing warning that the binary format is not supported
- Does NOT generate any synthetic/heuristic geometry
- No documents are returned — only warnings
- Serves as a catch-all to give explicit feedback instead of silent failure

## Recommended Extension Pattern

For each new format:

1. Add dedicated driver module under `packages/fileio/src/import/drivers/`
2. Keep decoding/detection inside driver or shared detector utility
3. Return warnings instead of throwing for per-file recoverable failures
4. Match output shapes documented above (especially pad/zone/outline fields)
5. Add corpus tests with known-good + known-bad fixtures
6. Register driver in one place (registry composition)

## Future Format Targets

- Eagle XML
- Altium ASCII/Binary
- OrCAD/Protel historical formats
- Vendor-specific legacy binaries
