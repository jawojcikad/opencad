import * as THREE from 'three';

/**
 * Sets up the lighting for the 3D PCB scene.
 * Adds ambient, directional key/fill lights, and a hemisphere light.
 */
export function setupLighting(scene: THREE.Scene): void {
  // Ambient light — strong base for even visibility across board surface
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  ambient.name = 'ambientLight';
  scene.add(ambient);

  // Hemisphere light — broad sky/ground contribution to avoid dark faces
  const hemiLight = new THREE.HemisphereLight(
    0xffffff,
    0xb8c0c8,
    0.75,
  );
  hemiLight.name = 'hemisphereLight';
  scene.add(hemiLight);

  // Key light — gentle front light
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.45);
  keyLight.name = 'keyLight';
  keyLight.position.set(120, -80, 160);
  keyLight.castShadow = false;
  scene.add(keyLight);

  // Fill light from opposite side
  const fillA = new THREE.DirectionalLight(0xffffff, 0.35);
  fillA.name = 'fillLightA';
  fillA.position.set(-140, 100, 130);
  fillA.castShadow = false;
  scene.add(fillA);

  // Additional cross-fill for uniformity across large boards
  const fillB = new THREE.DirectionalLight(0xffffff, 0.3);
  fillB.name = 'fillLightB';
  fillB.position.set(0, 180, 120);
  fillB.castShadow = false;
  scene.add(fillB);
}
