// src/LeafField.js
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { createLeafGeometry, createLeafMaterial } from './newLeafModel.js';
import { velocityShader, angVelShader, positionShader, rotationShader, hingeShader } from './shaders/leafShaders.js';
import { initLeafTextures } from './utils/initLeafTextures.js';
import { initLeafUniforms } from './utils/initLeafUniforms.js';
import { setGPGPUDependencies } from './utils/setGPGPUDependencies.js';
import { defaultPhysicsParams } from './config/physicsParams.js';
import { createLeafInstances } from './utils/createLeafInstances.js';
import { addGUIMethods } from './mixins/leafFieldGUIMethods.js';

export class LeafField {
    constructor(gridSize, scene, renderer) {
        this.gridSize = gridSize;
        this.numLeaves = gridSize * gridSize;
        this.scene = scene;
        this.renderer = renderer;

        this.geometry = createLeafGeometry();
        this.material = createLeafMaterial();
        this.mesh = createLeafInstances(this.scene, this.geometry, this.material, this.numLeaves);

        this.params = { ...defaultPhysicsParams };

        this.gpuCompute = new GPUComputationRenderer(this.gridSize, this.gridSize, this.renderer);

        this.posTexture = this.gpuCompute.createTexture();
        this.velTexture = this.gpuCompute.createTexture();
        this.rotTexture = this.gpuCompute.createTexture();
        this.angVelTexture = this.gpuCompute.createTexture();
        this.hingeTexture = this.gpuCompute.createTexture();
        this.paramsTexture = this.gpuCompute.createTexture();

        initLeafTextures({
            numLeaves: this.numLeaves,
            params: this.params,
            posTexture: this.posTexture,
            velTexture: this.velTexture,
            rotTexture: this.rotTexture,
            angVelTexture: this.angVelTexture,
            hingeTexture: this.hingeTexture,
            paramsTexture: this.paramsTexture
        });

        this.velocityVar = this.gpuCompute.addVariable('textureVelocity', velocityShader, this.velTexture);
        this.angVelVar = this.gpuCompute.addVariable('textureAngularVelocity', angVelShader, this.angVelTexture);
        this.positionVar = this.gpuCompute.addVariable('texturePosition', positionShader, this.posTexture);
        this.rotationVar = this.gpuCompute.addVariable('textureRotation', rotationShader, this.rotTexture);
        this.hingeVar = this.gpuCompute.addVariable('textureHinge', hingeShader, this.hingeTexture);

        setGPGPUDependencies(this.gpuCompute, {
            velocityVar: this.velocityVar,
            angVelVar: this.angVelVar,
            positionVar: this.positionVar,
            rotationVar: this.rotationVar,
            hingeVar: this.hingeVar
        });

        const error = this.gpuCompute.init();
        if (error) console.error('GPGPU init error:', error);

        initLeafUniforms({
            velocityVar: this.velocityVar,
            angVelVar: this.angVelVar,
            positionVar: this.positionVar,
            rotationVar: this.rotationVar,
            hingeVar: this.hingeVar
        }, this.params);

        this.material.uniforms.texturePosition.value = this.posTexture;
        this.material.uniforms.textureRotation.value = this.rotTexture;
        this.material.uniforms.textureHinge.value = this.hingeTexture;
        this.material.uniforms.textureParams.value = this.paramsTexture;
    }

    update(delta, time) {
        this.positionVar.material.uniforms.delta.value = delta;
        this.velocityVar.material.uniforms.delta.value = delta;
        this.angVelVar.material.uniforms.delta.value = delta;
        this.rotationVar.material.uniforms.delta.value = delta;
        this.hingeVar.material.uniforms.delta.value = delta;

        this.positionVar.material.uniforms.time.value = time;
        this.rotationVar.material.uniforms.time.value = time;

        this.gpuCompute.compute();

        this.material.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget(this.positionVar).texture;
        this.material.uniforms.textureRotation.value = this.gpuCompute.getCurrentRenderTarget(this.rotationVar).texture;
        this.material.uniforms.textureHinge.value = this.gpuCompute.getCurrentRenderTarget(this.hingeVar).texture;
        this.material.uniforms.textureParams.value = this.paramsTexture;
    }
}

addGUIMethods(LeafField.prototype);