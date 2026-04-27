// src/shaders/leafShaders.js
import rotateFunc from './glsl/rotateFunc.glsl?raw';
import velocityRaw from './glsl/velocity.glsl?raw';
import angVelRaw from './glsl/angVel.glsl?raw';
import positionRaw from './glsl/position.glsl?raw';
import rotationRaw from './glsl/rotation.glsl?raw';
import hingeRaw from './glsl/hinge.glsl?raw';

export const velocityShader = rotateFunc + velocityRaw;
export const angVelShader = rotateFunc + angVelRaw;
export const positionShader = positionRaw;
export const rotationShader = rotationRaw;
export const hingeShader = rotateFunc + hingeRaw;