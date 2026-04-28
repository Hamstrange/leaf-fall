// newLeafModel.js
import * as THREE from 'three';
import vertexShaderCode from './shaders/leafDeformation.vert.glsl?raw';
import fragmentShaderCode from './shaders/leafLighting.frag.glsl?raw';

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

        // Генерируем независимые смещения для левой и правой жилки
        const offsetL = (Math.random() * 2 - 1) * maxOffset;
        const offsetR = (Math.random() * 2 - 1) * maxOffset;

        let yL = baseY + offsetL;
        let yR = baseY + offsetR;
        yL = Math.max(minY, Math.min(maxY, yL));
        yR = Math.max(minY, Math.min(maxY, yR));

        // Вычисление конечной точки для заданной y (Vx, Vy)
        const computeV = (y) => {
            if (y < 0) {
                const d = -y * cosA + Math.sqrt(Math.max(0, R * R - y * y * sinA * sinA));
                const Vx = sinA * k * d;
                const Vy = y + verticalFactor * cosA * k * d;
                return { Vx, Vy };
            } else {
                const factor = k * R * (Ytop - y) / Ytop;
                const Vx = sinA * factor;
                const Vy = y + verticalFactor * cosA * factor;
                return { Vx, Vy };
            }
        };

        const left = computeV(yL);
        const right = computeV(yR);

        // Левая жилка (из точки (0, yL) в (-left.Vx, left.Vy))
        const leftStart = toUV(0, yL);
        const leftEnd = toUV(-left.Vx, left.Vy);
        ctx.beginPath();
        ctx.moveTo(leftStart.u * canvas.width, (1 - leftStart.v) * canvas.height);
        ctx.lineTo(leftEnd.u * canvas.width, (1 - leftEnd.v) * canvas.height);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#113711ff';
        ctx.stroke();

        // Правая жилка (из точки (0, yR) в (right.Vx, right.Vy))
        const rightStart = toUV(0, yR);
        const rightEnd = toUV(right.Vx, right.Vy);
        ctx.beginPath();
        ctx.moveTo(rightStart.u * canvas.width, (1 - rightStart.v) * canvas.height);
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

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShaderCode,
        fragmentShader: fragmentShaderCode,
        side: THREE.DoubleSide
    });

    return material;
}