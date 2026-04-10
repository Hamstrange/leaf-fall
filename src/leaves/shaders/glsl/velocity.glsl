uniform float delta;
uniform float g;
uniform float threshold;
uniform float damping;
uniform float drag;

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