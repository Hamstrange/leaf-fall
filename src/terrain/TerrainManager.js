// src/terrain/TerrainManager.js
import * as THREE from 'three';

export class TerrainManager {
    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Параметры с настройками по умолчанию
        this.width = options.width || 200;
        this.depth = options.depth || 200;
        this.segments = options.segments || 128; // Чем больше, тем детальнее
        
        this.mesh = null;
    }
    
    async init() {
        // Создаём геометрию плоскости с большим количеством сегментов
        const geometry = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2); // Поворачиваем, чтобы лежала горизонтально
        
        // Пока просто серый материал, позже заменим на текстурированный
        const material = new THREE.MeshStandardMaterial({
            color: 0x7c9c7c,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        console.log('TerrainManager initialized');
    }
    
    update(delta) {
        // Пока ничего не делаем, позже добавим анимацию эрозии
    }
}