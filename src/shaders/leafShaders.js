// src/shaders/leafShaders.js
export const rotateFunc = `
    vec3 rotate(vec4 q, vec3 v) {
        return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
    }
`;

export const velocityShader = `
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
`;

export const angVelShader = `
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
`;

export const positionShader = `
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
`;

export const rotationShader = `
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
`;

export const hingeShader = `
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
`;