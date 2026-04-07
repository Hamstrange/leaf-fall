// src/LeafField.js
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { createLeafGeometry, createLeafMaterial } from './newLeafModel.js';

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

        // Параметры физики (как в исходном)
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

        // GPGPU
        this.gpuCompute = new GPUComputationRenderer(this.gridSize, this.gridSize, this.renderer);

        this.posTexture = this.gpuCompute.createTexture();
        this.velTexture = this.gpuCompute.createTexture();
        this.rotTexture = this.gpuCompute.createTexture();
        this.angVelTexture = this.gpuCompute.createTexture();
        this.hingeTexture = this.gpuCompute.createTexture();
        this.paramsTexture = this.gpuCompute.createTexture();

        this.initTextures();

        // rotateFunc для шейдеров
        const rotateFunc = `
            vec3 rotate(vec4 q, vec3 v) {
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
            }
        `;

        // velocityVar
        this.velocityVar = this.gpuCompute.addVariable('textureVelocity', `
            uniform float delta;
            uniform float g;
            uniform float threshold;
            uniform float damping;
            uniform float drag;
            
            ${rotateFunc}
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 vel = texture2D(textureVelocity, uv);
                vec4 pos = texture2D(texturePosition, uv);
                vec4 quat = texture2D(textureRotation, uv);
                vec4 hinge = texture2D(textureHinge, uv);
                
                if (pos.y < threshold) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float angle = hinge.x;
                    float ha = angle * 0.5;
                    float sinHa = sin(ha);
                    float cosHa = cos(ha);
                    
                    vec3 localNormal1 = vec3(0.0,  sinHa, cosHa);
                    vec3 localNormal2 = vec3(0.0, -sinHa, cosHa);
                    
                    vec3 worldNormal1 = rotate(quat, localNormal1);
                    vec3 worldNormal2 = rotate(quat, localNormal2);
                    
                    float vn1 = dot(vel.xyz, worldNormal1);
                    float vn2 = dot(vel.xyz, worldNormal2);
                    
                    vec3 force1 = -drag * vn1 * worldNormal1;
                    vec3 force2 = -drag * vn2 * worldNormal2;
                    
                    vec3 totalForce = (force1 + force2) / 2.0;
                    
                    vec3 newVel = vel.xyz * damping + (vec3(0.0, g, 0.0) + totalForce) * delta;
                    
                    gl_FragColor = vec4(newVel, 1.0);
                }
            }
        `, this.velTexture);

        // angVelVar
        this.angVelVar = this.gpuCompute.addVariable('textureAngularVelocity', `
            uniform float delta;
            uniform float threshold;
            uniform float drag;
            uniform float torqueFactor;
            uniform float angularDamping;
            uniform float leafHeight;
            uniform float leafWidth;
            uniform float velTorqueFactor;
            uniform float speedThreshold;
            
            ${rotateFunc}
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 angVel = texture2D(textureAngularVelocity, uv);
                vec4 pos = texture2D(texturePosition, uv);
                vec4 quat = texture2D(textureRotation, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                vec4 hinge = texture2D(textureHinge, uv);
                
                if (pos.y < threshold) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float angle = hinge.x;
                    float ha = angle * 0.5;
                    float sinHa = sin(ha);
                    float cosHa = cos(ha);
                    
                    float d = (leafHeight / 2.0) * sinHa;
                    vec3 localCenter1 = vec3(0.0, 0.0, -d);
                    vec3 localCenter2 = vec3(0.0, 0.0,  d);
                    
                    vec3 worldCenter1 = pos.xyz + rotate(quat, localCenter1);
                    vec3 worldCenter2 = pos.xyz + rotate(quat, localCenter2);
                    
                    vec3 axisX = rotate(quat, vec3(1.0, 0.0, 0.0));
                    
                    vec3 offset = dot(vec3(0.0, -leafWidth/2.0, 0.0), axisX) * axisX;
                    
                    vec3 r1 = (worldCenter1 + offset) - pos.xyz;
                    vec3 r2 = (worldCenter2 + offset) - pos.xyz;
                    
                    vec3 localNormal1 = vec3(0.0,  sinHa, cosHa);
                    vec3 localNormal2 = vec3(0.0, -sinHa, cosHa);
                    
                    vec3 worldNormal1 = rotate(quat, localNormal1);
                    vec3 worldNormal2 = rotate(quat, localNormal2);
                    
                    float vn1 = dot(vel.xyz, worldNormal1);
                    float vn2 = dot(vel.xyz, worldNormal2);
                    
                    vec3 force1 = -drag * vn1 * worldNormal1;
                    vec3 force2 = -drag * vn2 * worldNormal2;
                    
                    vec3 torque1 = cross(r1, force1);
                    vec3 torque2 = cross(r2, force2);
                    vec3 totalTorque = torque1 + torque2;
                    
                    float speed = length(vel.xyz);
                    if (speed < speedThreshold && speed > 0.001) {
                        vec3 dir = normalize(cross(axisX, vel.xyz));
                        totalTorque += velTorqueFactor * dir;
                    }
                    
                    vec3 newAngVel = angVel.xyz + totalTorque * delta * torqueFactor;
                    newAngVel *= angularDamping;
                    
                    gl_FragColor = vec4(newAngVel, 1.0);
                }
            }
        `, this.angVelTexture);

        // positionVar
        this.positionVar = this.gpuCompute.addVariable('texturePosition', `
            uniform float delta;
            uniform float threshold;
            uniform float minResetY;
            uniform float maxResetY;
            uniform float time;
            
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 pos = texture2D(texturePosition, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                
                if (pos.y < threshold) {
                    float randX = hash(vec2(uv.x + time, uv.y));
                    float randZ = hash(vec2(uv.y + time, uv.x));
                    float randY = hash(vec2(uv.x + time + 1.0, uv.y + 1.0));
                    float newX = (randX - 0.5) * 60.0;
                    float newZ = (randZ - 0.5) * 60.0;
                    float newY = minResetY + randY * (maxResetY - minResetY);
                    gl_FragColor = vec4(newX, newY, newZ, 1.0);
                } else {
                    gl_FragColor = vec4(pos.xyz + vel.xyz * delta, 1.0);
                }
            }
        `, this.posTexture);

        // rotationVar
        this.rotationVar = this.gpuCompute.addVariable('textureRotation', `
            uniform float delta;
            uniform float threshold;
            uniform float time;
            
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            vec4 randomQuat(vec2 seed) {
                float u1 = hash(seed);
                float u2 = hash(seed + vec2(1.0, 0.0));
                float u3 = hash(seed + vec2(0.0, 1.0));
                
                float theta = 2.0 * 3.14159 * u1;
                float phi = acos(2.0 * u2 - 1.0);
                float r = sqrt(1.0 - u3);
                float R = sqrt(u3);
                
                float x = r * sin(phi) * cos(theta);
                float y = r * sin(phi) * sin(theta);
                float z = r * cos(phi);
                float w = R;
                
                return normalize(vec4(x, y, z, w));
            }
            
            vec4 integrateQuat(vec4 q, vec3 omega, float dt) {
                vec3 halfOmega = 0.5 * omega;
                vec4 qDot = vec4(halfOmega * q.w + cross(halfOmega, q.xyz), -dot(halfOmega, q.xyz));
                return normalize(q + qDot * dt);
            }
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 rot = texture2D(textureRotation, uv);
                vec4 angVel = texture2D(textureAngularVelocity, uv);
                vec4 pos = texture2D(texturePosition, uv);
                
                if (pos.y < threshold) {
                    vec2 seed = vec2(uv.x + time, uv.y + time);
                    gl_FragColor = randomQuat(seed);
                } else {
                    gl_FragColor = integrateQuat(rot, angVel.xyz, delta);
                }
            }
        `, this.rotTexture);

        // hingeVar
        this.hingeVar = this.gpuCompute.addVariable('textureHinge', `
            uniform float delta;
            uniform float threshold;
            uniform float targetAngle;
            uniform float elasticity;
            uniform float momentFactor;
            uniform float startAngle;
            uniform float drag;
            uniform float leafHeight;
            
            ${rotateFunc}
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 hinge = texture2D(textureHinge, uv);
                vec4 pos = texture2D(texturePosition, uv);
                vec4 quat = texture2D(textureRotation, uv);
                vec4 vel = texture2D(textureVelocity, uv);
                
                if (pos.y < threshold) {
                    gl_FragColor = vec4(startAngle, 0.0, 0.0, 1.0);
                } else {
                    float angle = hinge.x;
                    float ha = angle * 0.5;
                    float sinHa = sin(ha);
                    float cosHa = cos(ha);
                    
                    float d = (leafHeight / 2.0) * sinHa;
                    vec3 localCenter1 = vec3(0.0, 0.0, -d);
                    vec3 localCenter2 = vec3(0.0, 0.0,  d);
                    
                    vec3 localNormal1 = vec3(0.0,  sinHa, cosHa);
                    vec3 localNormal2 = vec3(0.0, -sinHa, cosHa);
                    
                    vec3 worldNormal1 = rotate(quat, localNormal1);
                    vec3 worldNormal2 = rotate(quat, localNormal2);
                    
                    vec3 worldCenter1 = pos.xyz + rotate(quat, localCenter1);
                    vec3 worldCenter2 = pos.xyz + rotate(quat, localCenter2);
                    
                    vec3 r1 = worldCenter1 - pos.xyz;
                    vec3 r2 = worldCenter2 - pos.xyz;
                    
                    float vn1 = dot(vel.xyz, worldNormal1);
                    float vn2 = dot(vel.xyz, worldNormal2);
                    
                    vec3 force1 = -drag * vn1 * worldNormal1;
                    vec3 force2 = -drag * vn2 * worldNormal2;
                    
                    vec3 axisX = rotate(quat, vec3(1.0, 0.0, 0.0));
                    
                    float moment1 = dot(cross(r1, force1), axisX);
                    float moment2 = dot(cross(r2, force2), axisX);
                    float totalMoment = moment2 - moment1;
                    
                    float deltaElastic = elasticity * (targetAngle - angle) * delta;
                    float deltaMoment = momentFactor * totalMoment * delta;
                    angle += deltaElastic + deltaMoment;
                    
                    if (angle < 0.0) angle = 0.0;
                    if (angle > 2.0 * 3.14159) angle = 2.0 * 3.14159;
                    
                    gl_FragColor = vec4(angle, 0.0, 0.0, 1.0);
                }
            }
        `, this.hingeTexture);

        // Зависимости
        this.gpuCompute.setVariableDependencies(this.velocityVar, [this.velocityVar, this.positionVar, this.rotationVar, this.hingeVar]);
        this.gpuCompute.setVariableDependencies(this.angVelVar, [this.angVelVar, this.positionVar, this.rotationVar, this.velocityVar, this.hingeVar]);
        this.gpuCompute.setVariableDependencies(this.positionVar, [this.positionVar, this.velocityVar]);
        this.gpuCompute.setVariableDependencies(this.rotationVar, [this.rotationVar, this.angVelVar, this.positionVar]);
        this.gpuCompute.setVariableDependencies(this.hingeVar, [this.hingeVar, this.positionVar, this.rotationVar, this.velocityVar]);

        const error = this.gpuCompute.init();
        if (error) console.error('GPGPU init error:', error);

        // Установка uniform-ов (как в исходном)
        const targetAngleRad = this.params.targetAngle * Math.PI / 180;
        const startAngleRadVal = this.params.startAngle * Math.PI / 180;

        this.velocityVar.material.uniforms.g = { value: this.params.gravity };
        this.velocityVar.material.uniforms.threshold = { value: this.params.threshold };
        this.velocityVar.material.uniforms.damping = { value: this.params.damping };
        this.velocityVar.material.uniforms.drag = { value: this.params.drag };
        this.velocityVar.material.uniforms.delta = { value: 0.0 };

        this.angVelVar.material.uniforms.threshold = { value: this.params.threshold };
        this.angVelVar.material.uniforms.drag = { value: this.params.drag };
        this.angVelVar.material.uniforms.torqueFactor = { value: this.params.torqueFactor };
        this.angVelVar.material.uniforms.angularDamping = { value: this.params.angularDamping };
        this.angVelVar.material.uniforms.leafHeight = { value: 3.0 };
        this.angVelVar.material.uniforms.leafWidth = { value: 2.0 };
        this.angVelVar.material.uniforms.velTorqueFactor = { value: this.params.velTorqueFactor };
        this.angVelVar.material.uniforms.speedThreshold = { value: this.params.speedThreshold };
        this.angVelVar.material.uniforms.delta = { value: 0.0 };

        this.positionVar.material.uniforms.threshold = { value: this.params.threshold };
        this.positionVar.material.uniforms.minResetY = { value: this.params.minResetY };
        this.positionVar.material.uniforms.maxResetY = { value: this.params.maxResetY };
        this.positionVar.material.uniforms.time = { value: 0.0 };
        this.positionVar.material.uniforms.delta = { value: 0.0 };

        this.rotationVar.material.uniforms.threshold = { value: this.params.threshold };
        this.rotationVar.material.uniforms.time = { value: 0.0 };
        this.rotationVar.material.uniforms.delta = { value: 0.0 };

        this.hingeVar.material.uniforms.threshold = { value: this.params.threshold };
        this.hingeVar.material.uniforms.targetAngle = { value: targetAngleRad };
        this.hingeVar.material.uniforms.elasticity = { value: this.params.elasticity };
        this.hingeVar.material.uniforms.momentFactor = { value: this.params.momentFactor };
        this.hingeVar.material.uniforms.startAngle = { value: startAngleRadVal };
        this.hingeVar.material.uniforms.drag = { value: this.params.drag };
        this.hingeVar.material.uniforms.leafHeight = { value: 3.0 };
        this.hingeVar.material.uniforms.delta = { value: 0.0 };

        // Передаём текстуры в материал
        this.material.uniforms.texturePosition.value = this.posTexture;
        this.material.uniforms.textureRotation.value = this.rotTexture;
        this.material.uniforms.textureHinge.value = this.hingeTexture;
        this.material.uniforms.textureParams.value = this.paramsTexture;
    }

    initTextures() {
        const posData = this.posTexture.image.data;
        const velData = this.velTexture.image.data;
        const rotData = this.rotTexture.image.data;
        const angVelData = this.angVelTexture.image.data;
        const hingeData = this.hingeTexture.image.data;
        const paramsData = this.paramsTexture.image.data;

        for (let i = 0; i < this.numLeaves; i++) {
            const i4 = i * 4;
            posData[i4] = (Math.random() - 0.5) * 60;
            posData[i4 + 1] = this.params.minResetY + Math.random() * (this.params.maxResetY - this.params.minResetY);
            posData[i4 + 2] = (Math.random() - 0.5) * 60;
            posData[i4 + 3] = 1.0;

            velData[i4] = 0;
            velData[i4 + 1] = 0;
            velData[i4 + 2] = 0;
            velData[i4 + 3] = 1.0;

            const angle = Math.random() * Math.PI * 2;
            const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            rotData[i4] = q.x;
            rotData[i4 + 1] = q.y;
            rotData[i4 + 2] = q.z;
            rotData[i4 + 3] = q.w;

            angVelData[i4] = 0;
            angVelData[i4 + 1] = 0;
            angVelData[i4 + 2] = 0;
            angVelData[i4 + 3] = 1.0;

            hingeData[i4] = this.params.startAngle * Math.PI / 180;
            hingeData[i4 + 1] = 0.0;
            hingeData[i4 + 2] = 0.0;
            hingeData[i4 + 3] = 1.0;
        }

        for (let i = 0; i < this.numLeaves; i++) {
            const i4 = i * 4;
            paramsData[i4] = 0.75 + Math.random() * 0.3;
            paramsData[i4 + 1] = 1.0;
            paramsData[i4 + 2] = 0.2;
            paramsData[i4 + 3] = 0.0;
        }

        this.posTexture.needsUpdate = true;
        this.velTexture.needsUpdate = true;
        this.rotTexture.needsUpdate = true;
        this.angVelTexture.needsUpdate = true;
        this.hingeTexture.needsUpdate = true;
        this.paramsTexture.needsUpdate = true;
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

    // Методы для GUI
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