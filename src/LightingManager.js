// src/LightingManager.js
import * as THREE from 'three';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
    }

    setupDefaultLights() {
        //AmbientLight
        const ambientLight = new THREE.AmbientLight(0x404060, 0.8);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        //DirectionalLight
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        dirLight.receiveShadow = true;

        this.scene.add(dirLight);
        this.lights.push(dirLight);
    }
}