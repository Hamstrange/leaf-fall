// src/terrain/noise.js
import { createNoise2D } from 'simplex-noise';

export function generateHeightmap(width, depth, options = {}) {
    const {
        scale = 0.02,
        amplitude = 15,
        octaves = 4,
        persistence = 0.5,
        lacunarity = 2.0
    } = options;

    const noise2D = createNoise2D();
    const heights = new Float32Array(width * depth);

    for (let i = 0; i < width; i++) {
        for (let j = 0; j < depth; j++) {
            let x = i * scale;
            let z = j * scale;
            let value = 0;
            let freq = 1;
            let amp = amplitude;

            for (let o = 0; o < octaves; o++) {
                value += noise2D(x * freq, z * freq) * amp;
                freq *= lacunarity;
                amp *= persistence;
            }
            heights[i + j * width] = value;
        }
    }
    return heights;
}

export function applyHeightmap(geometry, heights) {
    const positions = geometry.attributes.position.array;
    const widthSegments = geometry.parameters.widthSegments;
    const heightSegments = geometry.parameters.heightSegments;
    const width = widthSegments + 1;
    const height = heightSegments + 1;

    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const idx = i + j * width;
            const posIdx = idx * 3;
            positions[posIdx + 1] = heights[idx];
        }
    }
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
}