import React, { useEffect, useState } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { Spinner } from '../utilities/primitives/Spinner';
import { IndraIcon } from '../utilities/IndraIcons';
import { CoreConnectionView } from './CoreConnectionView';

/**
 * ResonanceResponder (Agnostic Sovereign Gateway)
 * Responsabilidad: Responder a peticiones de resonancia de satélites externos con Jurisdicción Explícita.
 */
export const ResonanceResponder = () => {
    // ProtocolContext is likely deprecated globally in favor of useAppState, but we check both.
    const { sessionSecret: protocolSecret, bootstrap } = useProtocol();
    const appCoreUrl = useAppState(s => s.coreUrl);
    const appSecret = useAppState(s => s.sessionSecret);
    const setCoreUrl = useAppState(s => s.setCoreUrl);
    const t = useLexicon();

    const [origin, setOrigin] = useState(null);
    const [granted, setGranted] = useState(false);
    const [showConnector, setShowConnector] = useState(false);
    
    const activeUrl = appCoreUrl || '';
    const activeSecret = appSecret || protocolSecret;

    // 1. CHISPA VITAL: Despertar la base de datos
    useEffect(() => {
        bootstrap();
        
        const hash = window.location.hash;
        if (hash.startsWith('#/resonate')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const o = params.get('origin');
            if (o) setOrigin(o);
        }
    }, [bootstrap]);

    // 2. CONCEDER RESONANCIA DE FORMA EXPLÍCITA
    const handleGrantResonance = () => {
        if (!activeSecret || !activeUrl) {
            setShowConnector(true);
            return;
        }

        setGranted(true);
        console.info(`[IndraResonance] Concediendo resonancia soberana a: ${origin}`);
        
        const payload = {
            type: "INDRA_RESONANCE_GRANT",
            payload: {
                core_url: activeUrl,
                google_token: activeSecret,
                environment: 'PRODUCTION'
            }
        };

        if (window.opener) {
            window.opener.postMessage(payload, origin);
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            console.warn("[IndraResonance] No se detectó ventana de origen (window.opener).");
        }
    };

    if (!origin) {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'var(--color-accent)', height: '100vh', width: '100vw' }}>
                <Spinner size="40px" variant="rich" label="ESPERANDO_PETICIÓN" />
            </div>
        );
    }

    if (granted) {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'var(--color-accent)', height: '100vh', width: '100vw' }}>
                <IndraIcon name="SUCCESS" size="60px" style={{ marginBottom: '20px', color: 'var(--color-success)' }} />
                <div style={{ fontSize: '14px', letterSpacing: '0.2em', color: 'var(--color-success)' }}>
                    RESONANCIA CONCEDIDA
                </div>
                <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '10px' }}>Volviendo al Satélite...</p>
            </div>
        );
    }

    if (showConnector || (!activeSecret && !activeUrl)) {
        return (
            <div style={{ background: 'var(--color-bg-void)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '20px' }}>
                        IDENTIDAD REQUERIDA PARA <b>{origin}</b>
                    </p>
                    <CoreConnectionView onConnected={handleGrantResonance} />
                </div>
            </div>
        );
    }

    return (
        <div className="fill center stack" style={{ 
            background: 'var(--color-bg-void)', 
            color: 'var(--color-text-primary)',
            height: '100vh',
            width: '100vw',
            padding: '40px',
            boxSizing: 'border-box'
        }}>
            <IndraIcon name="CONNECTION" size="60px" style={{ marginBottom: '20px', color: 'var(--color-accent)', filter: 'drop-shadow(0 0 20px rgba(123, 47, 247, 0.4))' }} />
            
            <h2 style={{ fontFamily: 'Syncopate, sans-serif', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '30px', textAlign: 'center' }}>
                PETICIÓN DE RESONANCIA
            </h2>

            <div style={{ 
                background: 'rgba(255,255,255, 0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '24px', 
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                <div>
                    <label style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.1em' }}>SATÉLITE SOLICITANTE</label>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--color-accent)' }}>{origin}</div>
                </div>

                <div>
                    <label style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.1em' }}>NAVE NODRIZA (GAS CORE)</label>
                    <input 
                        type="text" 
                        value={activeUrl}
                        onChange={(e) => setCoreUrl(e.target.value)}
                        style={{ 
                            width: '100%', padding: '10px', marginTop: '4px',
                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(123,47,247,0.3)',
                            color: 'var(--color-text-primary)', borderRadius: '6px', fontSize: '12px'
                        }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.1em' }}>ESTADO DE IDENTIDAD</label>
                    <div style={{ fontSize: '12px', color: activeSecret ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {activeSecret ? '✓ Credenciales Soberanas Activas' : '✗ Autenticación Requerida'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '30px' }}>
                <button 
                    onClick={() => setShowConnector(true)}
                    style={{ 
                        padding: '12px 24px', background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                        borderRadius: '8px', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em'
                    }}
                >
                    CAMBIAR IDENTIDAD
                </button>
                <button 
                    onClick={handleGrantResonance}
                    disabled={!activeSecret}
                    style={{ 
                        padding: '12px 24px', background: 'var(--color-accent)',
                        border: 'none', color: 'white',
                        borderRadius: '8px', cursor: activeSecret ? 'pointer' : 'not-allowed', 
                        fontSize: '12px', letterSpacing: '0.1em', fontWeight: 'bold',
                        opacity: activeSecret ? 1 : 0.4
                    }}
                >
                    CONCEDER RESONANCIA
                </button>
            </div>
        </div>
    );
};
