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