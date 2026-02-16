import * as THREE from 'three';
import { PCBDocument, Layer } from '@opencad/core';
import { OrbitControls } from './orbit-controls';
import { setupLighting } from './lighting';
import { BoardBuilder } from '../board/board-builder';
import { ComponentBuilder } from '../components/component-builder';
import { PCBRaycaster, Pick3DResult } from '../raycasting/pcb-raycaster';

export class PCB3DViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private boardGroup: THREE.Group;
  private componentGroup: THREE.Group;
  private animationId: number | null;
  private container: HTMLElement;
  private raycaster: PCBRaycaster;
  private boardBuilder: BoardBuilder;
  private componentBuilder: ComponentBuilder;
  private transparencyEnabled: boolean;
  private layerVisibility: Map<string, boolean>;
  private boundOnResize: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.animationId = null;
    this.transparencyEnabled = false;
    this.layerVisibility = new Map();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e2e);

    // Camera
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000);
    this.camera.position.set(50, -80, 100);
    this.camera.up.set(0, 0, 1);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 1000;

    // Lighting
    setupLighting(this.scene);

    // Groups
    this.boardGroup = new THREE.Group();
    this.boardGroup.name = 'board-group';
    this.scene.add(this.boardGroup);

    this.componentGroup = new THREE.Group();
    this.componentGroup.name = 'component-group';
    this.scene.add(this.componentGroup);

    // Helpers
    this.raycaster = new PCBRaycaster();
    this.boardBuilder = new BoardBuilder();
    this.componentBuilder = new ComponentBuilder();

    // Resize listener
    this.boundOnResize = () => this.onResize();
    window.addEventListener('resize', this.boundOnResize);

    // Start animation loop
    this.animate();
  }

  // ---------------------------------------------------------------------------
  // Load PCB
  // ---------------------------------------------------------------------------

  loadPCB(document: PCBDocument): void {
    // Clear previous
    this.clearGroup(this.boardGroup);
    this.clearGroup(this.componentGroup);

    // Build board (substrate, copper, masks, silk)
    const pcbAssembly = this.boardBuilder.buildFullPCB(document);
    this.boardGroup.add(pcbAssembly);

    // Register board for raycasting
    this.raycaster.registerObject(pcbAssembly, 'board', 'board');

    // Build 3D components
    if (document.footprints) {
      for (const fp of document.footprints) {
        const comp3d = this.componentBuilder.autoGenerateComponent(fp);
        this.componentGroup.add(comp3d);

        // Register for raycasting
        const compId = fp.reference ?? fp.id ?? 'unknown';
        this.raycaster.registerObject(comp3d, compId, 'component');
      }
    }

    // Register tracks for picking
    if (document.tracks) {
      this.boardGroup.traverse((child) => {
        if (child.name === 'track') {
          this.raycaster.registerObject(child, child.uuid, 'track');
        }
      });
    }

    // Register vias
    this.boardGroup.traverse((child) => {
      if (child.name === 'via') {
        this.raycaster.registerObject(child, child.uuid, 'via');
      }
    });

    // Fit camera
    this.fitToBoard();
  }

  // ---------------------------------------------------------------------------
  // Camera views
  // ---------------------------------------------------------------------------

  resetView(): void {
    this.camera.position.set(50, -80, 100);
    this.camera.up.set(0, 0, 1);
    this.controls.target.set(0, 0, 0);
  }

  topView(): void {
    const center = this.getBoardCenter();
    const dist = this.getViewDistance();
    this.camera.position.set(center.x, center.y, dist);
    this.camera.up.set(0, 1, 0);
    this.controls.target.copy(center);
  }

  bottomView(): void {
    const center = this.getBoardCenter();
    const dist = this.getViewDistance();
    this.camera.position.set(center.x, center.y, -dist);
    this.camera.up.set(0, -1, 0);
    this.controls.target.copy(center);
  }

  isometricView(): void {
    const center = this.getBoardCenter();
    const dist = this.getViewDistance();
    const d = dist * 0.7;
    this.camera.position.set(center.x + d, center.y - d, center.z + d);
    this.camera.up.set(0, 0, 1);
    this.controls.target.copy(center);
  }

  fitToBoard(): void {
    const box = new THREE.Box3().setFromObject(this.boardGroup);
    if (box.isEmpty()) {
      this.resetView();
      return;
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const distance = maxDim / (2 * Math.tan(fovRad / 2)) * 1.5;

    this.controls.target.copy(center);
    this.camera.position.set(
      center.x + distance * 0.5,
      center.y - distance * 0.7,
      center.z + distance * 0.6,
    );
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(center);
  }

  // ---------------------------------------------------------------------------
  // Visibility controls
  // ---------------------------------------------------------------------------

  setLayerVisible(layer: string, visible: boolean): void {
    this.layerVisibility.set(layer, visible);

    this.boardGroup.traverse((child) => {
      if (child.name.includes(layer)) {
        child.visible = visible;
      }
    });
  }

  setTransparency(enabled: boolean): void {
    this.transparencyEnabled = enabled;

    this.boardGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.transparent = enabled;
        child.material.opacity = enabled ? 0.6 : 1.0;
        child.material.needsUpdate = true;
      }
    });
  }

  showComponents(visible: boolean): void {
    this.componentGroup.visible = visible;
  }

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Perform a 3D pick at the given pixel coordinates (relative to container).
   */
  pick(clientX: number, clientY: number): Pick3DResult | null {
    const rect = this.container.getBoundingClientRect();
    const ndc = {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1,
    };
    return this.raycaster.pick(ndc, this.camera, [this.boardGroup, this.componentGroup]);
  }

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.controls.dispose();
    window.removeEventListener('resize', this.boundOnResize);

    // Dispose all geometries and materials
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          this.raycaster.unregisterObject(obj);
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      group.remove(child);
    }
  }

  private getBoardCenter(): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(this.boardGroup);
    if (box.isEmpty()) return new THREE.Vector3(0, 0, 0);
    return box.getCenter(new THREE.Vector3());
  }

  private getViewDistance(): number {
    const box = new THREE.Box3().setFromObject(this.boardGroup);
    if (box.isEmpty()) return 100;
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = (this.camera.fov * Math.PI) / 180;
    return (maxDim / (2 * Math.tan(fovRad / 2))) * 1.5;
  }
}
