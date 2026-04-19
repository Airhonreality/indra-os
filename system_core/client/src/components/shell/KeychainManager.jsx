/**
 * =============================================================================
 * ARTEFACTO: KeychainManager.jsx
 * RESPONSABILIDAD: Proyector del Ledger de Identidades (Llavero).
 * 
 * DHARMA (Armonía v6.1):
 *   - Desacoplamiento total de protocolos.
 *   - Suscripción al domain.slice (Verdad Global).
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';

export default function KeychainManager({ onClose }) {
    const identities = useAppState(s => s.identities);
    const workspaces = useAppState(s => s.workspaces);
    const { loadIdentityLedger, generateIdentity, revokeIdentity } = useAppState();

    const [keyName, setKeyName] = useState('');
    const [targetWorkspace, setTargetWorkspace] = useState('ALL');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadIdentityLedger();
    }, []);

    const handleCreate = async () => {
        if (!keyName.trim()) return;
        setLoading(true);
        try {
            await generateIdentity(keyName, targetWorkspace);
            setKeyName('');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!confirm("¿Estás seguro de revocar esta llave?")) return;
        await revokeIdentity(id);
    };

    return (
        <div className="indra-overlay" onClick={onClose}>
            <div 
                className="keychain-glass shelf-tight glass-chassis stack--loose" 
                style={{ width: '600px', padding: '30px' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="spread">
                    <h2 className="font-mono" style={{ fontSize: '10px', opacity: 0.6 }}>GESTIÓN DE LLAVES // KEYCHAIN</h2>
                    <button onClick={onClose} className="btn-icon">
                        <IndraIcon name="CLOSE" size="14px" />
                        <span style={{ fontSize: '10px', marginLeft: '5px' }}>CERRAR</span>
                    </button>
                </div>

                <section className="terminal-inset stack--tight" style={{ padding: '20px' }}>
                     <div className="shelf--tight">
                        <input 
                            type="text" 
                            className="fill input--dark"
                            placeholder="Nombre del Satélite (ej. Seed_Hibrido_01)"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                        />
                        <button 
                            className="btn btn--accent" 
                            onClick={handleCreate}
                            disabled={loading || !keyName.trim()}
                        >
                            {loading ? 'CRISTALIZANDO...' : 'GENERAR LLAVE'}
                        </button>
                    </div>

                    <div className="shelf--tight" style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '9px', opacity: 0.5, marginRight: '10px' }}>ÁMBITO DE ACCESO:</span>
                        <select 
                            className="input--dark fill" 
                            value={targetWorkspace}
                            onChange={e => setTargetWorkspace(e.target.value)}
                            style={{ padding: '4px' }}
                        >
                            <option value="ALL">ACCESO UNIVERSAL (MASTER)</option>
                            {workspaces.map(w => (
                                <option key={w.id} value={w.id}>LIMITADO: {w.handle.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </section>

                <div className="key-list scroll-y stack--tight" style={{ maxHeight: '300px', marginTop: '20px' }}>
                    {identities.length === 0 ? (
                        <div className="center opacity-3 font-mono" style={{ padding: '40px' }}>[ SIN_LLAVES_ACTIVAS ]</div>
                    ) : (
                        identities.map(key => (
                            <div key={key.id} className="key-item glass shelf--loose" style={{ padding: '15px' }}>
                                <div className="fill stack--none">
                                    <span className="font-bold">{key.name || 'Sin Nombre'}</span>
                                    <code style={{ fontSize: '10px', color: 'var(--color-accent)', display: 'block' }}>{key.id}</code>
                                    <span style={{ fontSize: '9px', opacity: 0.5 }}>ÁMBITO: {key.scope_label || 'MASTER'}</span>
                                </div>
                                <button 
                                    className="btn btn--danger btn--xs"
                                    onClick={() => handleRevoke(key.id)}
                                >
                                    REVOCAR
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
