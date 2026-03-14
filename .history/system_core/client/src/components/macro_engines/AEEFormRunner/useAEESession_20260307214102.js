/**
 * =============================================================================
 * HOOK: useAEESession.js
 * RESPONSABILIDAD: Gestión del ciclo de vida de una sesión de ejecución AEE.
 * =============================================================================
 */

import { useState } from 'react';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';

export function useAEESession(atom) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);

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
            const bridgeId = atom.payload?.bridge_id || atom.metadata?.bridge_id;

            if (!bridgeId) {
                throw new Error('NO_BRIDGE_ASSOCIATED: El esquema no tiene un Logic Bridge vinculado para su ejecución.');
            }

            const response = await executeDirective({
                provider: 'pipeline',
                protocol: 'LOGIC_EXECUTE',
                context_id: bridgeId,
                payload: formData
            }, coreUrl, sessionSecret);

            if (response.metadata?.status === 'OK') {
                setResult(response.payload || response.items || response.metadata?.result);
                setStatus('SUCCESS');
            } else {
                throw new Error(response.metadata?.error || 'LOGIC_REJECTION: El Bridge ha rechazado la operación.');
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
