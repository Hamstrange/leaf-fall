// src/utils/setGPGPUDependencies.js

export function setGPGPUDependencies(gpuCompute, variables) {
    gpuCompute.setVariableDependencies(variables.velocityVar, [variables.velocityVar, variables.positionVar, variables.rotationVar, variables.hingeVar]);
    gpuCompute.setVariableDependencies(variables.angVelVar, [variables.angVelVar, variables.positionVar, variables.rotationVar, variables.velocityVar, variables.hingeVar]);
    gpuCompute.setVariableDependencies(variables.positionVar, [variables.positionVar, variables.velocityVar]);
    gpuCompute.setVariableDependencies(variables.rotationVar, [variables.rotationVar, variables.angVelVar, variables.positionVar]);
    gpuCompute.setVariableDependencies(variables.hingeVar, [variables.hingeVar, variables.positionVar, variables.rotationVar, variables.velocityVar]);
}