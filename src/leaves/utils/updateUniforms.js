// src/utils/updateUniforms.js

export function updateUniforms(variables, delta, time) {
    // Обновляем delta для всех переменных
    variables.velocityVar.material.uniforms.delta.value = delta;
    variables.angVelVar.material.uniforms.delta.value = delta;
    variables.positionVar.material.uniforms.delta.value = delta;
    variables.rotationVar.material.uniforms.delta.value = delta;
    variables.hingeVar.material.uniforms.delta.value = delta;

    // Обновляем time для position и rotation
    variables.positionVar.material.uniforms.time.value = time;
    variables.rotationVar.material.uniforms.time.value = time;
}