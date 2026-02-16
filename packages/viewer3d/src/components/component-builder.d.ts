import * as THREE from 'three';
import { Footprint, Vector2D } from '@opencad/core';
export declare class ComponentBuilder {
    buildGenericComponent(footprint: Footprint, position: Vector2D, rotation: number, side: 'top' | 'bottom'): THREE.Group;
    buildSMDChip(width: number, length: number, height: number): THREE.Mesh;
    buildSOIC(pinCount: number, bodyWidth: number, bodyLength: number): THREE.Group;
    buildQFP(pinCount: number, bodySize: number, pitch: number): THREE.Group;
    buildDIP(pinCount: number, rowSpacing: number, pitch: number): THREE.Group;
    buildThroughHoleResistor(bodyLength: number, bodyDiameter: number, leadSpacing: number): THREE.Group;
    buildElectrolyticCap(diameter: number, height: number): THREE.Group;
    buildConnectorPinHeader(rows: number, cols: number, pitch: number): THREE.Group;
    buildTO220(): THREE.Group;
    autoGenerateComponent(footprint: Footprint): THREE.Group;
    private componentBodyMaterial;
    private pinMaterial;
}
//# sourceMappingURL=component-builder.d.ts.map