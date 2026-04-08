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