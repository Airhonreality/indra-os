/**
 * =============================================================================
 * HOOK: useTraceListener.js
 * RESPONSABILIDAD: Suscribe al bus de eventos global 'indra-trace' emitido
 *   por directive_executor.js en cada ciclo petición/respuesta al Core.
 *   Mantiene un historial de trazas en estado local y en localStorage para
 *   persistencia entre sesiones.
 *
 * AXIOMA DE SINCERIDAD:
 *   Este hook NO modifica los datos. Solo los captura y almacena. Es el
 *   "oído" del sistema: escucha sin interferir en el flujo de ejecución.
 *
 * ESTRUCTURA DE UNA TRAZA (IndraceTrace):
 * {
 *   traceId:       string    — ID único del ciclo (ej: "UQO[ATOM_CREATE]_abc123")
 *   protocol:      string    — Protocolo UQO ejecutado (ej: "ATOM_CREATE")
 *   provider:      string    — Provider destino (ej: "notion", "system")
 *   timestamp_out: number    — Epoch ms del momento de envío de la petición
 *   latency_ms:    number    — Tiempo total de ida y vuelta en ms
 *   result:        object    — El response completo del Core (items + metadata)
 *   uqo:           object    — El UQO que se envió (sin password)
 * }
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';

// Máximo de trazas a mantener en memoria para evitar crecimiento ilimitado
const MAX_TRACES = 200;

// Clave de persistencia en localStorage (por Axioma de Soberanía: clave namespaced)
const STORAGE_KEY = 'indra_trace_history_v1';

/**
 * Carga el historial de trazas de la sesión anterior desde localStorage.
 * Retorna array vacío si no existe o si el JSON está corrupto.
 * @returns {Array}
 */
function _loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Persiste el historial de trazas en localStorage.
 * Solo guarda los metadatos esenciales (sin items completos para ahorrar espacio).
 * @param {Array} traces
 */
function _saveToStorage(traces) {
    try {
        // Guardamos solo los últimos 50 para no llenar el localStorage
        const compact = traces.slice(0, 50).map(t => ({
            traceId:       t.traceId,
            protocol:      t.protocol,
            provider:      t.provider,
            timestamp_out: t.timestamp_out,
            latency_ms:    t.latency_ms,
            status:        t.result?.metadata?.status || 'UNKNOWN',
            // NO guardamos result completo: puede ser muy grande. Solo el summary.
            log_count:     (t.result?.metadata?.logs || []).length,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
        // localStorage lleno o bloqueado: silencio axiomático.
    }
}

/**
 * Hook principal.
 * @returns {{
 *   traces: IndraceTrace[],          — Lista de trazas (la más reciente primero)
 *   selectedTrace: IndraceTrace|null, — Traza actualmente inspeccionada
 *   setSelectedTrace: Function,       — Seleccionar una traza para inspeccionarla
 *   clearTraces: Function,            — Vaciar historial de sesión
 *   exportTraces: Function            — Descargar JSON de todas las trazas
 * }}
 */
export function useTraceListener() {
    const [traces, setTraces]               = useState(_loadFromStorage);
    const [selectedTrace, setSelectedTrace] = useState(null);

    useEffect(() => {
        /**
         * Handler del evento 'indra-trace'.
         * Se emite en directive_executor.js tras cada ciclo completo de red.
         * @param {CustomEvent} event
         */
        const handleTrace = (event) => {
            const trace = event.detail;
            if (!trace || !trace.traceId) return;

            setTraces(prev => {
                // Añadir al frente (más reciente primero) y limitar a MAX_TRACES
                const next = [trace, ...prev].slice(0, MAX_TRACES);
                _saveToStorage(next);
                return next;
            });
        };

        window.addEventListener('indra-trace', handleTrace);
        return () => window.removeEventListener('indra-trace', handleTrace);
    }, []);

    /**
     * Vacía el historial de trazas en memoria y en localStorage.
     */
    const clearTraces = useCallback(() => {
        setTraces([]);
        setSelectedTrace(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    /**
     * Exporta todas las trazas como un archivo JSON descargable.
     * Permite análisis retrospectivo sin depender de infraestructura externa.
     */
    const exportTraces = useCallback((currentTraces) => {
        const date = new Date().toISOString().split('T')[0];
        const filename = `indra_trace_${date}.json`;
        const json = JSON.stringify(currentTraces, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    return { traces, selectedTrace, setSelectedTrace, clearTraces, exportTraces };
}
