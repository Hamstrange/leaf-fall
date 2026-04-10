uniform float delta;
uniform float threshold;
uniform float targetAngle;
uniform float elasticity;
uniform float momentFactor;
uniform float startAngle;
uniform float drag;
uniform float leafHeight;

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