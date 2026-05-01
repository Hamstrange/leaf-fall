// src/leaves/graphics/shaders/leafDeformationCore.vert.glsl
uniform sampler2D texturePosition;
uniform sampler2D textureRotation;
uniform sampler2D textureHinge;
uniform sampler2D textureParams;
uniform float gridSize;
uniform float Hight;
uniform float Lmax;
uniform float angleV;
uniform float halfHeight;

varying vec2 vUv;
varying vec3 vWorldNormal;

#ifndef PI
#define PI 3.1415926538
#endif

void main() {
    vUv = uv;

    int idx = gl_InstanceID;
    int x = idx % int(gridSize);
    int y = idx / int(gridSize);
    vec2 texUV = (vec2(x, y) + 0.5) / vec2(gridSize);

    vec3 worldPos = texture2D(texturePosition, texUV).xyz;
    vec4 quat = texture2D(textureRotation, texUV);
    float hinge = texture2D(textureHinge, texUV).x;
    vec4 params = texture2D(textureParams, texUV);
    float scale = params.r;

    vec3 localPos = position * scale;
    float angleH = hinge - PI;

    // ---- Горизонтальный изгиб (вокруг оси Z) ----
    vec2 p_h = vec2(localPos.z, localPos.y);
    vec2 d_h_dx, d_h_dy;
    vec2 h = bend2D(p_h, angleH, Lmax, d_h_dx, d_h_dy);
    float x_h = h.x;
    float y_h = h.y;

    // Производные для нормали
    vec3 dPos_dz = vec3(0.0, d_h_dx.y, d_h_dx.x);
    vec3 dPos_dy = vec3(0.0, d_h_dy.y, d_h_dy.x);

    // ---- Вертикальный изгиб (вокруг оси X) ----
    vec2 p_v = vec2(localPos.x, y_h);
    vec2 d_v_dx, d_v_dy;
    vec2 v = bend2D(p_v, angleV, Lmax, d_v_dx, d_v_dy);
    float x_v = v.x;
    float y_v = v.y;

    vec3 dPos_dx = vec3(d_v_dx.x, d_v_dx.y, 0.0);
    vec3 dPos_dyh = vec3(d_v_dy.x, d_v_dy.y, 0.0);

    vec3 dPos_global_dx = dPos_dx;
    vec3 dPos_global_dy = dPos_dyh * d_h_dy.y + dPos_dy;
    vec3 dPos_global_dz = dPos_dyh * d_h_dx.y + dPos_dz;

    // Нормаль после изгиба
    vec3 normal_old = normalize(cross(dPos_global_dx, dPos_global_dy));

    // ---- Смещение центра масс ----
    float offsetY = cos(hinge * 0.5) * halfHeight;

    // ---- Новая позиция без поворота, но с преобразованием (x, y, z) -> (x, z, -y) ----
    vec3 deformedPos = vec3(x_v, x_h - offsetY, -(y_v));
    vec3 normal_new = vec3(normal_old.x, normal_old.z, -normal_old.y);

    vec3 worldNormal = normalize(rotate(quat, normal_new));
    vWorldNormal = worldNormal;

    vec3 finalPos = worldPos + rotate(quat, deformedPos);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}