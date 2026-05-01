// src/common/shaders/bend2D.glsl
#ifndef PI
#define PI 3.1415926538
#endif

vec2 bend2D(vec2 point, float angleRad, float maxHeight, out vec2 dOut_dx, out vec2 dOut_dy) {
    if (abs(angleRad) < 0.001) {
        dOut_dx = vec2(1.0, 0.0);
        dOut_dy = vec2(0.0, 1.0);
        return point;
    }
    float signA = sign(angleRad);
    float absA = abs(angleRad);
    float R = maxHeight / absA;
    float dx = (PI - absA) / PI;
    float dy = point.y / maxHeight;
    float r = R + point.x * dx;
    float C = cos(absA * dy);
    float S = sin(absA * dy);
    float newX = C * r - R;
    float newY = S * r;

    float dC_dy = -S * absA / maxHeight;
    float dS_dy =  C * absA / maxHeight;
    float dr_dx = dx;
    float dr_dy = 0.0;

    float dNewX_dx = C * dr_dx;
    float dNewX_dy = dC_dy * r + C * dr_dy;
    float dNewY_dx = S * dr_dx;
    float dNewY_dy = dS_dy * r + S * dr_dy;

    if (signA < 0.0) {
        newX = -newX;
        dNewX_dx = -dNewX_dx;
        dNewX_dy = -dNewX_dy;
    }

    dOut_dx = vec2(dNewX_dx, dNewY_dx);
    dOut_dy = vec2(dNewX_dy, dNewY_dy);
    return vec2(newX, newY);
}