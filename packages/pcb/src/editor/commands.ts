import {
  Command,
  PCBDocument,
  Footprint,
  Track,
  Via,
  Vector2D,
  Layer,
  generateId,
} from '@opencad/core';

/**
 * Place a footprint on the PCB.
 */
export class PlaceFootprintCommand implements Command {
  public readonly description: string;
  private footprint: Footprint;
  private document: PCBDocument;

  constructor(document: PCBDocument, footprint: Footprint) {
    this.document = document;
    this.footprint = footprint;
    this.description = `Place footprint ${footprint.reference ?? footprint.id}`;
  }

  execute(): void {
    this.document.footprints.push(this.footprint);
  }

  undo(): void {
    const idx = this.document.footprints.findIndex((f) => f.id === this.footprint.id);
    if (idx !== -1) {
      this.document.footprints.splice(idx, 1);
    }
  }
}

/**
 * Move a footprint to a new position.
 */
export class MoveFootprintCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private footprintId: string;
  private oldPosition: Vector2D;
  private newPosition: Vector2D;

  constructor(
    document: PCBDocument,
    footprintId: string,
    oldPosition: Vector2D,
    newPosition: Vector2D,
  ) {
    this.document = document;
    this.footprintId = footprintId;
    this.oldPosition = { ...oldPosition };
    this.newPosition = { ...newPosition };
    this.description = `Move footprint ${footprintId}`;
  }

  execute(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (fp) {
      fp.position = { ...this.newPosition };
    }
  }

  undo(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (fp) {
      fp.position = { ...this.oldPosition };
    }
  }
}

/**
 * Rotate a footprint by a given angle (radians).
 */
export class RotateFootprintCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private footprintId: string;
  private oldRotation: number;
  private newRotation: number;

  constructor(
    document: PCBDocument,
    footprintId: string,
    oldRotation: number,
    newRotation: number,
  ) {
    this.document = document;
    this.footprintId = footprintId;
    this.oldRotation = oldRotation;
    this.newRotation = newRotation;
    this.description = `Rotate footprint ${footprintId}`;
  }

  execute(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (fp) {
      fp.rotation = this.newRotation;
    }
  }

  undo(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (fp) {
      fp.rotation = this.oldRotation;
    }
  }
}

/**
 * Flip a footprint between front and back copper layers.
 * Mirrors the Y axis and swaps layer assignments.
 */
export class FlipFootprintCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private footprintId: string;
  private oldLayer: Layer;
  private newLayer: Layer;
  private oldPadLayers: Map<string, Layer>;

  constructor(document: PCBDocument, footprintId: string) {
    this.document = document;
    this.footprintId = footprintId;
    this.description = `Flip footprint ${footprintId}`;

    const fp = this.document.footprints.find((f) => f.id === footprintId);
    this.oldLayer = fp?.layer ?? ('F.Cu' as Layer);
    this.newLayer =
      this.oldLayer === ('F.Cu' as Layer) ? ('B.Cu' as Layer) : ('F.Cu' as Layer);

    // Save old pad layers
    this.oldPadLayers = new Map();
    if (fp) {
      for (const pad of fp.pads) {
        this.oldPadLayers.set(pad.id, pad.layer ?? ('F.Cu' as Layer));
      }
    }
  }

  execute(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (!fp) return;

    fp.layer = this.newLayer;

    // Mirror pads' Y positions and swap layers
    for (const pad of fp.pads) {
      pad.position = { x: pad.position.x, y: -pad.position.y };
      if (pad.type !== 'through_hole') {
        pad.layer = this.flipLayer(pad.layer ?? ('F.Cu' as Layer));
      }
    }

    // Mirror silkscreen
    if (fp.silkscreen) {
      for (const silk of fp.silkscreen) {
        if (silk.position) {
          silk.position = { x: silk.position.x, y: -silk.position.y };
        }
        silk.layer = this.flipSilkLayer(silk.layer);
      }
    }
  }

  undo(): void {
    const fp = this.document.footprints.find((f) => f.id === this.footprintId);
    if (!fp) return;

    fp.layer = this.oldLayer;

    // Mirror back
    for (const pad of fp.pads) {
      pad.position = { x: pad.position.x, y: -pad.position.y };
      const savedLayer = this.oldPadLayers.get(pad.id);
      if (savedLayer && pad.type !== 'through_hole') {
        pad.layer = savedLayer;
      }
    }

    if (fp.silkscreen) {
      for (const silk of fp.silkscreen) {
        if (silk.position) {
          silk.position = { x: silk.position.x, y: -silk.position.y };
        }
        silk.layer = this.flipSilkLayer(silk.layer);
      }
    }
  }

  private flipLayer(layer: Layer): Layer {
    const map: Record<string, string> = {
      'F.Cu': 'B.Cu',
      'B.Cu': 'F.Cu',
    };
    return (map[layer as string] ?? layer) as Layer;
  }

  private flipSilkLayer(layer?: Layer): Layer {
    if (!layer) return 'F.SilkS' as Layer;
    const map: Record<string, string> = {
      'F.SilkS': 'B.SilkS',
      'B.SilkS': 'F.SilkS',
      'F.Fab': 'B.Fab',
      'B.Fab': 'F.Fab',
      'F.CrtYd': 'B.CrtYd',
      'B.CrtYd': 'F.CrtYd',
    };
    return (map[layer as string] ?? layer) as Layer;
  }
}

