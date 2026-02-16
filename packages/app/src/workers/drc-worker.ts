// ---------------------------------------------------------------------------
// OpenCAD — DRC Worker
// ---------------------------------------------------------------------------
// Runs Design Rule Check in a background Web Worker thread.
// Receives a PCBDocument and DesignRules, returns DRCViolation[].
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

export interface PadDef {
  id: string;
  net: string;
  position: Vec2;
  size: Vec2;
  shape: string;
  type: string;
  drill?: number;
}

export interface FootprintDef {
  id: string;
  componentId: string;
  reference: string;
  position: Vec2;
  rotation: number;
  layer: string;
  pads: PadDef[];
}

export interface Track {
  id: string;
  net: string;
  layer: string;
  width: number;
  points: Vec2[];
}

export interface Via {
  id: string;
  net: string;
  position: Vec2;
  diameter: number;
  drill: number;
}

export interface DesignRules {
  clearance: number;
  trackWidth: number;
  viaDiameter: number;
  viaDrill: number;
  minTrackWidth: number;
}

export interface PCBDocument {
  footprints: FootprintDef[];
  tracks: Track[];
  vias: Via[];
  designRules: DesignRules;
  layers: string[];
}

export interface DRCViolation {
  id: string;
  type: 'clearance' | 'min-track-width' | 'min-drill' | 'unconnected' | 'overlap';
  severity: 'error' | 'warning';
  message: string;
  position: Vec2;
  objectIds: string[];
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Minimum distance from point P to line segment AB */
function pointToSegmentDist(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return distance(p, a);

  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * abx, y: a.y + t * aby });
}

/** Minimum distance between two line segments */
function segmentToSegmentDist(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): number {
  return Math.min(
    pointToSegmentDist(a1, b1, b2),
    pointToSegmentDist(a2, b1, b2),
    pointToSegmentDist(b1, a1, a2),
    pointToSegmentDist(b2, a1, a2),
  );
}

function generateId(): string {
  return 'drc-' + Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// DRC checks
// ---------------------------------------------------------------------------

function checkMinTrackWidth(tracks: Track[], rules: DesignRules): DRCViolation[] {
  const violations: DRCViolation[] = [];
  for (const t of tracks) {
    if (t.width < rules.minTrackWidth) {
      const mid = t.points[Math.floor(t.points.length / 2)] ?? t.points[0];
      violations.push({
        id: generateId(),
        type: 'min-track-width',
        severity: 'error',
        message: `Track ${t.id} width ${t.width}mm is below minimum ${rules.minTrackWidth}mm`,
        position: mid,
        objectIds: [t.id],
      });
    }
  }
  return violations;
}

function checkMinDrill(vias: Via[], rules: DesignRules): DRCViolation[] {
  const violations: DRCViolation[] = [];
  for (const v of vias) {
    if (v.drill < rules.viaDrill * 0.9) {
      violations.push({
        id: generateId(),
        type: 'min-drill',
        severity: 'error',
        message: `Via ${v.id} drill ${v.drill}mm is below minimum ${rules.viaDrill}mm`,
        position: v.position,
        objectIds: [v.id],
      });
    }
  }
  return violations;
}

function checkTrackClearance(tracks: Track[], rules: DesignRules): DRCViolation[] {
  const violations: DRCViolation[] = [];

  for (let i = 0; i < tracks.length; i++) {
    for (let j = i + 1; j < tracks.length; j++) {
      const ta = tracks[i];
      const tb = tracks[j];

      // Only check clearance between different nets on the same layer
      if (ta.net === tb.net) continue;
      if (ta.layer !== tb.layer) continue;

      // Check each segment pair
      for (let sa = 0; sa < ta.points.length - 1; sa++) {
        for (let sb = 0; sb < tb.points.length - 1; sb++) {
          const dist = segmentToSegmentDist(
            ta.points[sa],
            ta.points[sa + 1],
            tb.points[sb],
            tb.points[sb + 1],
          );

          const requiredClearance = rules.clearance + (ta.width + tb.width) / 2;
          if (dist < requiredClearance) {
            const midA = {
              x: (ta.points[sa].x + ta.points[sa + 1].x) / 2,
              y: (ta.points[sa].y + ta.points[sa + 1].y) / 2,
            };
            violations.push({
              id: generateId(),
              type: 'clearance',
              severity: 'error',
              message: `Clearance violation between track ${ta.id} (net: ${ta.net}) and track ${tb.id} (net: ${tb.net}): ${dist.toFixed(3)}mm < ${requiredClearance.toFixed(3)}mm`,
              position: midA,
              objectIds: [ta.id, tb.id],
            });
          }
        }
      }
    }
  }

  return violations;
}

function checkPadClearance(footprints: FootprintDef[], rules: DesignRules): DRCViolation[] {
  const violations: DRCViolation[] = [];

  // Gather all pads with absolute positions
  const allPads: { pad: PadDef; absPos: Vec2; fpRef: string }[] = [];
  for (const fp of footprints) {
    for (const pad of fp.pads) {
      // Compute absolute position (ignoring rotation for simplicity)
      const absPos: Vec2 = {
        x: fp.position.x + pad.position.x,
        y: fp.position.y + pad.position.y,
      };
      allPads.push({ pad, absPos, fpRef: fp.reference });
    }
  }

  for (let i = 0; i < allPads.length; i++) {
    for (let j = i + 1; j < allPads.length; j++) {
      const a = allPads[i];
      const b = allPads[j];
      if (a.pad.net === b.pad.net) continue;

      const dist = distance(a.absPos, b.absPos);
      const minSize = Math.min(
        Math.max(a.pad.size.x, a.pad.size.y),
        Math.max(b.pad.size.x, b.pad.size.y),
      );
      const requiredClearance = rules.clearance + minSize;
      if (dist < requiredClearance) {
        violations.push({
          id: generateId(),
          type: 'clearance',
          severity: 'error',
          message: `Pad clearance violation between ${a.fpRef}.${a.pad.id} (net: ${a.pad.net}) and ${b.fpRef}.${b.pad.id} (net: ${b.pad.net})`,
          position: a.absPos,
          objectIds: [a.pad.id, b.pad.id],
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<{ document: PCBDocument; rules: DesignRules }>) => {
  const { document: pcbDoc, rules } = e.data;

  console.log('[DRC Worker] Starting design rule check…');

  const violations: DRCViolation[] = [
    ...checkMinTrackWidth(pcbDoc.tracks, rules),
    ...checkMinDrill(pcbDoc.vias, rules),
    ...checkTrackClearance(pcbDoc.tracks, rules),
    ...checkPadClearance(pcbDoc.footprints, rules),
  ];

  console.log(`[DRC Worker] Complete — ${violations.length} violation(s) found.`);

  self.postMessage({ violations });
};
