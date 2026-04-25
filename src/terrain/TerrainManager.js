// src/terrain/TerrainManager.js
import * as THREE from 'three';
import { generateHeightmap, applyHeightmap } from './noise.js';
//import { GPGPUErosion } from './erosion/GPGPUErosion.js';
import { HydraulicErosionCPU } from './erosion/HydraulicErosionCPU.js';

export class TerrainManager {
    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Размеры ландшафта (мировые единицы)
        this.width = options.width || 100;
        this.depth = options.depth || 100;
        this.segments = options.segments || 256;    // детализация (количество сегментов на сторону)
        
        this.erosionOptions = options.erosionOptions || {
            iterations: 25,
            rainAmount: 0.003,
            evaporation: 0.2,
            erosionRate: 0.003,
            depositionRate: 0.001,
            waterCapacity: 0.4
        };
        
        this.erosionOptions = options.erosionOptions || {
            iterations: 50,
            rainAmount: 0.1,
            evaporation: 0.05,
            erosionRate: 0.01,
            depositionRate: 0.01,
            waterCapacity: 0.5
        };
        
        this.mesh = null;
    }
    
    async init() {
        // 1. Базовая геометрия
        const geometry = new THREE.PlaneGeometry(this.width, this.depth, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2);
        
        const verticesX = this.segments + 1;
        const verticesZ = this.segments + 1;
        
        // 2. Генерация начального рельефа шумом
        const heights = generateHeightmap(verticesX, verticesZ, this.heightOptions);
        applyHeightmap(geometry, heights);
        
        // 3. Извлечение массива высот для GPGPU
        const positions = geometry.attributes.position.array;
        const heightData = new Float32Array(verticesX * verticesZ);
        for (let i = 0; i < verticesX; i++) {
            for (let j = 0; j < verticesZ; j++) {
                const idx = i + j * verticesX;
                heightData[idx] = positions[idx * 3 + 1];
            }
        }
        
        // 4. Гидравлическая эрозия на CPU
        const erosionCPU = new HydraulicErosionCPU(heightData, verticesX, verticesZ, this.erosionOptions);
        erosionCPU.run();
        const erodedHeights = erosionCPU.getResult();

        // 5. Применение эродированных высот
        if (erodedHeights) {
            this.updateGeometryFromHeightData(geometry, erodedHeights);
        } else {
            console.warn('Эрозия не дала результата, используются исходные высоты');
        }
        
        // 6. Создание материала и меша
        const material = new THREE.MeshStandardMaterial({
            color: 0x7c9c7c,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
            flatShading: false
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        console.log('TerrainManager: ландшафт создан (шум + гидравлическая эрозия)');
    }
    
    // Обновление вершин геометрии по массиву высот
    updateGeometryFromHeightData(geometry, heightData) {
        const positions = geometry.attributes.position.array;
        const width = this.segments + 1;
        const depth = this.segments + 1;
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < depth; j++) {
                const idx = i + j * width;
                positions[idx * 3 + 1] = heightData[idx];
            }
        }
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
    }
    
    // Метод обновления (вызывается в цикле анимации, но эрозия однократна)
    update(delta) {
        // Можно добавить динамические эффекты (например, покачивание травы) – пока пусто
    }
}