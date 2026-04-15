//src/terrain/erosion/shaders/smoothVert.glsl
void main() {
    gl_PointSize = 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}