import { SchematicDocument, PCBDocument, Layer } from '@opencad/core';
/**
 * Export schematic sheets or PCB layers to standalone SVG documents.
 */
export declare class SVGExporter {
    /**
     * Export a schematic document (or a single sheet) to SVG.
     *
     * @param document       The schematic document.
     * @param sheetIndex     If provided, only that sheet is rendered;
     *                       otherwise the first sheet is used.
     */
    exportSchematic(document: SchematicDocument, sheetIndex?: number): string;
    /**
     * Export specific PCB layers to a single SVG document.
     */
    exportPCBLayer(document: PCBDocument, layers: Layer[]): string;
    private renderSchematicToSVG;
    private renderPCBToSVG;
    private svgHeader;
    private svgLine;
    private svgCircle;
    private svgRect;
    private svgPolygon;
    private svgText;
    private svgPath;
    private svgFooter;
}
//# sourceMappingURL=svg-exporter.d.ts.map