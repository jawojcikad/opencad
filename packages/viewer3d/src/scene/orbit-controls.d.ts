import * as THREE from 'three';
export declare class OrbitControls {
    target: THREE.Vector3;
    minDistance: number;
    maxDistance: number;
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    panSpeed: number;
    zoomSpeed: number;
    private camera;
    private domElement;
    private spherical;
    private sphericalDelta;
    private panOffset;
    private isRotating;
    private isPanning;
    private lastMouse;
    private boundOnMouseDown;
    private boundOnMouseMove;
    private boundOnMouseUp;
    private boundOnWheel;
    private boundOnContextMenu;
    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement);
    update(): void;
    dispose(): void;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onWheel;
    private rotateCamera;
    private panCamera;
    private zoomCamera;
}
//# sourceMappingURL=orbit-controls.d.ts.map