/**
 * =============================================================================
 * ParameterAutomator (Agnostic Service)
 * RESPONSABILIDAD: Motor de interpolación de parámetros en el tiempo.
 * AXIOMA: Independencia total. No conoce el motor de video ni el audio.
 * Dharma: Sinceridad Matemática.
 * =============================================================================
 */

export class ParameterAutomator {
    constructor() {
        this.keyframes = []; // Array de { timeMs, value, easing: 'linear' | 'step' | 'bezier' }
    }

    /**
     * Añade o actualiza un punto de automatización.
     */
    addKeyframe(timeMs, value, easing = 'linear') {
        const index = this.keyframes.findIndex(k => k.timeMs === timeMs);
        const kf = { timeMs, value, easing };
        
        if (index !== -1) {
            this.keyframes[index] = kf;
        } else {
            this.keyframes.push(kf);
            this.keyframes.sort((a, b) => a.timeMs - b.timeMs);
        }
    }

    /**
     * Retorna el valor calculado para un tiempo específico.
     * Utiliza algoritmos de búsqueda binaria para eficiencia O(log n).
     */
    getValueAt(timeMs) {
        if (this.keyframes.length === 0) return 0;
        if (timeMs <= this.keyframes[0].timeMs) return this.keyframes[0].value;
        if (timeMs >= this.keyframes[this.keyframes.length - 1].timeMs) {
            return this.keyframes[this.keyframes.length - 1].value;
        }

        // Búsqueda del segmento
        let left = 0;
        let right = this.keyframes.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.keyframes[mid].timeMs <= timeMs) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        const k0 = this.keyframes[right];
        const k1 = this.keyframes[left];

        if (k0.easing === 'step') return k0.value;

        // Interpolación Lineal
        const t = (timeMs - k0.timeMs) / (k1.timeMs - k0.timeMs);
        
        if (k0.easing === 'linear') {
            return k0.value + (k1.value - k0.value) * t;
        }

        if (k0.easing === 'bezier') {
            const easeT = t * t * (3 - 2 * t);
            return k0.value + (k1.value - k0.value) * easeT;
        }

        return k0.value + (k1.value - k0.value) * t;
    }

    /**
     * Serializa para persistencia sincera.
     */
    serialize() {
        return [...this.keyframes];
    }

    deserialize(data) {
        this.keyframes = Array.isArray(data) ? data : [];
        this.keyframes.sort((a, b) => a.timeMs - b.timeMs);
    }
}
