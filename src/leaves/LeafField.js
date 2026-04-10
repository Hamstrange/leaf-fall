// src/LeafField.js
import * as THREE from 'three';
import { createLeafGeometry, createLeafMaterial } from './newLeafModel.js';
import { defaultPhysicsParams } from './config/physicsParams.js';
import { createLeafInstances } from './utils/createLeafInstances.js';
import { initLeafUniforms } from './utils/initLeafUniforms.js';
import { updateUniforms } from './utils/updateUniforms.js';
import { addGUIMethods } from './mixins/leafFieldGUIMethods.js';
import { GPGPUSimulation } from './GPGPUSimulation.js';

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

        this.simulation = new GPGPUSimulation(gridSize, renderer, this.params);

        // Сохраняем ссылки на GPGPU-переменные для GUI и uniform'ов
        this.velocityVar = this.simulation.getVelocityVar();
        this.angVelVar = this.simulation.getAngVelVar();
        this.positionVar = this.simulation.getPositionVar();
        this.rotationVar = this.simulation.getRotationVar();
        this.hingeVar = this.simulation.getHingeVar();

        // Инициализация uniform'ов GPGPU переменных
        initLeafUniforms({
            velocityVar: this.velocityVar,
            angVelVar: this.angVelVar,
            positionVar: this.positionVar,
            rotationVar: this.rotationVar,
            hingeVar: this.hingeVar
        }, this.params);

        // Передаём начальные текстуры в материал
        this.material.uniforms.texturePosition.value = this.simulation.posTexture;
        this.material.uniforms.textureRotation.value = this.simulation.rotTexture;
        this.material.uniforms.textureHinge.value = this.simulation.hingeTexture;
        this.material.uniforms.textureParams.value = this.simulation.paramsTexture;
    }

    update(delta, time) {
        updateUniforms({
            velocityVar: this.velocityVar,
            angVelVar: this.angVelVar,
            positionVar: this.positionVar,
            rotationVar: this.rotationVar,
            hingeVar: this.hingeVar
        }, delta, time);

        // Запускаем GPGPU вычисления
        this.simulation.compute();

        // Получаем обновлённые текстуры
        const textures = this.simulation.getCurrentTextures();
        this.material.uniforms.texturePosition.value = textures.position;
        this.material.uniforms.textureRotation.value = textures.rotation;
        this.material.uniforms.textureHinge.value = textures.hinge;
    }
}

addGUIMethods(LeafField.prototype);