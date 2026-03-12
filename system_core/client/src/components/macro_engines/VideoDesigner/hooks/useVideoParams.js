import { useState, useEffect } from 'react';

/**
 * =============================================================================
 * HOOK PARAMÉTRICO: useVideoParams
 * RESPONSABILIDAD: Puente de conversión bidireccional entre la UI humana (SMPTE)
 * y el motor agnóstico (milisegundos puros).
 * AXIOMA: Mantiene la unidad de Tiempo Absoluta (Timebase) en MS.
 * =============================================================================
 */

// Format: HH:MM:SS:FF (Fps asumido: 30 para simplificar)
const FPS = 30;

export function useVideoParams(initialMs, onChangeMs) {
    const [localValue, setLocalValue] = useState('');

    useEffect(() => {
        setLocalValue(msToSMPTE(initialMs));
    }, [initialMs]);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);

        // Validación en tiempo real (Permitimos escritura parcial pero solo comiteamos en onBlur)
    };

    const handleBlur = () => {
        const parsedMs = SMPTEToMs(localValue);

        // Si es inválido, revertir. Si no, notificar al ancestro.
        if (isNaN(parsedMs)) {
            setLocalValue(msToSMPTE(initialMs));
        } else {
            setLocalValue(msToSMPTE(parsedMs)); // Auto-formatea para corregir ceros faltantes
            if (parsedMs !== initialMs && onChangeMs) {
                onChangeMs(parsedMs);
            }
        }
    };

    return {
        value: localValue,
        onChange: handleChange,
        onBlur: handleBlur
    };
}

// ─── HELPERS DE TIEMPO (Puros y Agnósticos) ───

export const msToSMPTE = (ms) => {
    if (typeof ms !== 'number' || isNaN(ms)) return "00:00:00:00";

    const frames = Math.floor((ms % 1000) * FPS / 1000);
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
        frames.toString().padStart(2, '0')
    ].join(':');
};

export const SMPTEToMs = (smpte) => {
    if (!smpte) return 0;
    const parts = smpte.split(':').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return NaN; // Falla controlada (Sinceridad de Validacion)

    const [hours, minutes, seconds, frames] = parts;

    const baseMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    const framesMs = Math.floor((frames / FPS) * 1000);

    return baseMs + framesMs;
};
