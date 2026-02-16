import * as THREE from 'three';
import {
  PCBDocument,
  Footprint,
  Pad,
  PadShape,
  PadType,
  Track,
  Via,
  CopperZone,
  BoardOutline,
  Layer,
  Vector2D,
} from '@opencad/core';

// Board layer Z-positions (mm) — for a standard 1.6 mm board
const BOARD_THICKNESS = 1.6;
const COPPER_THICKNESS = 0.035;
const MASK_THICKNESS = 0.02;
const SILK_THICKNESS = 0.01;

const Z_BOTTOM_SILK = -SILK_THICKNESS;
const Z_BOTTOM_MASK = 0;
const Z_BOTTOM_COPPER = MASK_THICKNESS;
const Z_TOP_COPPER = BOARD_THICKNESS - MASK_THICKNESS;
const Z_TOP_MASK = BOARD_THICKNESS;
const Z_TOP_SILK = BOARD_THICKNESS + MASK_THICKNESS;

export class BoardBuilder {
  // ---------------------------------------------------------------------------
  // Full PCB assembly
  // ---------------------------------------------------------------------------

  buildFullPCB(document: PCBDocument): THREE.Group {
    const group = new THREE.Group();
    group.name = 'pcb-assembly';
    const outlinePoints = this.resolveOutlinePoints(document);
    if (outlinePoints.length < 3) return group;

    // 1. Board substrate
    const boardMesh = this.buildBoardMeshFromPoints(outlinePoints, BOARD_THICKNESS);
    group.add(boardMesh);

    // 2. Bottom copper
    const bottomCopper = this.buildCopperLayer(document, Layer.BCu, Z_BOTTOM_COPPER);
    bottomCopper.name = 'layer-bottom-copper';
    group.add(bottomCopper);

    // 3. Top copper
    const topCopper = this.buildCopperLayer(document, Layer.FCu, Z_TOP_COPPER);
    topCopper.name = 'layer-top-copper';
    group.add(topCopper);

    // 4. Solder masks
    const bottomMask = this.buildSolderMaskWithOutline(document, Layer.BMask, Z_BOTTOM_MASK, outlinePoints);
    bottomMask.name = 'layer-bottom-mask';
    group.add(bottomMask);

    const topMask = this.buildSolderMaskWithOutline(document, Layer.FMask, Z_TOP_MASK, outlinePoints);
    topMask.name = 'layer-top-mask';
    group.add(topMask);

    // 5. Silkscreen
    const bottomSilk = this.buildSilkscreen(document, Layer.BSilk, Z_BOTTOM_SILK);
    bottomSilk.name = 'layer-bottom-silk';
    group.add(bottomSilk);

    const topSilk = this.buildSilkscreen(document, Layer.FSilk, Z_TOP_SILK);
    topSilk.name = 'layer-top-silk';
    group.add(topSilk);

    return group;
  }

  // ---------------------------------------------------------------------------
  // Board substrate mesh
  // ---------------------------------------------------------------------------

  buildBoardMesh(outline: BoardOutline, thickness: number): THREE.Mesh {
    const points = outline.points ?? outline.polygon ?? [];
    return this.buildBoardMeshFromPoints(points, thickness);
  }

