// src/GPGPUSimulation.js
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { velocityShader, angVelShader, positionShader, rotationShader, hingeShader } from './shaders/leafShaders.js';
import { initLeafTextures } from './utils/initLeafTextures.js';
import { setGPGPUDependencies } from './utils/setGPGPUDependencies.js';

export class GPGPUSimulation {
    constructor(gridSize, renderer, params) {
        this.gridSize = gridSize;
        this.gpuCompute = new GPUComputationRenderer(gridSize, gridSize, renderer);
        
        // Создание текстур
        this.posTexture = this.gpuCompute.createTexture();
        this.velTexture = this.gpuCompute.createTexture();
        this.rotTexture = this.gpuCompute.createTexture();
        this.angVelTexture = this.gpuCompute.createTexture();
        this.hingeTexture = this.gpuCompute.createTexture();
        this.paramsTexture = this.gpuCompute.createTexture();

        // Инициализация данных текстур
        initLeafTextures({
            numLeaves: gridSize * gridSize,
            params: params,
            posTexture: this.posTexture,
            velTexture: this.velTexture,
            rotTexture: this.rotTexture,
            angVelTexture: this.angVelTexture,
            hingeTexture: this.hingeTexture,
            paramsTexture: this.paramsTexture
        });

        // Добавление переменных GPGPU
        this.velocityVar = this.gpuCompute.addVariable('textureVelocity', velocityShader, this.velTexture);
        this.angVelVar = this.gpuCompute.addVariable('textureAngularVelocity', angVelShader, this.angVelTexture);
        this.positionVar = this.gpuCompute.addVariable('texturePosition', positionShader, this.posTexture);
        this.rotationVar = this.gpuCompute.addVariable('textureRotation', rotationShader, this.rotTexture);
        this.hingeVar = this.gpuCompute.addVariable('textureHinge', hingeShader, this.hingeTexture);

        // Установка зависимостей
        setGPGPUDependencies(this.gpuCompute, {
            velocityVar: this.velocityVar,
            angVelVar: this.angVelVar,
            positionVar: this.positionVar,
            rotationVar: this.rotationVar,
            hingeVar: this.hingeVar
        });

        const error = this.gpuCompute.init();
        if (error) console.error('GPGPU init error:', error);
    }

    // Запуск GPGPU вычислений
    compute() {
        this.gpuCompute.compute();
    }

    // Получение текущих текстур после вычислений
    getCurrentTextures() {
        return {
            position: this.gpuCompute.getCurrentRenderTarget(this.positionVar).texture,
            rotation: this.gpuCompute.getCurrentRenderTarget(this.rotationVar).texture,
            hinge: this.gpuCompute.getCurrentRenderTarget(this.hingeVar).texture,
            params: this.paramsTexture   // статична
        };
    }

    // Геттеры для доступа к переменным (нужны для GUI и uniform'ов)
    getVelocityVar() { return this.velocityVar; }
    getAngVelVar() { return this.angVelVar; }
    getPositionVar() { return this.positionVar; }
    getRotationVar() { return this.rotationVar; }
    getHingeVar() { return this.hingeVar; }
}