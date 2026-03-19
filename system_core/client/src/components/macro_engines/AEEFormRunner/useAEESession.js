/**
 * =============================================================================
 * HOOK: useAEESession.js
 * RESPONSABILIDAD: Gestión del ciclo de vida de una sesión de ejecución AEE.
 *
 * AXIOMA DE LECTURA:
 *   El AEE es un atlas que referencia a un Schema y un Bridge.
 *   - atom.payload.schema_id → ID del Schema que proyecta los campos.
 *   - atom.payload.bridge_id → ID del Bridge que ejecuta la lógica.
 *   Si no están presentes, el AEE queda en modo CONFIG hasta que se configuren.
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';
import { DataProjector } from '../../../services/DataProjector';

export function useAEESession(atom) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const pins = useAppState(s => s.pins);

    const [resolvedSchema, setResolvedSchema] = useState(null);
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);

    const [formData, setFormData] = useState({});
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING_SCHEMA, EXECUTING, SUCCESS, ERROR
    const [error, setError] = useState(null);

    const schemaId = atom?.payload?.schema_id;
    // Compatibilidad: executor_id (nuevo) o bridge_id (legacy)
    const executorId = atom?.payload?.executor_id || atom?.payload?.bridge_id;
    const executorType = atom?.payload?.executor_type || 'BRIDGE';

    // ── RESOLUCIÓN DEL SCHEMA VINCULADO ──
    // Si el AEE tiene un schema_id en su payload, lo hidrata desde el Core o los pins en cache.
    useEffect(() => {
        if (!schemaId) {
            setResolvedSchema(null);
            return;
        }

        // Primero buscar en los pins locales (evita round-trip al Core)
        const cachedPin = pins.find(p => p.id === schemaId);

        const hydrateSchema = async () => {
            setIsLoadingSchema(true);
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_READ',
                    context_id: schemaId
                }, coreUrl, sessionSecret);

                const fullSchema = result.items?.[0];
                if (fullSchema) {
                    setResolvedSchema(fullSchema);
                } else {
                    setError('SCHEMA_NOT_FOUND: El Schema configurado no existe en el Core.');
                }
            } catch (err) {
                setError(`SCHEMA_LOAD_FAILED: ${err.message}`);
            } finally {
                setIsLoadingSchema(false);
            }
        };

        // Si tenemos el pin cacheado con payload, usarlo. Si no, ir al Core.
        if (cachedPin?.payload?.fields) {
            setResolvedSchema(cachedPin);
        } else {
            hydrateSchema();
        }
    }, [schemaId, coreUrl, sessionSecret]);

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const executeLogic = async () => {
        if (status === 'EXECUTING') return;
        if (!executorId) {
            setError('NO_EXECUTOR_CONFIGURED: Este ejecutor no tiene un Bridge ni Workflow vinculado.');
            setStatus('ERROR');
            return;
        }

        setStatus('EXECUTING');
        setError(null);

        try {
            // AXIOMA: El AEE no sabe qué hace el ejecutor.
            // Solo sabe el protocolo que corresponde a su tipo.
            const protocol = executorType === 'WORKFLOW' ? 'WORKFLOW_EXECUTE' : 'LOGIC_EXECUTE';
            const provider = executorType === 'WORKFLOW' ? 'system' : 'pipeline';

            const response = await executeDirective({
                provider,
                protocol,
                context_id: executorId,
                payload: formData
            }, coreUrl, sessionSecret);

            if (response.metadata?.status === 'OK') {
                setResult(response.payload || response.items || response.metadata?.result);
                setStatus('SUCCESS');
            } else {
                throw new Error(response.metadata?.error || 'EXECUTOR_REJECTION: El ejecutor ha rechazado la operación.');
            }
        } catch (err) {
            console.error('[AEE_SESSION_ERROR]', err);
            setError(err.message);
            setStatus('ERROR');
        }
    };

    const reset = () => {
        setResult(null);
        setStatus('IDLE');
        setError(null);
        setFormData({});
    };

    // El schema que proyecta el formulario: usa el schema resuelto si existe,
    // si no, usa el atom mismo (compatibilidad legacy con AEE que apuntaban a DATA_SCHEMA directamente).
    const effectiveSchema = resolvedSchema || (atom?.class === 'DATA_SCHEMA' ? atom : null);

    return {
        effectiveSchema,
        isLoadingSchema,
        formData,
        updateField,
        result,
        status,
        error,
        executeLogic,
        reset
    };
}
