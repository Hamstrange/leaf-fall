// src/utils/initLeafTextures.js
import * as THREE from 'three';

export function initLeafTextures({
    numLeaves,
    params,
    posTexture,
    velTexture,
    rotTexture,
    angVelTexture,
    hingeTexture,
    paramsTexture
}) {
    const posData = posTexture.image.data;
    const velData = velTexture.image.data;
    const rotData = rotTexture.image.data;
    const angVelData = angVelTexture.image.data;
    const hingeData = hingeTexture.image.data;
    const paramsData = paramsTexture.image.data;

    for (let i = 0; i < numLeaves; i++) {
        const i4 = i * 4;
        posData[i4] = (Math.random() - 0.5) * 60;
        posData[i4 + 1] = params.minResetY + Math.random() * (params.maxResetY - params.minResetY);
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

        hingeData[i4] = params.startAngle * Math.PI / 180;
        hingeData[i4 + 1] = 0.0;
        hingeData[i4 + 2] = 0.0;
        hingeData[i4 + 3] = 1.0;
    }

    for (let i = 0; i < numLeaves; i++) {
        const i4 = i * 4;
        paramsData[i4] = 0.75 + Math.random() * 0.3;
        paramsData[i4 + 1] = 1.0;
        paramsData[i4 + 2] = 0.2;
        paramsData[i4 + 3] = 0.0;
    }

    posTexture.needsUpdate = true;
    velTexture.needsUpdate = true;
    rotTexture.needsUpdate = true;
    angVelTexture.needsUpdate = true;
    hingeTexture.needsUpdate = true;
    paramsTexture.needsUpdate = true;
}