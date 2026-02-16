// ─── Native Format ───────────────────────────────────────────────────
export { NativeSerializer } from './native/serializer';
export type { OpenCADProjectFile } from './native/serializer';

// ─── Gerber Export ───────────────────────────────────────────────────
export { GerberGenerator } from './gerber/gerber-generator';
export type { GerberAperture } from './gerber/gerber-generator';

// ─── Excellon Drill ──────────────────────────────────────────────────
export { ExcellonGenerator } from './drill/excellon-generator';
export type { DrillHole } from './drill/excellon-generator';

// ─── BOM Export ──────────────────────────────────────────────────────
export { BOMGenerator } from './bom/bom-generator';
export type { BOMEntry } from './bom/bom-generator';

// ─── Pick & Place ────────────────────────────────────────────────────
export { PickPlaceGenerator } from './pick-place/pick-place-generator';
export type { PickPlaceEntry } from './pick-place/pick-place-generator';

// ─── SVG Export ──────────────────────────────────────────────────────
export { SVGExporter } from './pdf/svg-exporter';

// ─── KiCad Import ────────────────────────────────────────────────────
export {
  SExpressionParser,
  KiCadSchematicParser,
  KiCadPCBParser,
} from './kicad/kicad-project-parser';

// ─── Eagle Import ────────────────────────────────────────────────────
export {
  EaglePCBParser,
  EagleSchematicParser,
} from './eagle/eagle-xml-parser';

// ─── Multi-format design import (modular registry) ─────────────────
export {
  parseDesignFiles,
} from './import/format-registry';
export type {
  DesignImportFile,
  DesignImportResult,
} from './import/format-registry';
