uniform float delta;
uniform float threshold;
uniform float drag;
uniform float torqueFactor;
uniform float angularDamping;
uniform float leafHeight;
uniform float leafWidth;
uniform float velTorqueFactor;
uniform float speedThreshold;

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