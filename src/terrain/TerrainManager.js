// src/terrain/TerrainManager.js
import * as THREE from 'three';
import { generateHeightmap, applyHeightmap } from './noise.js';

export class TerrainManager {
    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Параметры с настройками по умолчанию
        this.width = options.width || 200;
        this.depth = options.depth || 200;
        this.segments = options.segments || 128; // Чем больше, тем детальнее
        
        this.mesh = null;

        this.heightOptions = options.heightOptions || {
            scale: 0.02,
            amplitude: 15,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0
        };
    }
    
    async init() {
        // Создаём геометрию плоскости с большим количеством сегментов
        const geometry = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2); // Поворачиваем, чтобы лежала горизонтально

        // ---- Генерация рельефа ----
        const width = this.segments + 1;
        const depth = this.segments + 1;
        const heights = generateHeightmap(width, depth, this.heightOptions);
        applyHeightmap(geometry, heights);
        
        // Пока просто серый материал, позже заменим на текстурированный
        const material = new THREE.MeshStandardMaterial({
            color: 0x7c9c7c,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        console.log('TerrainManager: холмистый ландшафт создан');
    }
    
    update(delta) {
        // Пока ничего не делаем, позже добавим анимацию эрозии
    }
}