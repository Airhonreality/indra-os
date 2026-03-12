/**
 * =============================================================================
 * HOOK: useVault.js
 * RESPONSABILIDAD: Gestión de credenciales y sincronización de servicios (Vault).
 * =============================================================================
 */

import { useState } from 'react';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';

export function useVault() {
    const services = useAppState(s => s.services);
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const hydrateManifest = useAppState(s => s.hydrateManifest);

    const [pairingStatus, setPairingStatus] = useState('IDLE'); // IDLE, PAIRING, SUCCESS, ERROR
    const [pairingError, setPairingError] = useState(null);

    /**
     * Sincroniza una credencial con el Vault del GAS.
     */
    const pairService = async (serviceId, credentials) => {
        setPairingStatus('PAIRING');
        setPairingError(null);

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SERVICE_PAIR',
                payload: {
                    id: serviceId,
                    secrets: credentials // El backend cifra esto en la Bóveda (Vault)
                }
            }, coreUrl, sessionSecret);

            if (result.metadata?.status === 'OK') {
                setPairingStatus('SUCCESS');
                // Re-hidratamos el manifiesto para ver el cambio de estado
                await hydrateManifest();
            } else {
                throw new Error(result.metadata?.error || 'LOGIC_FAILED: El Vault rechazó la credencial.');
            }
        } catch (err) {
            console.error('[Vault] Pairing failed:', err);
            setPairingError(err.message);
            setPairingStatus('ERROR');
        }
    };

    /**
     * Elimina el vínculo de un servicio.
     */
    const unpairService = async (serviceId) => {
        try {
            await executeDirective({
                provider: 'system',
                protocol: 'SERVICE_UNPAIR',
                payload: { id: serviceId }
            }, coreUrl, sessionSecret);
            await hydrateManifest();
        } catch (err) {
            console.error('[Vault] Unpairing failed:', err);
        }
    };

    return {
        services,
        pairingStatus,
        pairingError,
        pairService,
        unpairService,
        setPairingStatus
    };
}
