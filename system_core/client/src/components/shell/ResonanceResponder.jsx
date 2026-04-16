import React, { useEffect } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useLexicon } from '../../services/lexicon';
import { Spinner } from '../utilities/primitives/Spinner';

/**
 * ResonanceResponder (The Holy Bridge v1.0)
 * Responsabilidad: Responder a peticiones de resonancia de satélites externos.
 */
export const ResonanceResponder = () => {
    const { coreUrl, sessionSecret } = useProtocol();
    const t = useLexicon();

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.startsWith('#/resonate')) return;

        const params = new URLSearchParams(hash.split('?')[1]);
        const origin = params.get('origin');

        if (!origin) {
            console.error("[IndraResonance] Error: No origin provided.");
            return;
        }

        // AXIOMA DE SINCERIDAD: Solo respondemos si tenemos un secreto de sesión activo
        if (sessionSecret && coreUrl) {
            console.info(`[IndraResonance] Concediendo resonancia a: ${origin}`);
            
            const payload = {
                type: "INDRA_RESONANCE_GRANT",
                payload: {
                    core_url: coreUrl,
                    google_token: sessionSecret,
                    environment: 'PRODUCTION'
                }
            };

            // Enviamos el regalo a través del túnel postMessage
            if (window.opener) {
                window.opener.postMessage(payload, origin);
                
                // Cerramos el portal tras una breve pausa para efecto visual
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                console.warn("[IndraResonance] No se detectó ventana de origen (window.opener).");
            }
        }
    }, [coreUrl, sessionSecret]);

    return (
        <div className="fill center stack" style={{ 
            background: 'var(--color-bg-void)', 
            color: 'var(--color-accent)',
            height: '100vh',
            width: '100vw'
        }}>
            <Spinner size="80px" variant="rich" label="ESTABLECIENDO_RESONANCIA" />
            <p style={{ marginTop: '20px', fontSize: '10px', letterSpacing: '0.2em', opacity: 0.6 }}>
                {sessionSecret ? "CREDENCIDALES_DRIVE_DETECTADAS" : "ESPERANDO_AUTENTICACION_MADRE"}
            </p>
        </div>
    );
};
