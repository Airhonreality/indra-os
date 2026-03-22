import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { useShell } from '../../context/ShellContext';
import { useAppState } from '../../state/app_state';
import { Spinner } from '../utilities/primitives/Spinner';
import { IndraIcon } from '../utilities/IndraIcons';

/**
 * ManifestResolver
 * Proyector Micelar de Indra (ADR-019).
 * Resuelve un Capability Link (u + id) y materializa el artefacto.
 */
export const ManifestResolver = () => {
    const { setCoreConnection } = useProtocol();
    const { openArtifact } = useAppState();
    const [status, setStatus] = useState('RESOLVING'); // RESOLVING | AUTH_REQUIRED | ERROR | SUCCESS
    const [errorMsg, setErrorMsg] = useState('');
    const [manualUrl, setManualUrl] = useState('');

    const urlParams = new URLSearchParams(window.location.search);
    const coreUrl = urlParams.get('u');
    const ticketId = urlParams.get('id');

    const resolve = async (targetUrl) => {
        if (!targetUrl || !ticketId) {
            setStatus('ERROR');
            setErrorMsg('Enlace de capacidad incompleto (falta u o id).');
            return;
        }

        setStatus('RESOLVING');
        try {
            // 1. Handshake Micelar: Obtener el ticket desde el Core remoto (GET Público)
            const resolverUrl = `${targetUrl}?action=getShareTicket&id=${ticketId}`;
            const response = await fetch(resolverUrl);
            const result = await response.json();

            if (result.metadata.status === 'ERROR') {
                throw new Error(result.metadata.error || 'Error al resolver ticket.');
            }

            const ticket = result.items[0];

            // 2. Persistir identidad corporativa y ticket de acceso
            localStorage.setItem('indra-core-url', targetUrl);
            localStorage.setItem('indra-session-secret', 'PUBLIC_GRANT'); 
            localStorage.setItem('indra-share-ticket', ticketId); 
            
            // 3. Limpiar parámetros para evitar bucles en recarga asíncrona
            window.history.replaceState({}, '', window.location.pathname);
            window.location.reload(); 

        } catch (err) {
            console.error('[ManifestResolver] Resolution failed:', err);
            setStatus('ERROR');
            setErrorMsg(err.message);
        }
    };

    useEffect(() => {
        resolve(coreUrl);
    }, [coreUrl, ticketId]);

    const handleManualRetry = () => {
        if (manualUrl) resolve(manualUrl);
    };

    if (status === 'RESOLVING') {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'white' }}>
                <Spinner size="80px" variant="rich" label="Resolviendo Capacidad Micelar..." />
                <p style={{ marginTop: '20px', opacity: 0.5, fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    Conectando con: {coreUrl}
                </p>
            </div>
        );
    }

    if (status === 'ERROR') {
        return (
            <div className="fill center stack" style={{ background: 'var(--color-bg-void)', color: 'white', padding: '40px' }}>
                <IndraIcon name="WARNING" size="48px" style={{ color: 'var(--color-danger)', marginBottom: '20px' }} />
                <h2 style={{ marginBottom: '10px' }}>Fallo de Proyección</h2>
                <p style={{ textAlign: 'center', opacity: 0.7, maxWidth: '400px', marginBottom: '30px' }}>
                    {errorMsg}
                </p>

                <div className="stack" style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '11px', marginBottom: '10px', opacity: 0.5 }}>
                        ¿Se ha actualizado la URL del Core? Pégala aquí para recuperar el acceso:
                    </p>
                    <input 
                        type="text" 
                        className="input" 
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    <button className="btn btn--primary" onClick={handleManualRetry} disabled={!manualUrl}>
                        REINTENTAR RESOLUCIÓN
                    </button>
                    <button className="btn btn--ghost" onClick={() => window.location.href = '/'} style={{ marginTop: '10px' }}>
                        VOLVER AL INICIO
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