  private buildBoardMeshFromPoints(points: Vector2D[], thickness: number): THREE.Mesh {
    if (!points || points.length < 3) {
      return new THREE.Mesh(new THREE.BufferGeometry(), this.boardMaterial());
    }

    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: thickness,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // ExtrudeGeometry extrudes along Z. Rotate so board is flat on XZ plane
    // with thickness going along Y. Actually for PCB we keep the board on XY
    // with height along Z so the extrude direction (Z) is correct.
    const mesh = new THREE.Mesh(geometry, this.boardMaterial());
    mesh.name = 'board-substrate';
    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Copper layers (tracks, pads, zones)
  // ---------------------------------------------------------------------------

  buildCopperLayer(document: PCBDocument, layer: Layer, zPosition: number): THREE.Group {
    const group = new THREE.Group();
    const mat = this.copperMaterial();

    // Tracks
    if (document.tracks) {
      for (const track of document.tracks) {
        if (track.layer === layer) {
          const mesh = this.createTrackMesh(track, zPosition);
          mesh.material = mat;
          group.add(mesh);
        }
      }
    }

    // Footprints → pads on this layer
    if (document.footprints) {
      for (const fp of document.footprints) {
        if (fp.pads) {
          for (const pad of fp.pads) {
            if (pad.layer === layer || pad.layers?.includes(layer)) {
              const mesh = this.createPadMesh(
                pad,
                fp.position ?? { x: 0, y: 0 },
                fp.rotation ?? 0,
                zPosition,
              );
              mesh.material = mat;
              group.add(mesh);
            }
          }
        }
      }
    }

    // Vias span multiple layers — always render them
    if (document.vias) {
      for (const via of document.vias) {
        const mesh = this.createViaMesh(via);
        group.add(mesh);
      }
    }

    // Copper zones
    const zones = document.copperZones ?? document.zones ?? [];
    for (const zone of zones) {
      if (zone.layer === layer) {
        const zonePolygon = zone.filledPolygon ?? zone.polygon ?? zone.outline ?? [];
        if (zonePolygon.length >= 3) {
          const mesh = this.createExtrudedPolygon(zonePolygon, COPPER_THICKNESS, zPosition);
          mesh.material = mat;
          group.add(mesh);
        }
      }
    }

    return group;
  }

  // ---------------------------------------------------------------------------
  // Solder mask
  // ---------------------------------------------------------------------------

  buildSolderMask(document: PCBDocument, layer: Layer, zPosition: number): THREE.Mesh {
    return this.buildSolderMaskWithOutline(document, layer, zPosition, this.resolveOutlinePoints(document));
  }

  private buildSolderMaskWithOutline(
    document: PCBDocument,
    layer: Layer,
    zPosition: number,
    outlinePoints: Vector2D[],
  ): THREE.Mesh {
    if (!outlinePoints || outlinePoints.length < 3) {
      return new THREE.Mesh(new THREE.BufferGeometry(), this.solderMaskMaterial());
    }

    const shape = new THREE.Shape();
    const pts = outlinePoints;
    shape.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x, pts[i].y);
    }
    shape.closePath();

    // Cut holes for exposed pads (pads that should not be covered by mask)
    if (document.footprints) {
      for (const fp of document.footprints) {
        if (!fp.pads) continue;
        for (const pad of fp.pads) {
          const onThisLayer =
            pad.layer === layer ||
            pad.layers?.includes(layer) ||
            pad.type === PadType.ThroughHole;
          if (!onThisLayer) continue;

          const pos = this.transformPadPosition(
            pad,
            fp.position ?? { x: 0, y: 0 },
            fp.rotation ?? 0,
          );

          const holePath = new THREE.Path();
          const padW = (pad.width ?? pad.size?.x ?? 1) / 2 + 0.05; // slight expansion for clearance
          const padH = (pad.height ?? pad.size?.y ?? pad.width ?? 1) / 2 + 0.05;

          if (pad.shape === PadShape.Circle) {
            holePath.absarc(pos.x, pos.y, padW, 0, Math.PI * 2, false);
          } else {
            // Rectangular / oblong hole
            holePath.moveTo(pos.x - padW, pos.y - padH);
            holePath.lineTo(pos.x + padW, pos.y - padH);
            holePath.lineTo(pos.x + padW, pos.y + padH);
            holePath.lineTo(pos.x - padW, pos.y + padH);
            holePath.closePath();
          }
          shape.holes.push(holePath);
        }
      }
    }

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: MASK_THICKNESS,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.translate(0, 0, zPosition);

