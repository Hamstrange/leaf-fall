// src/common/shaders/bend3D.glsl
// Требует наличия bend2D (должна быть определена выше)
vec3 bend3D(vec3 point, float angleRad, float maxHeight, vec3 gripVec, vec3 bendAxis, out vec3 dOut_dx, out vec3 dOut_dy) {
    vec3 g = normalize(gripVec);
    vec3 h = normalize(cross(g, bendAxis));
    
    // Защита от коллинеарности (bendAxis параллелен gripVec)
    if (length(h) < 0.001) {
        dOut_dx = vec3(0.0);
        dOut_dy = vec3(0.0);
        return point;
    }
    
    float x = dot(point, h);
    float y = dot(point, g);
    
    vec2 d2D_dx, d2D_dy;
    vec2 new_xy = bend2D(vec2(x, y), angleRad, maxHeight, d2D_dx, d2D_dy);
    
    vec3 displacement = new_xy.x * h + new_xy.y * g;
    dOut_dx = d2D_dx.x * h + d2D_dx.y * g;
    dOut_dy = d2D_dy.x * h + d2D_dy.y * g;
    
    return displacement;
}