import * as THREE from 'three';
/**
 * Sets up the lighting for the 3D PCB scene.
 * Adds ambient, directional key/fill lights, and a hemisphere light.
 */
export function setupLighting(scene) {
    // Ambient light — soft overall illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    ambient.name = 'ambientLight';
    scene.add(ambient);
    // Key light — main directional (from upper-right-front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.name = 'keyLight';
    keyLight.position.set(100, 200, 150);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 500;
    keyLight.shadow.camera.left = -100;
    keyLight.shadow.camera.right = 100;
    keyLight.shadow.camera.top = 100;
    keyLight.shadow.camera.bottom = -100;
    scene.add(keyLight);
    // Fill light — softer directional from opposite side (lower-left-back)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.name = 'fillLight';
    fillLight.position.set(-80, 100, -100);
    scene.add(fillLight);
    // Hemisphere light — sky/ground colour gradient for realistic ambient
    const hemiLight = new THREE.HemisphereLight(0xddeeff, // sky colour (pale blue-white)
    0x0f0e0d, // ground colour (dark brown)
    0.25);
    hemiLight.name = 'hemisphereLight';
    scene.add(hemiLight);
}
//# sourceMappingURL=lighting.js.map