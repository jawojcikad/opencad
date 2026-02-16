import * as THREE from 'three';
import { PCBDocument, Pad, Track, Via, BoardOutline, Layer, Vector2D } from '@opencad/core';
export declare class BoardBuilder {
    buildFullPCB(document: PCBDocument): THREE.Group;
    buildBoardMesh(outline: BoardOutline, thickness: number): THREE.Mesh;
    buildCopperLayer(document: PCBDocument, layer: Layer, zPosition: number): THREE.Group;
    buildSolderMask(document: PCBDocument, layer: Layer, zPosition: number): THREE.Mesh;
    buildSilkscreen(document: PCBDocument, layer: Layer, zPosition: number): THREE.Group;
    createTrackMesh(track: Track, z: number): THREE.Mesh;
    createPadMesh(pad: Pad, footprintPos: Vector2D, footprintRot: number, z: number): THREE.Mesh;
    createViaMesh(via: Via): THREE.Mesh;
    createRoundedRectGeometry(width: number, height: number, radius: number): THREE.BufferGeometry;
    createExtrudedPolygon(points: Vector2D[], height: number, z: number): THREE.Mesh;
    private transformPadPosition;
    copperMaterial(): THREE.MeshStandardMaterial;
    boardMaterial(): THREE.MeshStandardMaterial;
    solderMaskMaterial(color?: string): THREE.MeshStandardMaterial;
    silkscreenMaterial(): THREE.MeshStandardMaterial;
}
//# sourceMappingURL=board-builder.d.ts.map