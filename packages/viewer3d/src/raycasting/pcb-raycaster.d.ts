import * as THREE from 'three';
export interface Pick3DResult {
    objectId: string;
    type: 'component' | 'track' | 'via' | 'pad' | 'board';
    point: THREE.Vector3;
    distance: number;
}
export declare class PCBRaycaster {
    private raycaster;
    private objectMap;
    constructor();
    /**
     * Register a 3D object for pick detection.
     */
    registerObject(mesh: THREE.Object3D, id: string, type: Pick3DResult['type']): void;
    /**
     * Remove a 3D object (and its children) from pick detection.
     */
    unregisterObject(mesh: THREE.Object3D): void;
    /**
     * Pick the closest intersected registered object.
     * @param mousePos Normalised device coordinates { x: [-1,1], y: [-1,1] }.
     */
    pick(mousePos: {
        x: number;
        y: number;
    }, camera: THREE.PerspectiveCamera, objects: THREE.Object3D[]): Pick3DResult | null;
    /**
     * Pick all registered objects intersected by the ray, sorted by distance.
     */
    pickAll(mousePos: {
        x: number;
        y: number;
    }, camera: THREE.PerspectiveCamera, objects: THREE.Object3D[]): Pick3DResult[];
    /**
     * Walk up the object hierarchy to find registered info.
     */
    private resolveInfo;
}
//# sourceMappingURL=pcb-raycaster.d.ts.map