/**
 * =============================================================================
 * HOOK: useAEESession.js
 * RESPONSABILIDAD: Gestión del ciclo de vida de una sesión de ejecución AEE.
 * =============================================================================
 */

import { useState } from 'react';
import { directiveExecutor } from '../../../api/core/directive_executor';

export function useAEESession(atom) {
    const [formData, setFormData] = useState({});
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, EXECUTING, SUCCESS, ERROR
    const [error, setError] = useState(null);

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const executeLogic = async () => {
        if (status === 'EXECUTING') return;

        setStatus('EXECUTING');
        setError(null);

        try {
            // Buscamos el bridge asociado en los protocolos o metadatos del átomo
            // Por ahora, usamos un bridge_id genérico o el que venga en el átomo
            const bridgeId = atom.payload?.bridge_id;

            const response = await directiveExecutor.execute({
                provider: 'pipeline',
                protocol: 'LOGIC_EXECUTE',
                context_id: bridgeId,
                data: formData
            });

            if (response.metadata?.status === 'OK') {
                setResult(response.metadata?.result || response.items);
                setStatus('SUCCESS');
            } else {
                throw new Error(response.metadata?.error || 'Error en la ejecución lógica');
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
    };

    return {
        formData,
        updateField,
        result,
        status,
        error,
        executeLogic,
        reset
    };
}