/**
 * Route a track (add one or more track segments).
 */
export class RouteTrackCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private tracks: Track[];

  constructor(document: PCBDocument, tracks: Track[]) {
    this.document = document;
    this.tracks = tracks.map((t) => ({ ...t }));
    this.description = `Route ${tracks.length} track segment(s)`;
  }

  execute(): void {
    for (const track of this.tracks) {
      this.document.tracks.push({ ...track });
    }
  }

  undo(): void {
    const idsToRemove = new Set(this.tracks.map((t) => t.id));
    this.document.tracks = this.document.tracks.filter((t) => !idsToRemove.has(t.id));
  }
}

/**
 * Delete a track segment.
 */
export class DeleteTrackCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private trackId: string;
  private deletedTrack: Track | null = null;
  private deletedIndex: number = -1;

  constructor(document: PCBDocument, trackId: string) {
    this.document = document;
    this.trackId = trackId;
    this.description = `Delete track ${trackId}`;
  }

  execute(): void {
    const idx = this.document.tracks.findIndex((t) => t.id === this.trackId);
    if (idx !== -1) {
      this.deletedTrack = { ...this.document.tracks[idx] };
      this.deletedIndex = idx;
      this.document.tracks.splice(idx, 1);
    }
  }

  undo(): void {
    if (this.deletedTrack) {
      this.document.tracks.splice(this.deletedIndex, 0, { ...this.deletedTrack });
    }
  }
}

/**
 * Place a via.
 */
export class PlaceViaCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private via: Via;

  constructor(document: PCBDocument, via: Via) {
    this.document = document;
    this.via = { ...via };
    this.description = `Place via at (${via.position.x.toFixed(2)}, ${via.position.y.toFixed(2)})`;
  }

  execute(): void {
    this.document.vias.push({ ...this.via });
  }

  undo(): void {
    const idx = this.document.vias.findIndex((v) => v.id === this.via.id);
    if (idx !== -1) {
      this.document.vias.splice(idx, 1);
    }
  }
}

/**
 * Delete any PCB item by ID (footprint, track, via).
 */
export class DeleteItemCommand implements Command {
  public readonly description: string;
  private document: PCBDocument;
  private itemId: string;
  private deletedItem: { type: string; data: any; index: number } | null = null;

  constructor(document: PCBDocument, itemId: string) {
    this.document = document;
    this.itemId = itemId;
    this.description = `Delete item ${itemId}`;
  }

  execute(): void {
    // Try footprints
    let idx = this.document.footprints.findIndex((f) => f.id === this.itemId);
    if (idx !== -1) {
      this.deletedItem = {
        type: 'footprint',
        data: this.document.footprints[idx],
        index: idx,
      };
      this.document.footprints.splice(idx, 1);
      return;
    }

    // Try tracks
    idx = this.document.tracks.findIndex((t) => t.id === this.itemId);
    if (idx !== -1) {
      this.deletedItem = {
        type: 'track',
        data: this.document.tracks[idx],
        index: idx,
      };
      this.document.tracks.splice(idx, 1);
      return;
    }

    // Try vias
    idx = this.document.vias.findIndex((v) => v.id === this.itemId);
    if (idx !== -1) {
      this.deletedItem = {
        type: 'via',
        data: this.document.vias[idx],
        index: idx,
      };
      this.document.vias.splice(idx, 1);
      return;
    }
  }

  undo(): void {
    if (!this.deletedItem) return;

    switch (this.deletedItem.type) {
      case 'footprint':
        this.document.footprints.splice(this.deletedItem.index, 0, this.deletedItem.data);
        break;
      case 'track':
        this.document.tracks.splice(this.deletedItem.index, 0, this.deletedItem.data);
        break;
      case 'via':
        this.document.vias.splice(this.deletedItem.index, 0, this.deletedItem.data);
        break;
    }
  }
}
