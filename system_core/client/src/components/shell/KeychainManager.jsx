/**
 * =============================================================================
 * ARTEFACTO: KeychainManager.jsx
 * RESPONSABILIDAD: Centro de Soberanía e Identidades (Identity Hub).
 * 
 * DHARMA (Axioma v6.4):
 *   - Diseño 100% Fluido (Sin Hard-coding).
 *   - Auto-layout elástico con Flexbox/Grid.
 *   - Proporciones Sinceras (Sin botones gigantes).
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
        <div className="indra-overlay" onClick={onClose} style={{ backdropFilter: 'blur(10px)' }}>
            <div 
                className="glass-chassis indra-layout-bipartite shadow-glow" 
                style={{ 
                    width: '92vw', 
                    height: '80vh', 
                    maxWidth: '1100px', 
                    maxHeight: '700px', 
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-strong)',
                    display: 'flex'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── PANEL DE CONFIGURACIÓN (Lógica Siniestra) ── */}
                <aside className="bipartite-side stack--loose" style={{ padding: 'var(--space-6)', background: 'var(--color-bg-float)', borderRight: '1px solid var(--color-border)', width: '340px', flex: 'none' }}>
                    <header className="stack--tight">
                        <div className="shelf--tight" style={{ color: 'var(--color-accent)' }}>
                            <IndraIcon name="LAYERS" size="14px" />
                            <h2 className="hud-label-mono" style={{ fontSize: '11px' }}>FORJA_SATELLITE</h2>
                        </div>
                        <p style={{ fontSize: '10px', opacity: 0.5 }}>Cristaliza un nuevo canal de resonancia soberana.</p>
                    </header>

                    <div className="hud-line"></div>

                    {/* Contenedor de Formulario: No usamos 'fill' para evitar estiramientos locos */}
                    <div className="stack--tight">
                        <label className="hud-label-mono" style={{ fontSize: '9px', opacity: 0.7 }}>ETIQUETA_NOMINAL</label>
                        <div className="terminal-inset shelf--tight" style={{ padding: '4px 12px' }}>
                            <input 
                                type="text" 
                                className="fill"
                                placeholder="Indra_Key_01"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px 0', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                            />
                        </div>

                        <div style={{ height: '8px' }}></div>

                        <label className="hud-label-mono" style={{ fontSize: '9px', opacity: 0.7 }}>ÁMBITO_ANCLAJE</label>
                        <select 
                            className="terminal-inset" 
                            value={targetWorkspace}
                            onChange={e => setTargetWorkspace(e.target.value)}
                            style={{ padding: '10px', background: 'var(--color-bg-void)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-sm)', width: '100%', fontSize: '11px' }}
                        >
                            <option value="ALL">NEXO_UNIVERSAL</option>
                            {workspaces.map(w => (
                                <option key={w.id} value={w.id}>{w.handle?.label?.toUpperCase() || 'ID_NEX'}</option>
                            ))}
                        </select>

                        <div style={{ height: '16px' }}></div>

                        <button 
                            className={`btn ${loading ? 'btn--ghost' : 'btn--accent'}`} 
                            onClick={handleCreate}
                            disabled={loading || !keyName.trim()}
                            style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
                        >
                            {loading ? 'CRISTALIZANDO...' : 'GENERAR LLAVE'}
                        </button>
                    </div>

                    <div className="fill"></div> {/* Empujador para el footer */}

                    <footer className="opacity-3 font-mono" style={{ fontSize: '8px', textAlign: 'center' }}>
                        INDRA_SOVEREIGNTY // v6.4-FLUID
                    </footer>
                </aside>

                {/* ── PANEL DE VISUALIZACIÓN (Radar Principal) ── */}
                <main className="bipartite-main stack--loose" style={{ padding: 'var(--space-6)', background: 'var(--color-bg-void)', display: 'flex', flexDirection: 'column' }}>
                    <header className="spread">
                        <div className="stack--none">
                            <h3 className="hud-label-mono" style={{ fontSize: '14px' }}>LEDGER_IDENTIDADES</h3>
                            <span style={{ fontSize: '10px', opacity: 0.4 }}>{identities.length} SATÉLITES_ACTIVOS_EN_EL_NEXO</span>
                        </div>
                        <button onClick={onClose} className="btn-icon circle-hover" style={{ padding: '8px' }}>
                            <IndraIcon name="CLOSE" size="14px" />
                        </button>
                    </header>

                    <div className="fill scroll-y" style={{ marginTop: '10px' }}>
                        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                            {identities.length === 0 ? (
                                <div className="center stack--tight" style={{ height: '300px', opacity: 0.15 }}>
                                    <IndraIcon name="SEARCH" size="32px" />
                                    <span className="font-mono">LEDGER_VACÍO</span>
                                </div>
                            ) : (
                                identities.map(key => (
                                    <SatelliteCard 
                                        key={key.id} 
                                        data={key} 
                                        onRevoke={() => {
                                            if (confirm(`¿PURGAR SATÉLITE '${key.name}'?`)) revokeIdentity(key.id);
                                        }} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SatelliteCard({ data, onRevoke }) {
    const isMaster = !data.scope_id || data.scope_id === 'ALL';

    return (
        <div className="slot-small stack--tight glass-hover" style={{ padding: '12px', minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                <div className="spread">
                    <div className="shelf--tight" style={{ overflow: 'hidden' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: isMaster ? 'var(--color-accent)' : 'var(--color-warm)', boxShadow: `0 0 6px ${isMaster ? 'var(--color-accent-glow)' : 'rgba(245,166,35,0.4)'}` }} />
                        <span className="font-bold" style={{ fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{data.name || 'ANÓNIMO'}</span>
                    </div>
                    <button className="btn-micro-action" onClick={onRevoke} style={{ opacity: 0.3 }}>
                        <IndraIcon name="CLOSE" size="8px" />
                    </button>
                </div>
                <code style={{ fontSize: '8px', opacity: 0.3, display: 'block', marginTop: '4px' }}>{data.id.slice(0, 18)}...</code>
            </div>

            <div className="shelf--tight" style={{ opacity: 0.5, borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                <IndraIcon name={isMaster ? 'CPU' : 'FOLDER'} size="10px" />
                <span style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {isMaster ? 'UNIVERSAL' : data.scope_label || 'SCOPE_LOCK'}
                </span>
            </div>
        </div>
    );
}
