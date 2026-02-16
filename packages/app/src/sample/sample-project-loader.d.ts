import { type SchematicDocument } from '@opencad/core';
export declare function loadSampleSchematic(): SchematicDocument;
/**
 * Returns a plain object matching the runtime shape the PCBEditor reads:
 *   - `boardOutline.points` (not `polygon`)
 *   - `copperZones` (not `zones`)
 *   - `nets` array
 *   - footprints with `reference`, `layer`, `silkscreen`, and pads with
 *     `width`, `height`, `layer`, `shape`, `number`.
 */
export declare function loadSamplePCB(): any;
//# sourceMappingURL=sample-project-loader.d.ts.map