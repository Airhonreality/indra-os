/**
 * =============================================================================
 * MOTOR: DiagnosticHub (IDH)
 * RESPONSABILIDAD: Orquestador del motor de diagnóstico y observabilidad.
 *
 * DOGMA INDRA:
 *   "Toda acción deja una huella. Toda huella es observable." (Axioma de Sinceridad)
 * =============================================================================
 */

import { PulseRoster } from './PulseRoster';
import { UQOEditor } from './UQOEditor';
import { TraceInspector } from './TraceInspector';
import { useTraceListener } from './useTraceListener';
import './DiagnosticHub.css';

/**
 * DiagnosticHub Engine
 * Implementa el Layout Tripartito Estándar (Col I: Historial | Col II: Acción | Col III: Inspección)
 */
export function DiagnosticHub({ artifact }) {
    const { 
        traces, 
        selectedTrace, 
        setSelectedTrace, 
        clearTraces, 
        exportTraces 
    } = useTraceListener();

    return (
        <div className="diagnostic-hub indra-engine-viewport">
            {/* El CSS .diagnostic-hub usa grid-template-columns: 280px 1fr 340px */}
            
            {/* Columna I: Monitoreo Habitual */}
            <PulseRoster 
                traces={traces}
                selectedTrace={selectedTrace}
                onSelect={setSelectedTrace}
                onClear={clearTraces}
                onExport={() => exportTraces(traces)}
            />

            {/* Columna II: Reality Console (Punto de Inyección) */}
            <UQOEditor />

            {/* Columna III: Trace Inspector (Desglose Técnico) */}
            <TraceInspector trace={selectedTrace} />
        </div>
    );
}
