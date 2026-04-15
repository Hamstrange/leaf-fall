//src/terrain/erosion/shaders/smoothFrag.glsl
uniform sampler2D u_heightmap;
uniform vec2 u_texelSize;

void main() {
    vec2 uv = gl_FragCoord.xy * u_texelSize;
    
    // Читаем высоту текущего пикселя и четырёх соседей
    float h = texture2D(u_heightmap, uv).r;
    float hN = texture2D(u_heightmap, uv + vec2(0.0, u_texelSize.y)).r;
    float hS = texture2D(u_heightmap, uv - vec2(0.0, u_texelSize.y)).r;
    float hE = texture2D(u_heightmap, uv + vec2(u_texelSize.x, 0.0)).r;
    float hW = texture2D(u_heightmap, uv - vec2(u_texelSize.x, 0.0)).r;
    
    // Сглаживание: среднее арифметическое
    float smoothHeight = (h + hN + hS + hE + hW) / 5.0;
    
    gl_FragColor = vec4(smoothHeight, 0.0, 0.0, 1.0);
}