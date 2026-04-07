// src/LeafField.js
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { createLeafGeometry, createLeafMaterial } from './newLeafModel.js';
import { velocityShader, angVelShader, positionShader, rotationShader, hingeShader } from './shaders/leafShaders.js';
import { initLeafTextures } from './utils/initLeafTextures.js';
import { initLeafUniforms } from './utils/initLeafUniforms.js';
import { setGPGPUDependencies } from './utils/setGPGPUDependencies.js';

export class LeafField {
    constructor(gridSize, scene, renderer) {
        this.gridSize = gridSize;
        this.numLeaves = gridSize * gridSize;
        this.scene = scene;
        this.renderer = renderer;

        this.geometry = createLeafGeometry();
        this.material = createLeafMaterial();
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.numLeaves);
        scene.add(this.mesh);

        this.params = {
            gravity: -10.0,
            damping: 0.99,
            drag: 10.0,
            threshold: -15.0,
            minResetY: 5.0,
            maxResetY: 20.0,
            startAngle: 170.0,
            targetAngle: 180.0,
            elasticity: 0.05,
            momentFactor: 0.01,
            torqueFactor: 0.1,
            angularDamping: 0.99,
            velTorqueFactor: 50.0,
            speedThreshold: 2,
        };

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

    updateGravity(v) { this.params.gravity = v; this.velocityVar.material.uniforms.g.value = v; }
    updateDamping(v) { this.params.damping = v; this.velocityVar.material.uniforms.damping.value = v; }
    updateDrag(v) { this.params.drag = v; this.velocityVar.material.uniforms.drag.value = v; this.angVelVar.material.uniforms.drag.value = v; this.hingeVar.material.uniforms.drag.value = v; }
    updateThreshold(v) { this.params.threshold = v; this.velocityVar.material.uniforms.threshold.value = v; this.angVelVar.material.uniforms.threshold.value = v; this.positionVar.material.uniforms.threshold.value = v; this.rotationVar.material.uniforms.threshold.value = v; this.hingeVar.material.uniforms.threshold.value = v; }
    updateMinResetY(v) { this.params.minResetY = v; this.positionVar.material.uniforms.minResetY.value = v; }
    updateMaxResetY(v) { this.params.maxResetY = v; this.positionVar.material.uniforms.maxResetY.value = v; }
    updateStartAngle(v) { this.params.startAngle = v; this.hingeVar.material.uniforms.startAngle.value = v * Math.PI/180; }
    updateTargetAngle(v) { this.params.targetAngle = v; this.hingeVar.material.uniforms.targetAngle.value = v * Math.PI/180; }
    updateElasticity(v) { this.params.elasticity = v; this.hingeVar.material.uniforms.elasticity.value = v; }
    updateMomentFactor(v) { this.params.momentFactor = v; this.hingeVar.material.uniforms.momentFactor.value = v; }
    updateTorqueFactor(v) { this.params.torqueFactor = v; this.angVelVar.material.uniforms.torqueFactor.value = v; }
    updateAngularDamping(v) { this.params.angularDamping = v; this.angVelVar.material.uniforms.angularDamping.value = v; }
    updateVelTorqueFactor(v) { this.params.velTorqueFactor = v; this.angVelVar.material.uniforms.velTorqueFactor.value = v; }
    updateSpeedThreshold(v) { this.params.speedThreshold = v; this.angVelVar.material.uniforms.speedThreshold.value = v; }
    updateAmbientColor(r,g,b) { this.material.uniforms.ambientColor.value.set(r,g,b); }
    updateLightColor(r,g,b) { this.material.uniforms.lightColor.value.set(r,g,b); }
    updateLightDir(x,y,z) { this.material.uniforms.lightDir.value.set(x,y,z).normalize(); }
}