/**
 * Módulo: TimeTransformer
 * Dharma: La Maquinaria del Tiempo. Transforma el tiempo global (Timeline) en tiempo local (Media).
 * 
 * AXIOMA DE INVESTIGACIÓN: T_media(T_timeline) = integral(v(tau) dtau)
 * Este módulo resuelve la relación no lineal entre la cinta y el objeto.
 */
export class TimeTransformer {
    constructor() {
        this.keyframes = []; // [{ timeMs, value, easing }]
        this.cache = new Map(); // Para optimizar cálculos frecuentes
    }

    /**
     * Sincroniza la función de velocidad con los keyframes del clip.
     */
    setKeyframes(keyframes) {
        this.keyframes = [...keyframes].sort((a, b) => a.timeMs - b.timeMs);
        this.cache.clear();
    }

    /**
     * LEY DE RELATIVIDAD: Obtener la velocidad instantánea en un punto.
     */
    getVelocityAt(localTimelineMs) {
        if (this.keyframes.length === 0) return 1.0;
        
        // Si el tiempo es menor al primer keyframe
        if (localTimelineMs <= this.keyframes[0].timeMs) {
            return this.keyframes[0].value;
        }

        // Si el tiempo es mayor al último keyframe
        if (localTimelineMs >= this.keyframes[this.keyframes.length - 1].timeMs) {
            return this.keyframes[this.keyframes.length - 1].value;
        }

        // Búsqueda del segmento
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            const kf1 = this.keyframes[i];
            const kf2 = this.keyframes[i + 1];

            if (localTimelineMs >= kf1.timeMs && localTimelineMs < kf2.timeMs) {
                const t = (localTimelineMs - kf1.timeMs) / (kf2.timeMs - kf1.timeMs);
                
                if (kf1.easing === 'step') return kf1.value;
                if (kf1.easing === 'linear') {
                    return kf1.value + (kf2.value - kf1.value) * t;
                }
                
                if (kf1.easing === 'bezier') {
                    // AXIOMA DE BÉZIER: Interpolación cúbica para rampas orgánicas.
                    // Usamos una curva Standard Ease-In-Out (0.42, 0, 0.58, 1)
                    // Polinomio: (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
                    const easeT = t * t * (3 - 2 * t); // Aproximación Hermite (Smoothstep)
                    // Para un control total industrial, resolveríamos t -> x vía Newton-Raphson, 
                    // pero para la velocidad v(t), el smoothstep es una base matemática excelente
                    // que garantiza continuidad de la aceleración (C1 continuity).
                    return kf1.value + (kf2.value - kf1.value) * easeT;
                }
            }
        }

        return 1.0;
    }

    /**
     * EL CÁLCULO SINCERO: Resuelve la integral de la velocidad para obtener el MediaTime.
     * Implementa Integración Numérica (Regla del Trapecio) para precisión industrial.
     */
    getMediaTimeAt(localTimelineMs) {
        if (this.keyframes.length === 0) return localTimelineMs;

        // Intentar recuperar del cache para evitar integración redundante
        const cacheKey = Math.floor(localTimelineMs / 10) * 10; // Resolución de 10ms
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        let integratedTime = 0;
        const step = 10; // Paso de integración en ms (Balance entre CPU y Precisión)

        // Integramos desde t=0 hasta localTimelineMs
        for (let t = 0; t < localTimelineMs; t += step) {
            const v1 = this.getVelocityAt(t);
            const v2 = this.getVelocityAt(Math.min(t + step, localTimelineMs));
            
            // Regla del Trapecio: Area = (v1 + v2) / 2 * dt
            const dt = Math.min(step, localTimelineMs - t);
            integratedTime += ((v1 + v2) / 2) * dt;
        }

        this.cache.set(cacheKey, integratedTime);
        return integratedTime;
    }

    /**
     * LEY DE INVERSIÓN: Aplica el modo espejo si está activo.
     */
    applyReverse(mediaTimeMs, isActive, totalDurationMs) {
        if (!isActive) return mediaTimeMs;
        // En reversa, el tiempo se cuenta desde el final hacia atrás
        return Math.max(0, totalDurationMs - mediaTimeMs);
    }
}
