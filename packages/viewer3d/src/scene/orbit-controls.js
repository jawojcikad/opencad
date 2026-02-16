import * as THREE from 'three';
export class OrbitControls {
    target;
    minDistance;
    maxDistance;
    enableDamping;
    dampingFactor;
    rotateSpeed;
    panSpeed;
    zoomSpeed;
    camera;
    domElement;
    spherical;
    sphericalDelta;
    panOffset;
    isRotating;
    isPanning;
    lastMouse;
    boundOnMouseDown;
    boundOnMouseMove;
    boundOnMouseUp;
    boundOnWheel;
    boundOnContextMenu;
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = new THREE.Vector3(0, 0, 0);
        this.minDistance = 1;
        this.maxDistance = 2000;
        this.enableDamping = true;
        this.dampingFactor = 0.08;
        this.rotateSpeed = 1.0;
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.0;
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        this.panOffset = new THREE.Vector3();
        this.isRotating = false;
        this.isPanning = false;
        this.lastMouse = { x: 0, y: 0 };
        // Compute initial spherical from camera position
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        this.spherical.setFromVector3(offset);
        this.boundOnMouseDown = (e) => this.onMouseDown(e);
        this.boundOnMouseMove = (e) => this.onMouseMove(e);
        this.boundOnMouseUp = (e) => this.onMouseUp(e);
        this.boundOnWheel = (e) => this.onWheel(e);
        this.boundOnContextMenu = (e) => e.preventDefault();
        this.domElement.addEventListener('mousedown', this.boundOnMouseDown);
        this.domElement.addEventListener('mousemove', this.boundOnMouseMove);
        this.domElement.addEventListener('mouseup', this.boundOnMouseUp);
        this.domElement.addEventListener('wheel', this.boundOnWheel, { passive: false });
        this.domElement.addEventListener('contextmenu', this.boundOnContextMenu);
    }
    update() {
        const offset = new THREE.Vector3();
        // Apply spherical delta with optional damping
        if (this.enableDamping) {
            this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
            this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
        }
        else {
            this.spherical.theta += this.sphericalDelta.theta;
            this.spherical.phi += this.sphericalDelta.phi;
        }
        // Clamp phi to prevent flipping
        this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
        // Clamp radius
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        // Apply pan offset to target
        if (this.enableDamping) {
            this.target.addScaledVector(this.panOffset, this.dampingFactor);
        }
        else {
            this.target.add(this.panOffset);
        }
        // Convert spherical back to position
        offset.setFromSpherical(this.spherical);
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        // Decay deltas
        if (this.enableDamping) {
            this.sphericalDelta.theta *= 1 - this.dampingFactor;
            this.sphericalDelta.phi *= 1 - this.dampingFactor;
            this.panOffset.multiplyScalar(1 - this.dampingFactor);
        }
        else {
            this.sphericalDelta.set(0, 0, 0);
            this.panOffset.set(0, 0, 0);
        }
    }
    dispose() {
        this.domElement.removeEventListener('mousedown', this.boundOnMouseDown);
        this.domElement.removeEventListener('mousemove', this.boundOnMouseMove);
        this.domElement.removeEventListener('mouseup', this.boundOnMouseUp);
        this.domElement.removeEventListener('wheel', this.boundOnWheel);
        this.domElement.removeEventListener('contextmenu', this.boundOnContextMenu);
    }
    onMouseDown(e) {
        e.preventDefault();
        if (e.button === 0) {
            // Left button — rotate
            this.isRotating = true;
        }
        else if (e.button === 1 || e.button === 2) {
            // Middle or right button — pan
            this.isPanning = true;
        }
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
    }
    onMouseMove(e) {
        if (!this.isRotating && !this.isPanning)
            return;
        const deltaX = e.clientX - this.lastMouse.x;
        const deltaY = e.clientY - this.lastMouse.y;
        if (this.isRotating) {
            this.rotateCamera(deltaX, deltaY);
        }
        if (this.isPanning) {
            this.panCamera(deltaX, deltaY);
        }
        this.lastMouse.x = e.clientX;
        this.lastMouse.y = e.clientY;
    }
    onMouseUp(_e) {
        this.isRotating = false;
        this.isPanning = false;
    }
    onWheel(e) {
        e.preventDefault();
        this.zoomCamera(e.deltaY);
    }
    rotateCamera(deltaX, deltaY) {
        const element = this.domElement;
        // Full rotation per element width = 2π
        this.sphericalDelta.theta -= ((2 * Math.PI * deltaX) / element.clientWidth) * this.rotateSpeed;
        this.sphericalDelta.phi -= ((2 * Math.PI * deltaY) / element.clientHeight) * this.rotateSpeed;
    }
    panCamera(deltaX, deltaY) {
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        let targetDistance = offset.length();
        targetDistance *= Math.tan(((this.camera.fov / 2) * Math.PI) / 180);
        const element = this.domElement;
        // Pan left/right
        const panLeft = new THREE.Vector3();
        panLeft.setFromMatrixColumn(this.camera.matrix, 0); // camera X axis
        panLeft.multiplyScalar((-2 * deltaX * targetDistance) / element.clientHeight * this.panSpeed);
        this.panOffset.add(panLeft);
        // Pan up/down
        const panUp = new THREE.Vector3();
        panUp.setFromMatrixColumn(this.camera.matrix, 1); // camera Y axis
        panUp.multiplyScalar((2 * deltaY * targetDistance) / element.clientHeight * this.panSpeed);
        this.panOffset.add(panUp);
    }
    zoomCamera(delta) {
        const factor = 1 + delta * 0.001 * this.zoomSpeed;
        this.spherical.radius *= Math.max(0.1, factor);
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    }
}
//# sourceMappingURL=orbit-controls.js.map