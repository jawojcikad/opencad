/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/**
 * Determine which side a footprint is on based on its layer string.
 * Defaults to 'top' if undecidable.
 */
function sideFromLayer(layer) {
    const l = layer.toLowerCase();
    if (l.includes('bottom') ||
        l.includes('b.') ||
        l.includes('back') ||
        l === 'b.cu') {
        return 'bottom';
    }
    return 'top';
}
/* ------------------------------------------------------------------ */
/*  PickPlaceGenerator                                                 */
/* ------------------------------------------------------------------ */
/**
 * Generates pick‑and‑place (centroid / XY) data from a PCB document.
 *
 * The output is typically consumed by SMT assembly houses to program
 * their placement machines.
 */
export class PickPlaceGenerator {
    /**
     * Collect pick‑and‑place entries for every footprint in the PCB.
     *
     * Through‑hole‑only footprints (every pad has a drill) are skipped
     * since they are not placed by a pick‑and‑place machine.
     */
    generate(document) {
        const entries = [];
        const footprints = document.footprints ?? [];
        for (const fp of footprints) {
            const pads = fp.pads ?? [];
            // Skip if ALL pads are through‑hole (no SMD pads at all)
            const hasSMD = pads.some((p) => {
                const drill = p.drill;
                return drill === undefined || drill <= 0;
            });
            if (pads.length > 0 && !hasSMD)
                continue;
            const pos = fp.position ?? { x: 0, y: 0 };
            const rot = fp.rotation ?? 0;
            const layer = fp.layer ?? '';
            entries.push({
                reference: fp.reference ?? '',
                value: fp.value ?? '',
                footprint: fp.name ?? '',
                x: pos.x,
                y: pos.y,
                rotation: rot,
                side: sideFromLayer(layer),
            });
        }
        // Sort by reference designator (natural sort)
        entries.sort((a, b) => {
            const aMatch = a.reference.match(/^([A-Za-z]+)(\d+)$/);
            const bMatch = b.reference.match(/^([A-Za-z]+)(\d+)$/);
            if (aMatch && bMatch) {
                const prefixCmp = aMatch[1].localeCompare(bMatch[1]);
                if (prefixCmp !== 0)
                    return prefixCmp;
                return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
            }
            return a.reference.localeCompare(b.reference);
        });
        return entries;
    }
    /**
     * Export entries as a CSV file suitable for most SMT assembly services.
     *
     * Columns: Reference, Value, Package, X (mm), Y (mm), Rotation, Side
     */
    exportCSV(entries) {
        const escapeField = (field) => {
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        };
        const header = 'Reference,Value,Package,X (mm),Y (mm),Rotation,Side';
        const lines = [header];
        for (const e of entries) {
            lines.push([
                escapeField(e.reference),
                escapeField(e.value),
                escapeField(e.footprint),
                e.x.toFixed(4),
                e.y.toFixed(4),
                e.rotation.toFixed(2),
                e.side,
            ].join(','));
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=pick-place-generator.js.map