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
                        // Разница напоров (уклон по напору)
                        const headDiff = totalHead - minHead;
                        if (headDiff <= 2.5) continue;

                        // Ограничиваем уклон, чтобы избежать численных проблем
                        let slope = headDiff;
                        const MAX_SLOPE = 0.5;
                        if (slope > MAX_SLOPE) slope = MAX_SLOPE;

                        let flow = Math.min(w, slope * this.waterCapacity);
                        if (flow > 0) {
                            const ratio = flow / w; // доля перемещаемой воды

                            // Эрозия (смыв грунта) – используем уклон по напору
                            let erosion = flow * slope * this.erosionRate;
                            if (erosion > h) erosion = h;

                            // Осаждение наносов из воды в текущей ячейке
                            const deposit = s * this.depositionRate;

                            // Изменяем высоты
                            newHeight[idx] -= erosion;
                            newHeight[minIdx] += deposit;

                            // Обновляем воду и наносы в текущей ячейке
                            s += erosion;
                            s -= deposit;
                            w -= flow;

                            // Пропорциональный перенос наносов в соседнюю ячейку
                            const transportedSediment = s * ratio;
                            sediment[minIdx] += transportedSediment;
                            sediment[idx] = s - transportedSediment;

                            // Перенос воды
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