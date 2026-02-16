import * as THREE from 'three';

export interface Pick3DResult {
  objectId: string;
  type: 'component' | 'track' | 'via' | 'pad' | 'board';
  point: THREE.Vector3;
  distance: number;
}

interface ObjectInfo {
  id: string;
  type: Pick3DResult['type'];
}

export class PCBRaycaster {
  private raycaster: THREE.Raycaster;
  private objectMap: Map<THREE.Object3D, ObjectInfo>;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line = { threshold: 0.5 };
    this.raycaster.params.Points = { threshold: 0.5 };
    this.objectMap = new Map();
  }

  /**
   * Register a 3D object for pick detection.
   */
  registerObject(mesh: THREE.Object3D, id: string, type: Pick3DResult['type']): void {
    this.objectMap.set(mesh, { id, type });

    // Also register all children so clicking any sub-mesh resolves to the parent info
    mesh.traverse((child) => {
      if (child !== mesh) {
        this.objectMap.set(child, { id, type });
      }
    });
  }

  /**
   * Remove a 3D object (and its children) from pick detection.
   */
  unregisterObject(mesh: THREE.Object3D): void {
    this.objectMap.delete(mesh);
    mesh.traverse((child) => {
      this.objectMap.delete(child);
    });
  }

  /**
   * Pick the closest intersected registered object.
   * @param mousePos Normalised device coordinates { x: [-1,1], y: [-1,1] }.
   */
  pick(
    mousePos: { x: number; y: number },
    camera: THREE.PerspectiveCamera,
    objects: THREE.Object3D[],
  ): Pick3DResult | null {
    this.raycaster.setFromCamera(new THREE.Vector2(mousePos.x, mousePos.y), camera);

    const intersects = this.raycaster.intersectObjects(objects, true);

    for (const hit of intersects) {
      const info = this.resolveInfo(hit.object);
      if (info) {
        return {
          objectId: info.id,
          type: info.type,
          point: hit.point.clone(),
          distance: hit.distance,
        };
      }
    }

    return null;
  }

  /**
   * Pick all registered objects intersected by the ray, sorted by distance.
   */
  pickAll(
    mousePos: { x: number; y: number },
    camera: THREE.PerspectiveCamera,
    objects: THREE.Object3D[],
  ): Pick3DResult[] {
    this.raycaster.setFromCamera(new THREE.Vector2(mousePos.x, mousePos.y), camera);

    const intersects = this.raycaster.intersectObjects(objects, true);
    const results: Pick3DResult[] = [];
    const seenIds = new Set<string>();

    for (const hit of intersects) {
      const info = this.resolveInfo(hit.object);
      if (info && !seenIds.has(info.id)) {
        seenIds.add(info.id);
        results.push({
          objectId: info.id,
          type: info.type,
          point: hit.point.clone(),
          distance: hit.distance,
        });
      }
    }

    return results;
  }

  /**
   * Walk up the object hierarchy to find registered info.
   */
  private resolveInfo(object: THREE.Object3D): ObjectInfo | undefined {
    let current: THREE.Object3D | null = object;
    while (current) {
      const info = this.objectMap.get(current);
      if (info) return info;
      current = current.parent;
    }
    return undefined;
  }
}
