import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const passthroughShader = `
    uniform vec2 u_texelSize;
    void main() {
        vec2 uv = gl_FragCoord.xy * u_texelSize;
        float h = texture2D(u_heightmap, uv).r;
        gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
    }
`;

export class GPGPUErosion {
    constructor(renderer, width, height, initialHeightData, options = {}) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        this.iterations = options.iterations || 1; // не важно

        // Создаём текстуру напрямую с данными (без нормализации)
        const dataTexture = new THREE.DataTexture(
            initialHeightData, width, height, THREE.RedFormat, THREE.FloatType
        );
        dataTexture.needsUpdate = true;
        dataTexture.wrapS = THREE.RepeatWrapping;
        dataTexture.wrapT = THREE.RepeatWrapping;
        dataTexture.minFilter = THREE.NearestFilter;
        dataTexture.magFilter = THREE.NearestFilter;

        this.gpuCompute = new GPUComputationRenderer(width, height, renderer);
        this.heightVar = this.gpuCompute.addVariable('u_heightmap', passthroughShader, dataTexture);
        this.gpuCompute.setVariableDependencies(this.heightVar, [this.heightVar]);

        const uniforms = this.heightVar.material.uniforms;
        uniforms['u_texelSize'] = { value: new THREE.Vector2(1 / width, 1 / height) };

        const error = this.gpuCompute.init();
        if (error) console.error('GPGPUErosion init error:', error);
        else console.log('Пасс-трю инициализирован');
    }

    run() {
        // Просто выполняем один compute, чтобы получить результат (копирование)
        this.gpuCompute.compute();
        console.log('Пасс-трю выполнен');
    }

    getResultHeightData() {
        const resultTexture = this.gpuCompute.getCurrentRenderTarget(this.heightVar).texture;
        if (!resultTexture || !resultTexture.image) {
            console.error('Текстура результата недоступна');
            return null;
        }
        const w = resultTexture.image.width;
        const h = resultTexture.image.height;

        const renderTarget = new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter
        });

        const material = new THREE.MeshBasicMaterial({ map: resultTexture });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
        const scene = new THREE.Scene();
        scene.add(plane);
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(scene, camera);

        const readBuffer = new Float32Array(w * h * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, w, h, readBuffer);
        this.renderer.setRenderTarget(null);

        renderTarget.dispose();
        scene.clear();

        const heights = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) {
            heights[i] = readBuffer[i * 4];
        }

        console.log('Углы:', heights[0], heights[w - 1], heights[(h - 1) * w], heights[h * w - 1]);

        return heights;
    }

    dispose() {
        this.gpuCompute.dispose();
    }
}