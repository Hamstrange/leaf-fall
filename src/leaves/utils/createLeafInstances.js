// src/utils/createLeafInstances.js
import * as THREE from 'three';

export function createLeafInstances(scene, geometry, material, numLeaves) {
    const mesh = new THREE.InstancedMesh(geometry, material, numLeaves);
    scene.add(mesh);
    return mesh;
}