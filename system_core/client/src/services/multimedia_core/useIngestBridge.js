import { useEffect } from 'react';
import { IngestBridge } from '../IngestBridge';
import { useAppState } from '../../state/app_state';

/**
 * useIngestBridge - El Puente Universal (MCEP Protocol)
 * 
 * Wrapper React para el IngestBridge Singleton (ADR-041).
 * Su única funcionalidad ahora es interceptar conexiones desde dentro de React
 * para sincronizar o exponer el Singleton subyacente.
 */
export function useIngestBridge(bridge = null) {
    const coreUrlFromState = useAppState(s => s.coreUrl);
    const secretFromState = useAppState(s => s.sessionSecret);

    useEffect(() => {
        // Oportunidad de inicialización desde React si no ha sido antes
        if (bridge) {
            IngestBridge.init({ mode: 'NATIVE', bridgeInstance: bridge });
        } else if (coreUrlFromState && secretFromState) {
            IngestBridge.init({ mode: 'SATELLITE', coreUrl: coreUrlFromState, satelliteToken: secretFromState });
        }
    }, [bridge, coreUrlFromState, secretFromState]);

    return IngestBridge.getBridge();
}
