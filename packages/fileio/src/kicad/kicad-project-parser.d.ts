import { SchematicDocument, PCBDocument } from '@opencad/core';
/**
 * A fully functional S‑expression parser for KiCad file formats.
 *
 * KiCad files (`.kicad_sch`, `.kicad_pcb`, `.kicad_pro`, etc.) use a
 * Lisp‑like S‑expression syntax:
 *
 * ```
 * (kicad_pcb (version 20211014) (generator pcbnew)
 *   (general (thickness 1.6))
 *   ...)
 * ```
 *
 * This parser converts such strings into nested JS arrays where each
 * S‑expression `(a b c)` becomes `['a', 'b', 'c']` and nested
 * sub‑expressions are nested arrays.
 *
 * Atoms that look like numbers are converted to `number`.
 * Quoted strings have their quotes stripped.
 */
export declare class SExpressionParser {
    static parse(input: string): any[];
    /**
     * Tokenize an S‑expression string into an array of string tokens.
     * Handles quoted strings (preserving spaces inside), parentheses,
     * and regular atoms.
     */
    private static tokenize;
    /** Convert an atom string to a number if possible, else keep as string. */
    private static parseAtom;
}
/**
 * Parses a KiCad 6/7/8 `.kicad_sch` file into an OpenCAD
 * `SchematicDocument`.
 */
export declare class KiCadSchematicParser {
    parse(content: string): SchematicDocument;
    private parseSymbolInstances;
    private parseWires;
    private parseLabels;
    private extractTitle;
    private paperDimensions;
    /** Find a child node whose first element is `name`. */
    private findChild;
    /** Find a node anywhere in iterables. */
    private findNode;
    /** Get a KiCad property value by key (e.g. `(property "key" "value")`). */
    private getPropertyValue;
    /** Get a KiCad named property field value. */
    private getPropertyFieldValue;
}
/**
 * Parses a KiCad 6/7/8 `.kicad_pcb` file into an OpenCAD `PCBDocument`.
 */
export declare class KiCadPCBParser {
    parse(content: string): PCBDocument;
    private parseLayers;
    private parseTracks;
    private parseVias;
    private parseFootprints;
    private parseZones;
    private parseBoardOutline;
    /**
     * Chain disconnected line segments into an ordered vertex sequence.
     * Uses a simple greedy algorithm with epsilon matching.
     */
    private chainLines;
    private parseDesignRules;
    private normalizeShape;
    private findChild;
    private findNode;
    private getPropertyFieldValue;
}
//# sourceMappingURL=kicad-project-parser.d.ts.map