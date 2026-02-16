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
    generateBOM(document, components) {
        const entries = [];
        const componentMap = new Map();
        for (const comp of components) {
            const id = comp.id ?? '';
            componentMap.set(id, comp);
        }
        const sheets = document.sheets ?? [];
        for (const sheet of sheets) {
            const placed = sheet.components ?? [];
            for (const sc of placed) {
                const reference = sc.reference ?? '';
                const value = sc.value ?? '';
                const compId = sc.componentId ?? sc.component?.id ?? '';
                const comp = componentMap.get(compId);
                const footprintName = comp?.footprint?.name ??
                    sc.footprint ??
                    '';
                const entry = {
                    reference,
                    value,
                    footprint: footprintName,
                    quantity: 1,
                    description: comp?.description ?? sc.description ?? '',
                    manufacturer: comp?.manufacturer ?? sc.properties?.manufacturer,
                    partNumber: comp?.partNumber ?? sc.properties?.partNumber,
                    supplier: comp?.supplier ?? sc.properties?.supplier,
                    supplierPartNumber: comp?.supplierPartNumber ?? sc.properties?.supplierPartNumber,
                    properties: { ...(sc.properties ?? {}) },
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
    groupBOM(entries) {
        const map = new Map();
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
            }
            else {
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
                if (prefixCmp !== 0)
                    return prefixCmp;
                return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
            }
            return aRef.localeCompare(bRef);
        });
    }
    /* ================================================================ */
    /*  Export formats                                                    */
    /* ================================================================ */
    /** Export as RFC 4180 CSV. */
    exportCSV(entries) {
        return this.exportDelimited(entries, ',');
    }
    /** Export as TSV. */
    exportTSV(entries) {
        return this.exportDelimited(entries, '\t');
    }
    /** Export as pretty‑printed JSON. */
    exportJSON(entries) {
        return JSON.stringify(entries, null, 2);
    }
    /** Export as a self-contained HTML table. */
    exportHTML(entries) {
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
        const escapeHTML = (s) => s
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
    exportDelimited(entries, delimiter) {
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
        const escapeField = (field) => {
            if (field.includes(delimiter) ||
                field.includes('"') ||
                field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        };
        const lines = [headers.map(escapeField).join(delimiter)];
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
//# sourceMappingURL=bom-generator.js.map