// newLeafModel.js
import * as THREE from 'three';

// --- Текстура листа (canvas) ---
function createLeafTexture(R, a) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const xWidth = R * Math.sin(a);
    const yHeight = (R / Math.cos(a)) + 1.25 * R;
    const Hight = xWidth;
    const Lmax = yHeight / 2;

    const toUV = (x, y) => {
        const u = 0.5 + x / (2 * Hight);
        const v = 0.5 + y / (2 * Lmax);
        return { u, v };
    };

    // Заливка фона
    ctx.fillStyle = '#238423ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Стебель (центральная линия)
    const yBottom = -1.25 * R;
    const yTop = R / Math.cos(a) - 0.25 * R;
    const stemWidth = 0.05 * R;

    const p1 = toUV(0, yBottom);
    const p2 = toUV(0, yTop);
    ctx.beginPath();
    ctx.moveTo(p1.u * canvas.width, (1 - p1.v) * canvas.height);
    ctx.lineTo(p2.u * canvas.width, (1 - p2.v) * canvas.height);
    ctx.lineWidth = stemWidth * canvas.width * 0.5;
    ctx.strokeStyle = '#113711ff';
    ctx.stroke();

    //Отростки (жилки), отходящие от стебля
    const k = 0.9;
    const verticalFactor = 1.8;
    const sinA = Math.sin(a);
    const cosA = Math.cos(a);
    const Ytop = yTop;
    const minY = -0.9 * R;
    const maxY = yTop;
    const targetCount = 4;
    const stepY = (maxY - minY) / (targetCount + 1);
    const maxOffset = Math.min(0.2 * R, stepY * 0.4);

    for (let i = 1; i <= targetCount; i++) {
        const baseY = minY + i * stepY;
        const offset = (Math.random() * 2 - 1) * maxOffset;
        let y = baseY + offset;
        y = Math.max(minY, Math.min(maxY, y));

        let Vx, Vy;
        if (y < 0) {
            const d = -y * cosA + Math.sqrt(Math.max(0, R*R - y*y * sinA*sinA));
            Vx = sinA * k * d;
            Vy = y + verticalFactor * cosA * k * d;
        } else {
            const factor = k * R * (Ytop - y) / Ytop;
            Vx = sinA * factor;
            Vy = y + verticalFactor * cosA * factor;
        }

        const leftStart = toUV(0, y);
        const leftEnd = toUV(-Vx, Vy);
        ctx.beginPath();
        ctx.moveTo(leftStart.u * canvas.width, (1 - leftStart.v) * canvas.height);
        ctx.lineTo(leftEnd.u * canvas.width, (1 - leftEnd.v) * canvas.height);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#113711ff';
        ctx.stroke();

        const rightEnd = toUV(Vx, Vy);
        ctx.beginPath();
        ctx.moveTo(leftStart.u * canvas.width, (1 - leftStart.v) * canvas.height);
        ctx.lineTo(rightEnd.u * canvas.width, (1 - rightEnd.v) * canvas.height);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

// --- Геометрия листа (контур + хвост) ---
function createUnifiedLeafGeometry(R, a, tailLenFactor) {
    const vertices = [];
    const uvs = [];
    const indices = [];

    const yBase = R * Math.cos(a);
    const xBase = R * Math.sin(a);
    const yTip = R / Math.cos(a);

    const contourPoints = [];
    // левая сторона от верхушки до основания
    const leftSteps = 4;
    for (let i = 0; i <= leftSteps; i++) {
        const t = i / leftSteps;
        const x = (1 - t) * 0 + t * (-xBase);
        const y = (1 - t) * yTip + t * yBase;
        contourPoints.push(new THREE.Vector2(x, y));
    }
    // дуга внизу (округлая часть)
    const arcSteps = 10;
    const startAngle = Math.PI/2 + a;
    const endAngle = 2.5 * Math.PI - a;
    for (let i = 1; i < arcSteps; i++) {
        const t = i / arcSteps;
        const angle = startAngle + t * (endAngle - startAngle);
        const x = R * Math.cos(angle);
        const y = R * Math.sin(angle);
        contourPoints.push(new THREE.Vector2(x, y));
    }
    // правая сторона от основания до верхушки
    const rightSteps = 4;
    for (let i = 0; i <= rightSteps; i++) {
        const t = i / rightSteps;
        const x = (1 - t) * xBase + t * 0;
        const y = (1 - t) * yBase + t * yTip;
        if (i === 0 && contourPoints.length > 0) continue;
        contourPoints.push(new THREE.Vector2(x, y));
    }

    // UV-отображение
    const xWidth = R * Math.sin(a);
    const yHeight = (R / Math.cos(a)) + 1.25 * R;
    const Hight = xWidth;
    const Lmax = yHeight / 2;

    const toUV = (x, y) => {
        const u = 0.5 + x / (2 * Hight);
        const v = 0.5 + y / (2 * Lmax);
        return { u, v };
    };

    // Центральная точка листа (0,0)
    const centerIdx = vertices.length / 3;
    vertices.push(0, 0, 0);
    const centerUV = toUV(0, 0);
    uvs.push(centerUV.u, centerUV.v);

    // Добавление точек контура
    const pointIndices = [];
    for (let p of contourPoints) {
        pointIndices.push(vertices.length / 3);
        vertices.push(p.x, p.y, 0);
        const uv = toUV(p.x, p.y);
        uvs.push(uv.u, uv.v);
    }

    // Триангуляция (контур к центру)
    for (let i = 0; i < pointIndices.length - 1; i++) {
        indices.push(centerIdx, pointIndices[i], pointIndices[i+1]);
    }
    indices.push(centerIdx, pointIndices[pointIndices.length-1], pointIndices[0]);

    // ---- Хвост (часть стебля ниже контура) ----
    const overlap = 0.02 * R;
    const attachY = -R + overlap;
    const tailLen = tailLenFactor * R;
    const yTailBottom = attachY - tailLen;
    const stemWidth = 0.05 * R;
    const halfW = stemWidth / 2;

    const tailVerts = [
        -halfW, attachY, 0,
         halfW, attachY, 0,
         halfW, yTailBottom, 0,
        -halfW, yTailBottom, 0
    ];
    const tailStartIdx = vertices.length / 3;
    for (let i = 0; i < tailVerts.length; i += 3) {
        vertices.push(tailVerts[i], tailVerts[i+1], tailVerts[i+2]);
        const uv = toUV(tailVerts[i], tailVerts[i+1]);
        uvs.push(uv.u, uv.v);
    }
    indices.push(tailStartIdx, tailStartIdx+1, tailStartIdx+2);
    indices.push(tailStartIdx, tailStartIdx+2, tailStartIdx+3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}

// ---- Экспортируемые функции ----
export function createLeafGeometry() {
    const R = 1.0;
    const a = 1.0;
    const tailLength = 0.2;
    return createUnifiedLeafGeometry(R, a, tailLength);
}

export function createLeafMaterial() {
    const R = 1.0;
    const a = 1.0;
    const texture = createLeafTexture(R, a);

    const xWidth = R * Math.sin(a);
    const yHeight = (R / Math.cos(a)) + 1.25 * R;
    const Hight = xWidth;
    const Lmax = yHeight / 2;
    const halfHeight = yHeight / 2;

    const uniforms = {
        texturePosition: { value: null },
        textureRotation: { value: null },
        textureHinge: { value: null },
        textureParams: { value: null },
        gridSize: { value: 16 },
        map: { value: texture },
        Hight: { value: Hight },
        Lmax: { value: Lmax },
        angleV: { value: 0.2 },
        halfHeight: { value: halfHeight },
        lightDir: { value: new THREE.Vector3(0, 1, 0).normalize() },
        lightColor: { value: new THREE.Color(0xffffff) },
        ambientColor: { value: new THREE.Color(0xBBBBBB) }
    };

    // --- Шейдеры ---
    const vertexShader = `
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

        #define PI 3.1415926538

        // Функция изгиба (bend)
        vec2 bend(vec2 p, float a, float H, out vec2 dNew_dx, out vec2 dNew_dy) {
            if (abs(a) < 0.001) {
                dNew_dx = vec2(1.0, 0.0);
                dNew_dy = vec2(0.0, 1.0);
                return p;
            }
            float signA = sign(a);
            float absA = abs(a);
            float R = H / absA;
            float dx = (PI - absA) / PI;
            float dy = p.y / H;
            float r = R + p.x * dx;
            float C = cos(absA * dy);
            float S = sin(absA * dy);
            float newX = C * r - R;
            float newY = S * r;

            float dC_dy = -S * absA / H;
            float dS_dy =  C * absA / H;
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

            dNew_dx = vec2(dNewX_dx, dNewY_dx);
            dNew_dy = vec2(dNewX_dy, dNewY_dy);
            return vec2(newX, newY);
        }

        // Поворот кватернионом
        vec3 rotate(vec4 q, vec3 v) {
            return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
        }

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
            vec2 h = bend(p_h, angleH, Lmax, d_h_dx, d_h_dy);
            float x_h = h.x;
            float y_h = h.y;

            // Производные для нормали
            vec3 dPos_dz = vec3(0.0, d_h_dx.y, d_h_dx.x);
            vec3 dPos_dy = vec3(0.0, d_h_dy.y, d_h_dy.x);

            // ---- Вертикальный изгиб (вокруг оси X) ----
            vec2 p_v = vec2(localPos.x, y_h);
            vec2 d_v_dx, d_v_dy;
            vec2 v = bend(p_v, angleV, Lmax, d_v_dx, d_v_dy);
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
    `;

    const fragmentShader = `
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
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide
    });

    return material;
}