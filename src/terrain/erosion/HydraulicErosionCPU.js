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
            // 1. Копируем текущие высоты
            for (let i = 0; i < size; i++) newHeight[i] = this.heightData[i];

            // 2. Осадки
            for (let i = 0; i < size; i++) water[i] += this.rainAmount;

            // 3. Поток, эрозия, осаждение
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = x + y * width;
                    let h = this.heightData[idx];
                    let w = water[idx];
                    let s = sediment[idx];
                    if (w <= 0) continue;

                    // Полный напор в текущей ячейке
                    const totalHead = h + w;
                    let minHead = totalHead;
                    let minIdx = idx;

                    // Сосед слева
                    if (x > 0) {
                        const nIdx = (x - 1) + y * width;
                        const nh = this.heightData[nIdx];
                        const nw = water[nIdx];
                        const nHead = nh + nw;
                        if (nHead < minHead) {
                            minHead = nHead;
                            minIdx = nIdx;
                        }
                    }
                    // Сосед справа
                    if (x < width - 1) {
                        const nIdx = (x + 1) + y * width;
                        const nh = this.heightData[nIdx];
                        const nw = water[nIdx];
                        const nHead = nh + nw;
                        if (nHead < minHead) {
                            minHead = nHead;
                            minIdx = nIdx;
                        }
                    }
                    // Сосед сверху
                    if (y > 0) {
                        const nIdx = x + (y - 1) * width;
                        const nh = this.heightData[nIdx];
                        const nw = water[nIdx];
                        const nHead = nh + nw;
                        if (nHead < minHead) {
                            minHead = nHead;
                            minIdx = nIdx;
                        }
                    }
                    // Сосед снизу
                    if (y < height - 1) {
                        const nIdx = x + (y + 1) * width;
                        const nh = this.heightData[nIdx];
                        const nw = water[nIdx];
                        const nHead = nh + nw;
                        if (nHead < minHead) {
                            minHead = nHead;
                            minIdx = nIdx;
                        }
                    }

                    if (minIdx !== idx) {
                        // Разность напоров
                        const headDiff = totalHead - minHead;
                        if (headDiff <= 1) continue;

                        // Реальный уклон с учётом расстояния между ячейками (step)
                        let slope = headDiff / this.step;
                        const MAX_SLOPE = slope;
                        if (slope > MAX_SLOPE) slope = MAX_SLOPE;

                        // Доля воды и наносов, перетекающая за одну итерацию (от 0 до 1)
                        let ratio = Math.min(1.0, slope * this.waterCapacity);
                        if (ratio > 0) {
                            const flow = w * ratio;          // количество воды, которое уходит

                            // Эрозия (смыв грунта)
                            let erosion = flow * slope * this.erosionRate;
                            if (erosion > h) erosion = h;    // не больше, чем есть грунта

                            // Осаждение наносов в текущей ячейке
                            const deposit = s * this.depositionRate;

                            // Обновляем высоты (во временном массиве)
                            newHeight[idx] -= erosion;
                            newHeight[minIdx] += deposit;

                            // Обновляем наносы и воду в текущей ячейке
                            s += erosion;
                            s -= deposit;
                            w -= flow;

                            // Пропорциональный перенос наносов (та же доля ratio)
                            const transportedSediment = s * ratio;
                            sediment[minIdx] += transportedSediment;
                            sediment[idx] = s - transportedSediment;

                            // Перенос воды в соседнюю ячейку
                            water[minIdx] += flow;
                            water[idx] = w;
                        }
                    }
                }
            }

            // 4. Испарение с осаждением (если вода испарилась полностью)
            for (let i = 0; i < size; i++) {
                let w = water[i];
                let s = sediment[i];
                if (w > 0) {
                    w -= this.evaporation;
                    if (w <= 0) {
                        // Вода кончилась – наносы оседают в этой ячейке
                        newHeight[i] += s;
                        s = 0;
                        w = 0;
                    }
                    water[i] = w;
                    sediment[i] = s;
                }
            }

            // 5. Применяем обновлённые высоты
            for (let i = 0; i < size; i++) this.heightData[i] = newHeight[i];
        }

        // 6. Финальное осаждение оставшихся наносов (если вдруг вода не испарилась)
        for (let i = 0; i < size; i++) {
            if (sediment[i] > 0) {
                this.heightData[i] += sediment[i];
            }
        }
    }

    getResult() {
        return this.heightData;
    }
}