    const mesh = new THREE.Mesh(geometry, this.solderMaskMaterial());
    mesh.name = 'solder-mask';
    return mesh;
  }

  private resolveOutlinePoints(document: PCBDocument): Vector2D[] {
    const explicit = document.boardOutline?.points ?? document.boardOutline?.polygon ?? [];
    if (explicit.length >= 3) {
      return explicit;
    }

    const points: Vector2D[] = [];

    for (const track of document.tracks ?? []) {
      points.push(track.start, track.end);
    }

    for (const via of document.vias ?? []) {
      const radius = (via.diameter ?? via.size ?? 0.8) / 2;
      points.push(
        new Vector2D(via.position.x - radius, via.position.y - radius),
        new Vector2D(via.position.x + radius, via.position.y + radius),
      );
    }

    for (const fp of document.footprints ?? []) {
      points.push(fp.position);
      for (const pad of fp.pads ?? []) {
        const pos = this.transformPadPosition(pad, fp.position, fp.rotation ?? 0);
        const halfW = (pad.width ?? pad.size?.x ?? 1) / 2;
        const halfH = (pad.height ?? pad.size?.y ?? 1) / 2;
        points.push(
          new Vector2D(pos.x - halfW, pos.y - halfH),
          new Vector2D(pos.x + halfW, pos.y + halfH),
        );
      }
    }

    const zones = document.copperZones ?? document.zones ?? [];
    for (const zone of zones) {
      for (const p of zone.filledPolygon ?? zone.polygon ?? zone.outline ?? []) {
        points.push(p);
      }
    }

    if (points.length < 2) return [];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return [];
    }

    const margin = 1.0;
    return [
      new Vector2D(minX - margin, minY - margin),
      new Vector2D(maxX + margin, minY - margin),
      new Vector2D(maxX + margin, maxY + margin),
      new Vector2D(minX - margin, maxY + margin),
    ];
  }

  // ---------------------------------------------------------------------------
  // Silkscreen
  // ---------------------------------------------------------------------------

  buildSilkscreen(document: PCBDocument, layer: Layer, zPosition: number): THREE.Group {
    const group = new THREE.Group();
    const mat = this.silkscreenMaterial();

    // Render reference designators as flat planes (real text rendering would
    // require font geometry which is out of scope; we represent them as small
    // rectangles with silkscreen material).
    if (document.footprints) {
      for (const fp of document.footprints) {
        const fpLayer =
          layer === Layer.FSilk ? Layer.FCu :
          layer === Layer.BSilk ? Layer.BCu :
          layer;

        // Only add silkscreen for footprints on matching side
        const fpOnLayer = fp.layer === fpLayer;
        if (!fpOnLayer) continue;

        const pos = fp.position ?? { x: 0, y: 0 };
        const ref = fp.reference ?? 'U?';

        // Approximate reference text as a small rectangle
        const textWidth = ref.length * 0.8;
        const textHeight = 1.0;
        const geo = new THREE.PlaneGeometry(textWidth, textHeight);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(pos.x, pos.y, zPosition + SILK_THICKNESS * 0.5);
        if (layer === Layer.BSilk) {
          mesh.rotation.x = Math.PI; // flip for bottom
        }
        mesh.name = `silk-ref-${ref}`;
        group.add(mesh);

        // Silkscreen outline — draw a simple outline around the footprint courtyard
        if (fp.courtyard && fp.courtyard.length >= 3) {
          const courtyard = fp.courtyard;
          const linePoints: THREE.Vector3[] = [];
          for (const p of courtyard) {
            linePoints.push(new THREE.Vector3(pos.x + p.x, pos.y + p.y, zPosition));
          }
          linePoints.push(linePoints[0].clone()); // close loop

          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
          const line = new THREE.Line(lineGeo, lineMat);
          line.name = `silk-outline-${ref}`;
          group.add(line);
        }
      }
    }

    return group;
  }

  // ---------------------------------------------------------------------------
  // Helper: Track mesh
  // ---------------------------------------------------------------------------

  createTrackMesh(track: Track, z: number): THREE.Mesh {
    const start = track.start;
    const end = track.end;
    const width = track.width ?? 0.25;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (length < 0.001) {
      // Degenerate track — just a dot
      const geo = new THREE.CylinderGeometry(width / 2, width / 2, COPPER_THICKNESS, 8);
      geo.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geo, this.copperMaterial());
      mesh.position.set(start.x, start.y, z);
      mesh.name = 'track-dot';
      return mesh;
    }

    // Build a rounded-end track segment using a single shape
    const shape = new THREE.Shape();
    const hw = width / 2;
    const segments = 8;

    // Left semicircle (at start)
    for (let i = 0; i <= segments; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / segments;
      shape.lineTo(Math.cos(a) * hw, Math.sin(a) * hw);
    }

    // Right semicircle (at end)
    for (let i = 0; i <= segments; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / segments;
      shape.lineTo(length + Math.cos(a) * hw, Math.sin(a) * hw);
    }
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: COPPER_THICKNESS,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, this.copperMaterial());

    mesh.position.set(start.x, start.y, z);
    mesh.rotation.z = angle;
    mesh.name = 'track';

    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Helper: Pad mesh
  // ---------------------------------------------------------------------------

  createPadMesh(
    pad: Pad,
    footprintPos: Vector2D,
    footprintRot: number,
    z: number,
  ): THREE.Mesh {
    const padW = pad.width ?? pad.size?.x ?? 1;
    const padH = pad.height ?? pad.size?.y ?? padW;
    let geometry: THREE.BufferGeometry;

    switch (pad.shape) {
      case PadShape.Circle: {
        geometry = new THREE.CylinderGeometry(padW / 2, padW / 2, COPPER_THICKNESS, 24);
        geometry.rotateX(Math.PI / 2);
        break;
      }
      case PadShape.Oval: {
        const ovalShape = new THREE.Shape();
        const rx = padW / 2;
        const ry = padH / 2;
        ovalShape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
        geometry = new THREE.ExtrudeGeometry(ovalShape, {
          depth: COPPER_THICKNESS,
          bevelEnabled: false,
        });
        break;
      }
      case PadShape.RoundRect: {
        geometry = this.createRoundedRectGeometry(padW, padH, Math.min(padW, padH) * 0.25);
        break;
      }
      case PadShape.Rect:
      default: {
        geometry = new THREE.BoxGeometry(padW, padH, COPPER_THICKNESS);
        break;
      }
    }

    const mesh = new THREE.Mesh(geometry, this.copperMaterial());

    // Transform pad: local offset + footprint position + rotation
    const padLocal = pad.position ?? { x: 0, y: 0 };
    const rotRad = (footprintRot * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);

    const worldX = footprintPos.x + padLocal.x * cosR - padLocal.y * sinR;
    const worldY = footprintPos.y + padLocal.x * sinR + padLocal.y * cosR;

    mesh.position.set(worldX, worldY, z + COPPER_THICKNESS / 2);
    mesh.rotation.z = rotRad + ((pad.rotation ?? 0) * Math.PI) / 180;
    mesh.name = `pad-${pad.number ?? '?'}`;

    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Helper: Via mesh
  // ---------------------------------------------------------------------------

  createViaMesh(via: Via): THREE.Mesh {
    const outerRadius = (via.diameter ?? via.size ?? 0.8) / 2;
    const innerRadius = (via.drillDiameter ?? via.drill ?? 0.4) / 2;

    // Create a tube from bottom copper to top copper
    const height = BOARD_THICKNESS;

    // Use a ring shape extruded as a cylinder approximation
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });

    const mesh = new THREE.Mesh(geometry, this.copperMaterial());
    mesh.position.set(via.position.x, via.position.y, 0);
    mesh.name = 'via';

    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Helper: Rounded rect geometry
  // ---------------------------------------------------------------------------

  createRoundedRectGeometry(
    width: number,
    height: number,
    radius: number,
  ): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(radius, hw, hh);

    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: COPPER_THICKNESS,
      bevelEnabled: false,
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: Extruded polygon
  // ---------------------------------------------------------------------------

  createExtrudedPolygon(
    points: Vector2D[],
    height: number,
    z: number,
  ): THREE.Mesh {
    if (points.length < 3) {
      return new THREE.Mesh(new THREE.BufferGeometry(), this.boardMaterial());
    }

    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, z);

    const mesh = new THREE.Mesh(geometry, this.boardMaterial());
    mesh.name = 'polygon';
    return mesh;
  }

  // ---------------------------------------------------------------------------
  // Helper: Transform pad position with footprint transform
  // ---------------------------------------------------------------------------

  private transformPadPosition(
    pad: Pad,
    fpPos: Vector2D,
    fpRotDeg: number,
  ): Vector2D {
    const padLocal = pad.position ?? { x: 0, y: 0 };
    const rotRad = (fpRotDeg * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    return new Vector2D(
      fpPos.x + padLocal.x * cosR - padLocal.y * sinR,
      fpPos.y + padLocal.x * sinR + padLocal.y * cosR,
    );
  }

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------

  copperMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xb87333, // copper orange
      metalness: 0.9,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
  }

  boardMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2d5a27, // FR4 dark green
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }

  solderMaskMaterial(color: string = '#1a472a'): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
      metalness: 0.0,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
  }

  silkscreenMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }
}
