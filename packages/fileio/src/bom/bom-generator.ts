import type {
  SchematicDocument,
  Component,
  SchematicComponent,
  Sheet,
} from '@opencad/core';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BOMEntry {
  reference: string;
  value: string;
  footprint: string;
  quantity: number;
  description: string;
  manufacturer?: string;
  partNumber?: string;
  supplier?: string;
  supplierPartNumber?: string;
  properties: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  BOMGenerator                                                       */
/* ------------------------------------------------------------------ */

export class BOMGenerator {
  /**
   * Generate a flat (un‑grouped) BOM from a schematic document.
   *
   * Each placed component results in one entry with `quantity = 1`.
   * If a `components` library array is supplied, extra metadata
   * (manufacturer, partNumber, etc.) is merged in.
   */
  generateBOM(
    document: SchematicDocument,
    components: Component[],
  ): BOMEntry[] {
    const entries: BOMEntry[] = [];
    const componentMap = new Map<string, Component>();
    for (const comp of components) {
      const id: string = (comp as any).id ?? '';
      componentMap.set(id, comp);
    }

    const sheets: Sheet[] = (document as any).sheets ?? [];
    for (const sheet of sheets) {
      const placed: SchematicComponent[] = (sheet as any).components ?? [];
      for (const sc of placed) {
        const reference: string = (sc as any).reference ?? '';
        const value: string = (sc as any).value ?? '';
        const compId: string = (sc as any).componentId ?? (sc as any).component?.id ?? '';
        const comp = componentMap.get(compId);

        const footprintName: string =
          (comp as any)?.footprint?.name ??
          (sc as any).footprint ??
          '';

        const entry: BOMEntry = {
          reference,
          value,
          footprint: footprintName,
          quantity: 1,
          description: (comp as any)?.description ?? (sc as any).description ?? '',
          manufacturer: (comp as any)?.manufacturer ?? (sc as any).properties?.manufacturer,
          partNumber: (comp as any)?.partNumber ?? (sc as any).properties?.partNumber,
          supplier: (comp as any)?.supplier ?? (sc as any).properties?.supplier,
          supplierPartNumber: (comp as any)?.supplierPartNumber ?? (sc as any).properties?.supplierPartNumber,
          properties: { ...((sc as any).properties ?? {}) },
        };

        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Group BOM entries with the same value + footprint + description
   * combination, summing quantities and merging reference designators.
   */
  groupBOM(entries: BOMEntry[]): BOMEntry[] {
    const map = new Map<string, BOMEntry>();

    for (const entry of entries) {
      const key = `${entry.value}||${entry.footprint}||${entry.description}||${entry.manufacturer ?? ''}||${entry.partNumber ?? ''}`;

      const existing = map.get(key);
      if (existing) {
        existing.quantity += entry.quantity;
        // Merge reference designators
        const refs = existing.reference.split(', ');
        refs.push(entry.reference);
        // Natural‑sort references: R1, R2, R10 instead of R1, R10, R2
        refs.sort((a, b) => {
          const aMatch = a.match(/^([A-Za-z]+)(\d+)$/);
          const bMatch = b.match(/^([A-Za-z]+)(\d+)$/);
          if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
            return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
          }
          return a.localeCompare(b);
        });
        existing.reference = refs.join(', ');
      } else {
        map.set(key, { ...entry });
      }
    }

    // Sort grouped entries by first reference designator
    return [...map.values()].sort((a, b) => {
      const aRef = a.reference.split(', ')[0];
      const bRef = b.reference.split(', ')[0];
      const aMatch = aRef.match(/^([A-Za-z]+)(\d+)$/);
      const bMatch = bRef.match(/^([A-Za-z]+)(\d+)$/);
      if (aMatch && bMatch) {
        const prefixCmp = aMatch[1].localeCompare(bMatch[1]);
        if (prefixCmp !== 0) return prefixCmp;
        return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
      }
      return aRef.localeCompare(bRef);
    });
  }

  /* ================================================================ */
  /*  Export formats                                                    */
  /* ================================================================ */

  /** Export as RFC 4180 CSV. */
  exportCSV(entries: BOMEntry[]): string {
    return this.exportDelimited(entries, ',');
  }

  /** Export as TSV. */
  exportTSV(entries: BOMEntry[]): string {
    return this.exportDelimited(entries, '\t');
  }

  /** Export as pretty‑printed JSON. */
  exportJSON(entries: BOMEntry[]): string {
    return JSON.stringify(entries, null, 2);
  }

  /** Export as a self-contained HTML table. */
  exportHTML(entries: BOMEntry[]): string {
    const headers = [
      'Reference',
      'Value',
      'Footprint',
      'Qty',
      'Description',
      'Manufacturer',
      'Part Number',
      'Supplier',
      'Supplier P/N',
    ];

    const escapeHTML = (s: string): string =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const rows = entries.map((e) => {
      const cells = [
        e.reference,
        e.value,
        e.footprint,
        e.quantity.toString(),
        e.description,
        e.manufacturer ?? '',
        e.partNumber ?? '',
        e.supplier ?? '',
        e.supplierPartNumber ?? '',
      ];
      return `    <tr>${cells.map((c) => `<td>${escapeHTML(c)}</td>`).join('')}</tr>`;
    });

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <title>Bill of Materials</title>',
      '  <style>',
      '    body { font-family: Arial, sans-serif; margin: 20px; }',
      '    table { border-collapse: collapse; width: 100%; }',
      '    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }',
      '    th { background: #f4f4f4; }',
      '    tr:nth-child(even) { background: #fafafa; }',
      '  </style>',
      '</head>',
      '<body>',
      '  <h1>Bill of Materials</h1>',
      `  <p>Total unique entries: ${entries.length}</p>`,
      '  <table>',
      `    <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`,
      ...rows,
      '  </table>',
      '</body>',
      '</html>',
    ].join('\n');
  }

  /* ================================================================ */
  /*  Internal helpers                                                 */
  /* ================================================================ */

  private exportDelimited(entries: BOMEntry[], delimiter: string): string {
    const headers = [
      'Reference',
      'Value',
      'Footprint',
      'Quantity',
      'Description',
      'Manufacturer',
      'Part Number',
      'Supplier',
      'Supplier Part Number',
    ];

    const escapeField = (field: string): string => {
      if (
        field.includes(delimiter) ||
        field.includes('"') ||
        field.includes('\n')
      ) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines: string[] = [headers.map(escapeField).join(delimiter)];

    for (const e of entries) {
      const row = [
        e.reference,
        e.value,
        e.footprint,
        e.quantity.toString(),
        e.description,
        e.manufacturer ?? '',
        e.partNumber ?? '',
        e.supplier ?? '',
        e.supplierPartNumber ?? '',
      ];
      lines.push(row.map(escapeField).join(delimiter));
    }

    return lines.join('\n');
  }
}
