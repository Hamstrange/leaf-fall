import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

// Шейдер гидравлической эрозии (читает высоту, воду, наносы)
const erosionShader = `
    uniform vec2 u_texelSize;
    uniform float u_rainAmount;
    uniform float u_evaporation;
    uniform float u_erosionRate;
    uniform float u_depositionRate;
    uniform float u_waterCapacity;

    void main() {
        vec2 uv = gl_FragCoord.xy * u_texelSize;
        
        float h = texture2D(u_heightmap, uv).r;
        float w = texture2D(u_watermap, uv).r;
        float s = texture2D(u_sedimentmap, uv).r;
        
        // Находим направление потока (самый низкий сосед, только внутри границ)
        vec2 flowDir = vec2(0.0);
        float minH = h;
        vec2 offsets[4] = vec2[](vec2(0.0, u_texelSize.y), vec2(0.0, -u_texelSize.y), 
                                vec2(u_texelSize.x, 0.0), vec2(-u_texelSize.x, 0.0));
        for (int i = 0; i < 4; i++) {
            vec2 uv2 = uv + offsets[i];
            // Проверяем, что координата внутри [0,1]
            if (uv2.x >= 0.0 && uv2.x <= 1.0 && uv2.y >= 0.0 && uv2.y <= 1.0) {
                float nh = texture2D(u_heightmap, uv2).r;
                if (nh < minH) {
                    minH = nh;
                    flowDir = offsets[i];
                }
            }
        }
        
        if (flowDir != vec2(0.0) && w > 0.0) {
            float slope = (h - minH) / length(flowDir);
            float flow = min(w, slope * u_waterCapacity);
            float erosion = flow * slope * u_erosionRate;
            erosion = min(erosion, h);
            float deposit = s * u_depositionRate;
            
            h -= erosion;
            s += erosion;
            w -= flow;
            s -= deposit;
            h += deposit;
        }
        
        w += u_rainAmount;
        w -= u_evaporation;
        w = max(w, 0.0);
        
        gl_FragColor = vec4(h, w, s, 1.0);
    }
`;

export class GPGPUErosion {
    constructor(renderer, width, height, initialHeightData, options = {}) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        this.iterations = options.iterations || 10;
        
        // Нормализация высот в 0..1
        let minH = Infinity, maxH = -Infinity;
        for (let i = 0; i < initialHeightData.length; i++) {
            minH = Math.min(minH, initialHeightData[i]);
            maxH = Math.max(maxH, initialHeightData[i]);
        }
        this.minHeight = minH;
        this.maxHeight = maxH;
        const range = maxH - minH;
        const normalizedHeight = new Float32Array(initialHeightData.length);
        for (let i = 0; i < initialHeightData.length; i++) {
            normalizedHeight[i] = (initialHeightData[i] - minH) / range;
        }
        
        this.gpuCompute = new GPUComputationRenderer(width, height, renderer);
        
        // Создание трёх текстур
        this.heightTexture = this.gpuCompute.createTexture();
        this.waterTexture = this.gpuCompute.createTexture();
        this.sedimentTexture = this.gpuCompute.createTexture();

        this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
        this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
        this.waterTexture.wrapS = THREE.ClampToEdgeWrapping;
        this.waterTexture.wrapT = THREE.ClampToEdgeWrapping;
        this.sedimentTexture.wrapS = THREE.ClampToEdgeWrapping;
        this.sedimentTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        this.initTexture(this.heightTexture, normalizedHeight);
        this.initTexture(this.waterTexture, new Float32Array(width * height).fill(0));
        this.initTexture(this.sedimentTexture, new Float32Array(width * height).fill(0));
        
        // Добавление переменных
        this.heightVar = this.gpuCompute.addVariable('u_heightmap', erosionShader, this.heightTexture);
        this.waterVar = this.gpuCompute.addVariable('u_watermap', erosionShader, this.waterTexture);
        this.sedimentVar = this.gpuCompute.addVariable('u_sedimentmap', erosionShader, this.sedimentTexture);
        
        // Uniforms
        const uniforms = this.heightVar.material.uniforms;
        uniforms['u_texelSize'] = { value: new THREE.Vector2(1 / width, 1 / height) };
        uniforms['u_rainAmount'] = { value: options.rainAmount ?? 0.001 };
        uniforms['u_evaporation'] = { value: options.evaporation ?? 0.005 };
        uniforms['u_erosionRate'] = { value: options.erosionRate ?? 0.02 };
        uniforms['u_depositionRate'] = { value: options.depositionRate ?? 0.01 };
        uniforms['u_waterCapacity'] = { value: options.waterCapacity ?? 1.0 };
        
        // Зависимости
        this.gpuCompute.setVariableDependencies(this.heightVar, [this.heightVar, this.waterVar, this.sedimentVar]);
        this.gpuCompute.setVariableDependencies(this.waterVar, [this.heightVar, this.waterVar, this.sedimentVar]);
        this.gpuCompute.setVariableDependencies(this.sedimentVar, [this.heightVar, this.waterVar, this.sedimentVar]);
        
        const error = this.gpuCompute.init();
        if (error) console.error('GPGPUErosion init error:', error);
        else console.log('GPGPUErosion (гидравлическая) инициализирована');
    }
    
    initTexture(texture, data) {
        const imageData = texture.image.data;
        const w = texture.image.width;
        const h = texture.image.height;
        for (let i = 0; i < w * h; i++) {
            imageData[i*4] = data[i];
            imageData[i*4+1] = 0;
            imageData[i*4+2] = 0;
            imageData[i*4+3] = 1;
        }
        texture.needsUpdate = true;
    }
    
    run() {
        for (let i = 0; i < this.iterations; i++) {
            this.gpuCompute.compute();
        }
        console.log(`Гидравлическая эрозия выполнена: ${this.iterations} итераций`);
    }
    
    getResultHeightData() {
        const resultTexture = this.gpuCompute.getCurrentRenderTarget(this.heightVar).texture;
        if (!resultTexture || !resultTexture.image) {
            console.error('Текстура результата недоступна');
            return null;
        }
        const w = resultTexture.image.width;
        const h = resultTexture.image.height;
        
        const renderTarget = new THREE.WebGLRenderTarget(w, h);
        const material = new THREE.MeshBasicMaterial({ map: resultTexture });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
        const scene = new THREE.Scene();
        scene.add(plane);
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(scene, camera);
        
        const readBuffer = new Uint8Array(w * h * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, w, h, readBuffer);
        this.renderer.setRenderTarget(null);
        
        renderTarget.dispose();
        scene.clear();
        
        const heights = new Float32Array(w * h);
        const range = this.maxHeight - this.minHeight;
        for (let i = 0; i < w * h; i++) {
            heights[i] = this.minHeight + (readBuffer[i*4] / 255) * range;
        }
        return heights;
    }
    
    dispose() {
        this.gpuCompute.dispose();
    }
}