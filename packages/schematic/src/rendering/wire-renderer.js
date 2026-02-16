/**
 * Renders wires, junctions, net labels, and power ports on a schematic sheet.
 */
export class WireRenderer {
    static WIRE_COLOR = '#008800';
    static WIRE_SELECTED_COLOR = '#0088ff';
    static WIRE_WIDTH = 2;
    static JUNCTION_RADIUS = 4;
    static JUNCTION_COLOR = '#008800';
    static LABEL_COLOR = '#009988';
    static LABEL_SELECTED_COLOR = '#0088ff';
    static POWER_COLOR = '#cc0000';
    // ── Wire ───────────────────────────────────────────────────────────────────
    renderWire(ctx, wire, selected) {
        const g = ctx.getContext();
        if (!wire.points || wire.points.length < 2)
            return;
        g.save();
        g.strokeStyle = selected
            ? WireRenderer.WIRE_SELECTED_COLOR
            : WireRenderer.WIRE_COLOR;
        g.lineWidth = selected
            ? WireRenderer.WIRE_WIDTH + 1
            : WireRenderer.WIRE_WIDTH;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(wire.points[0].x, wire.points[0].y);
        for (let i = 1; i < wire.points.length; i++) {
            g.lineTo(wire.points[i].x, wire.points[i].y);
        }
        g.stroke();
        // Draw small dot at each vertex (bend point)
        g.fillStyle = g.strokeStyle;
        for (const p of wire.points) {
            g.beginPath();
            g.arc(p.x, p.y, 2, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }
    // ── Junction ───────────────────────────────────────────────────────────────
    renderJunction(ctx, junction) {
        const g = ctx.getContext();
        g.save();
        g.fillStyle = WireRenderer.JUNCTION_COLOR;
        g.beginPath();
        g.arc(junction.position.x, junction.position.y, WireRenderer.JUNCTION_RADIUS, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }
    // ── Net Label ──────────────────────────────────────────────────────────────
    renderNetLabel(ctx, label, selected) {
        const g = ctx.getContext();
        g.save();
        const labelText = label.text ?? label.name ?? '';
        const color = selected
            ? WireRenderer.LABEL_SELECTED_COLOR
            : WireRenderer.LABEL_COLOR;
        g.translate(label.position.x, label.position.y);
        if (label.rotation) {
            g.rotate((label.rotation * Math.PI) / 180);
        }
        // Measure text for background
        g.font = '13px monospace';
        const textMetrics = g.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = 14;
        const padding = 3;
        // Draw background flag shape
        g.fillStyle = selected ? 'rgba(0, 136, 255, 0.1)' : 'rgba(0, 153, 136, 0.08)';
        g.strokeStyle = color;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(6, -(textHeight / 2 + padding));
        g.lineTo(textWidth + 6 + padding * 2, -(textHeight / 2 + padding));
        g.lineTo(textWidth + 6 + padding * 2, textHeight / 2 + padding);
        g.lineTo(6, textHeight / 2 + padding);
        g.closePath();
        g.fill();
        g.stroke();
        // Draw connection dot
        g.fillStyle = color;
        g.beginPath();
        g.arc(0, 0, 3, 0, Math.PI * 2);
        g.fill();
        // Draw label text
        g.fillStyle = color;
        g.font = '13px monospace';
        g.textBaseline = 'middle';
        g.textAlign = 'left';
        g.fillText(labelText, 6 + padding, 0);
        g.restore();
    }
    // ── Power Port ─────────────────────────────────────────────────────────────
    renderPowerPort(ctx, port, selected) {
        const g = ctx.getContext();
        g.save();
        const color = selected
            ? WireRenderer.LABEL_SELECTED_COLOR
            : WireRenderer.POWER_COLOR;
        g.translate(port.position.x, port.position.y);
        if (port.rotation) {
            g.rotate((port.rotation * Math.PI) / 180);
        }
        g.strokeStyle = color;
        g.fillStyle = color;
        g.lineWidth = 2;
        const style = port.style ?? 'bar';
        switch (style) {
            case 'bar': {
                // VCC style: line up, bar on top
                g.beginPath();
                g.moveTo(0, 0);
                g.lineTo(0, -20);
                g.stroke();
                g.beginPath();
                g.moveTo(-10, -20);
                g.lineTo(10, -20);
                g.stroke();
                break;
            }
            case 'arrow': {
                // Power arrow pointing up
                g.beginPath();
                g.moveTo(0, 0);
                g.lineTo(0, -16);
                g.stroke();
                g.beginPath();
                g.moveTo(0, -24);
                g.lineTo(-6, -16);
                g.lineTo(6, -16);
                g.closePath();
                g.fill();
                break;
            }
            case 'circle': {
                // Power circle (common for ground variants)
                g.beginPath();
                g.moveTo(0, 0);
                g.lineTo(0, -12);
                g.stroke();
                g.beginPath();
                g.arc(0, -18, 6, 0, Math.PI * 2);
                g.stroke();
                break;
            }
            default: {
                // GND-style symbol with three horizontal lines
                g.beginPath();
                g.moveTo(0, 0);
                g.lineTo(0, 12);
                g.stroke();
                g.beginPath();
                g.moveTo(-12, 12);
                g.lineTo(12, 12);
                g.stroke();
                g.beginPath();
                g.moveTo(-8, 16);
                g.lineTo(8, 16);
                g.stroke();
                g.beginPath();
                g.moveTo(-4, 20);
                g.lineTo(4, 20);
                g.stroke();
                break;
            }
        }
        // Draw name
        g.font = 'bold 11px monospace';
        g.textAlign = 'center';
        g.textBaseline = 'bottom';
        g.fillText(port.name, 0, style === 'bar' ? -26 : -26);
        // Connection dot
        g.beginPath();
        g.arc(0, 0, 2.5, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }
}
//# sourceMappingURL=wire-renderer.js.map