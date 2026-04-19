/**
 * =============================================================================
 * ARTEFACTO: KeychainManager.jsx
 * RESPONSABILIDAD: Centro de Soberanía e Identidades (Identity Hub).
 * 
 * DHARMA (Axioma v6.2):
 *   - Layout Bipartito (Auto-layout).
 *   - Micro-Cards para Satélites.
 *   - Acciones Explícitas (Cristalizar / Purgar).
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

    return (
        <div className="indra-overlay" onClick={onClose}>
            <div 
                className="glass-chassis indra-layout-bipartite shadow-glow" 
                style={{ width: '1000px', height: '640px', maxWidth: '95vw', maxHeight: '85vh', overflow: 'hidden', border: '1px solid var(--color-border-strong)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── PANEL DE CRISTALIZACIÓN (IZQUIERDA) ── */}
                <aside className="bipartite-side stack--loose" style={{ padding: 'var(--space-6)', background: 'var(--color-bg-float)', borderRight: '1px solid var(--color-border)' }}>
                    <header className="stack--tight">
                        <h2 className="hud-label-mono" style={{ color: 'var(--color-accent)', fontSize: '11px' }}>FORJA_DE_IDENTIDAD</h2>
                        <p style={{ fontSize: '10px', opacity: 0.5, lineHeight: '1.4' }}>Crea un nuevo canal de resonancia para un satélite externo o un colaborador.</p>
                    </header>

                    <div className="hud-line"></div>

                    <div className="stack--tight fill">
                        <label className="hud-label-mono" style={{ fontSize: '9px', opacity: 0.7 }}>NOMBRE_DEL_SATÉLITE</label>
                        <div className="terminal-inset shelf--tight" style={{ padding: '2px 10px' }}>
                            <IndraIcon name="LAYERS" size="14px" color="var(--color-accent)" style={{ opacity: 0.5 }} />
                            <input 
                                type="text" 
                                className="fill"
                                placeholder="ej. Seed_Nexus_01"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', outline: 'none', fontFamily: 'var(--font-mono)' }}
                            />
                        </div>

                        <div style={{ height: '12px' }}></div>

                        <label className="hud-label-mono" style={{ fontSize: '9px', opacity: 0.7 }}>ÁMBITO_DE_ACCESO</label>
                        <select 
                            className="terminal-inset fill" 
                            value={targetWorkspace}
                            onChange={e => setTargetWorkspace(e.target.value)}
                            style={{ padding: '12px', background: 'var(--color-bg-void)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-sm)' }}
                        >
                            <option value="ALL">ACCESO UNIVERSAL (MASTER)</option>
                            {workspaces.map(w => (
                                <option key={w.id} value={w.id}>LOCKED_TO: {w.handle?.label?.toUpperCase()}</option>
                            ))}
                        </select>

                        <div style={{ height: '24px' }}></div>

                        <button 
                            className={`btn ${loading ? 'btn--ghost' : 'btn--accent'} fill`} 
                            onClick={handleCreate}
                            disabled={loading || !keyName.trim()}
                            style={{ width: '100%', padding: '15px', fontWeight: 'bold', letterSpacing: '0.1em' }}
                        >
                            {loading ? (
                                <div className="shelf--tight center">
                                    <div className="indra-spin" style={{ width: '12px', height: '12px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                    <span>CONECTANDO...</span>
                                </div>
                            ) : 'GENERAR LLAVE MAESTRA'}
                        </button>
                    </div>

                    <footer className="opacity-3 font-mono" style={{ fontSize: '8px' }}>
                        INDRA_OS // SOVEREIGNTY_PROTOCOL_v6.2
                    </footer>
                </aside>

                {/* ── RADAR DE SATÉLITES (DERECHA) ── */}
                <main className="bipartite-main stack--loose" style={{ padding: 'var(--space-8)', background: 'var(--color-bg-void)' }}>
                    <header className="spread">
                        <div className="stack--none">
                            <h3 className="hud-label-mono" style={{ fontSize: '14px' }}>SATÉLITES_ACTIVOS</h3>
                            <span style={{ fontSize: '10px', opacity: 0.4 }}>{identities.length} IDENTIDADES EN RESONANCIA</span>
                        </div>
                        <button onClick={onClose} className="btn-icon circle-hover" style={{ padding: '8px' }}>
                            <IndraIcon name="CLOSE" size="14px" />
                        </button>
                    </header>

                    <div className="fill grid-auto scroll-y" style={{ paddingRight: '10px' }}>
                        {identities.length === 0 ? (
                            <div className="center fill stack--tight" style={{ opacity: 0.2 }}>
                                <IndraIcon name="SEARCH" size="48px" />
                                <span className="font-mono">NO_DATA_PULSE</span>
                            </div>
                        ) : (
                            identities.map(key => (
                                <SatelliteCard 
                                    key={key.id} 
                                    data={key} 
                                    onRevoke={() => {
                                        if (confirm(`¿REVOCAR SATÉLITE '${key.name}'?`)) revokeIdentity(key.id);
                                    }} 
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function SatelliteCard({ data, onRevoke }) {
    const isMaster = !data.scope_id || data.scope_id === 'ALL';

    return (
        <div className="slot-small stack--tight glass-hover" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="spread">
                <div className="shelf--tight">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isMaster ? 'var(--color-accent)' : 'var(--color-warm)', boxShadow: `0 0 8px ${isMaster ? 'var(--color-accent-glow)' : 'rgba(245,166,35,0.4)'}` }} />
                    <span className="font-bold" style={{ fontSize: '12px' }}>{data.name || 'SATÉLITE_ANÓNIMO'}</span>
                </div>
                <button className="btn-micro-action" onClick={onRevoke} title="PURGAR_SATELLITE">
                    <IndraIcon name="CLOSE" size="10px" />
                </button>
            </div>

            <div className="hud-line" style={{ opacity: 0.2 }}></div>

            <div className="stack--none">
                <code style={{ fontSize: '9px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>{data.id}</code>
                
                <div className="shelf--tight" style={{ opacity: 0.6 }}>
                    <IndraIcon name={isMaster ? 'CPU' : 'FOLDER'} size="10px" />
                    <span style={{ fontSize: '9px', fontWeight: '600' }}>
                        {isMaster ? 'ACCESO_UNIVERSAL' : `LIMITADO: ${data.scope_label || 'ERROR_SCOPE'}`}
                    </span>
                </div>
            </div>

            {/* Vínculo Fractal Decorativo */}
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
                <IndraIcon name="INFINITY" size="60px" />
            </div>
        </div>
    );
}
