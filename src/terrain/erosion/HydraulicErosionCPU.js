// src/terrain/erosion/HydraulicErosionCPU.js
export class HydraulicErosionCPU {
    constructor(heightData, width, height, options = {}) {
        this.heightData = heightData.slice(); // копия
        this.width = width;
        this.height = height;
        this.iterations = options.iterations || 30;
        this.rainAmount = options.rainAmount ?? 0.01;
        this.evaporation = options.evaporation ?? 0.005;
        this.erosionRate = options.erosionRate ?? 0.02;
        this.depositionRate = options.depositionRate ?? 0.01;
        this.waterCapacity = options.waterCapacity ?? 1.0;
    }

    run() {
        const width = this.width;
        const height = this.height;
        const size = width * height;
        let water = new Float32Array(size);
        let sediment = new Float32Array(size);
        let newHeight = new Float32Array(size);

        for (let iter = 0; iter < this.iterations; iter++) {
            // Копируем текущие высоты
            for (let i = 0; i < size; i++) newHeight[i] = this.heightData[i];

            // Осадки
            for (let i = 0; i < size; i++) water[i] += this.rainAmount;

            // Поток, эрозия, осаждение
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = x + y * width;
                    let h = this.heightData[idx];
                    let w = water[idx];
                    let s = sediment[idx];

                    if (w <= 0) continue;

                    // Поиск соседа с минимальной высотой (4 направления)
                    let minH = h;
                    let minIdx = idx;
                    // Сосед слева
                    if (x > 0) {
                        const nIdx = (x - 1) + y * width;
                        const nh = this.heightData[nIdx];
                        if (nh < minH) { minH = nh; minIdx = nIdx; }
                    }
                    // Сосед справа
                    if (x < width - 1) {
                        const nIdx = (x + 1) + y * width;
                        const nh = this.heightData[nIdx];
                        if (nh < minH) { minH = nh; minIdx = nIdx; }
                    }
                    // Сосед сверху
                    if (y > 0) {
                        const nIdx = x + (y - 1) * width;
                        const nh = this.heightData[nIdx];
                        if (nh < minH) { minH = nh; minIdx = nIdx; }
                    }
                    // Сосед снизу
                    if (y < height - 1) {
                        const nIdx = x + (y + 1) * width;
                        const nh = this.heightData[nIdx];
                        if (nh < minH) { minH = nh; minIdx = nIdx; }
                    }

                    if (minIdx !== idx) {
                        const slope = h - minH;
                        let flow = Math.min(w, slope * this.waterCapacity);
                        if (flow > 0) {
                            const ratio = flow / w;   // доля воды, которая уходит
                            const erosion = Math.min(flow * slope * this.erosionRate, h);
                            const deposit = s * this.depositionRate;

                            // Изменяем высоты
                            newHeight[idx] -= erosion;
                            newHeight[minIdx] += deposit;

                            // Обновляем наносы и воду в текущей ячейке
                            s += erosion;          // наносы от эрозии
                            s -= deposit;          // минус то, что осело
                            w -= flow;             // минус ушедшая вода

                            // Переносим пропорциональную долю наносов в соседа
                            const transportedSediment = s * ratio;
                            sediment[minIdx] += transportedSediment;
                            sediment[idx] = s - transportedSediment;   // оставляем остаток

                            // Переносим воду
                            water[minIdx] += flow;
                            water[idx] = w;
                        }
                    }
                }
            }

            // Испарение
            for (let i = 0; i < size; i++) {
                water[i] -= this.evaporation;
                if (water[i] < 0) water[i] = 0;
            }

            // Применяем изменения
            for (let i = 0; i < size; i++) this.heightData[i] = newHeight[i];
        }
    }

    getResult() {
        return this.heightData;
    }
}