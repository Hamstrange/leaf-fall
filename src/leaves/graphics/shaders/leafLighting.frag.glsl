uniform sampler2D map;
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 ambientColor;
varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
    vec3 normal = normalize(vWorldNormal);
    if (!gl_FrontFacing) normal = -normal;
    vec3 texColor = texture2D(map, vUv).rgb;
    float diff = max(0.0, dot(normal, lightDir));
    vec3 litColor = (ambientColor + diff * lightColor) * texColor;
    gl_FragColor = vec4(litColor, 1.0);
}