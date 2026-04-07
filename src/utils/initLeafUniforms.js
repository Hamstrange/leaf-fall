// src/utils/initLeafUniforms.js

export function initLeafUniforms(variables, params) {
    const targetAngleRad = params.targetAngle * Math.PI / 180;
    const startAngleRad = params.startAngle * Math.PI / 180;

    // velocityVar
    variables.velocityVar.material.uniforms.g = { value: params.gravity };
    variables.velocityVar.material.uniforms.threshold = { value: params.threshold };
    variables.velocityVar.material.uniforms.damping = { value: params.damping };
    variables.velocityVar.material.uniforms.drag = { value: params.drag };
    variables.velocityVar.material.uniforms.delta = { value: 0.0 };

    // angVelVar
    variables.angVelVar.material.uniforms.threshold = { value: params.threshold };
    variables.angVelVar.material.uniforms.drag = { value: params.drag };
    variables.angVelVar.material.uniforms.torqueFactor = { value: params.torqueFactor };
    variables.angVelVar.material.uniforms.angularDamping = { value: params.angularDamping };
    variables.angVelVar.material.uniforms.leafHeight = { value: 3.0 };
    variables.angVelVar.material.uniforms.leafWidth = { value: 2.0 };
    variables.angVelVar.material.uniforms.velTorqueFactor = { value: params.velTorqueFactor };
    variables.angVelVar.material.uniforms.speedThreshold = { value: params.speedThreshold };
    variables.angVelVar.material.uniforms.delta = { value: 0.0 };

    // positionVar
    variables.positionVar.material.uniforms.threshold = { value: params.threshold };
    variables.positionVar.material.uniforms.minResetY = { value: params.minResetY };
    variables.positionVar.material.uniforms.maxResetY = { value: params.maxResetY };
    variables.positionVar.material.uniforms.time = { value: 0.0 };
    variables.positionVar.material.uniforms.delta = { value: 0.0 };

    // rotationVar
    variables.rotationVar.material.uniforms.threshold = { value: params.threshold };
    variables.rotationVar.material.uniforms.time = { value: 0.0 };
    variables.rotationVar.material.uniforms.delta = { value: 0.0 };

    // hingeVar
    variables.hingeVar.material.uniforms.threshold = { value: params.threshold };
    variables.hingeVar.material.uniforms.targetAngle = { value: targetAngleRad };
    variables.hingeVar.material.uniforms.elasticity = { value: params.elasticity };
    variables.hingeVar.material.uniforms.momentFactor = { value: params.momentFactor };
    variables.hingeVar.material.uniforms.startAngle = { value: startAngleRad };
    variables.hingeVar.material.uniforms.drag = { value: params.drag };
    variables.hingeVar.material.uniforms.leafHeight = { value: 3.0 };
    variables.hingeVar.material.uniforms.delta = { value: 0.0 };
}