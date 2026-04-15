// src/terrain/TerrainManager.js
import * as THREE from 'three';
import { generateHeightmap, applyHeightmap } from './noise.js';
import { GPGPUErosion } from './erosion/GPGPUErosion.js';

export class TerrainManager {
    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.renderer = renderer;
        
        // Размеры ландшафта (мировые единицы)
        this.width = options.width || 500;
        this.depth = options.depth || 500;
        this.segments = options.segments || 256;    // детализация (количество сегментов на сторону)
        
        // Параметры шума (начальный рельеф)
        this.heightOptions = options.heightOptions || {
            scale: 0.02,
            amplitude: 3,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 1.0
        };
        
        // Параметры эрозии (передаются в GPGPUErosion)
        this.erosionOptions = options.erosionOptions || {
            iterations: 30,
            rainAmount: 0.01,
            evaporation: 0.05,
            erosionRate: 0.01,
            depositionRate: 0.001,
            waterCapacity: 1.0
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
        
        // 4. Симуляция гидравлической эрозии на GPU
        const erosion = new GPGPUErosion(
            this.renderer, verticesX, verticesZ, heightData, this.erosionOptions
        );
        erosion.run();
        const erodedHeights = erosion.getResultHeightData();
        erosion.dispose();
        
        // 5. Применение эродированных высот к геометрии (если успешно)
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