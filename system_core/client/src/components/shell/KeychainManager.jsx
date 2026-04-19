import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import { Badge } from '../utilities/primitives/Badge';

/**
 * =============================================================================
 * COMPONENTE: KeychainManager.jsx (Refactor v7.8 Pulcro)
 * RESPONSABILIDAD: Gestión de Identidades y Tokens de Acceso.
 * AXIOMA: Sinceridad Estructural, Cero Compresión y Contraste Industrial.
 * =============================================================================
 */
const KeychainManager = ({ onClose }) => {
    const { 
        identities, 
        generateIdentity, 
        revokeIdentity, 
        workspaces,
        loadingKeys 
    } = useAppState();

    const [newName, setNewName] = useState('');
    const [newScope, setNewScope] = useState('ALL');
    const [isForging, setIsForging] = useState(false);

    const handleGenerate = async () => {
        if (!newName) return;
        setIsForging(true);
        try {
            await generateIdentity(newName, newScope);
            setNewName('');
            setNewScope('ALL');
        } finally {
            setIsForging(false);
        }
    };

    return (
        <div className="indra-overlay fill center" style={{ zIndex: 5000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
            
            <div className="indra-container stack--loose glass-strong shadow-2xl" 
                 style={{ 
                    width: '95vw', 
                    maxWidth: '1200px', 
                    height: '85vh', 
                    maxHeight: '800px',
                    border: '1px solid var(--color-border-strong)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                 }}>
                
                {/* HEADER SOBERANO */}
                <header className="spread" style={{ padding: 'var(--space-5) var(--space-6)', background: 'var(--color-bg-deep)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="shelf--loose">
                        <IndraIcon name="VAULT" color="var(--color-accent)" size="20px" />
                        <div className="stack--none">
                            <h2 className="text-xl font-bold letter-spacing-wide">GESTIÓN_DE_IDENTIDADES</h2>
                            <p className="text-tiny opacity-50 font-mono">CORE_IDENT_LEDGER // V7.8</p>
                        </div>
                    </div>
                    <button className="btn btn--danger btn--mini" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </header>

                <div className="fill shelf--none" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden' }}>
                    
                    {/* SECCIÓN A: LA FORJA (Inscripción) */}
                    <aside className="stack--loose" style={{ padding: 'var(--space-8)', background: 'var(--color-bg-void)', borderRight: '1px solid var(--color-border)' }}>
                        <div className="stack--tight">
                            <h3 className="text-label color-accent">01 // LA FORJA</h3>
                            <p className="text-hint opacity-60">Crear nuevos puntos de acceso al Nexo.</p>
                        </div>

                        <div className="stack--loose" style={{ marginTop: 'var(--space-6)' }}>
                            <div className="stack--tight">
                                <label className="text-tiny font-bold opacity-40">NOMBRE_DEL_ALMA</label>
                                <input 
                                    type="text" 
                                    className="inspector-field__input fill"
                                    placeholder="Agente Operativo Alpha"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.05)', 
                                        border: '1px solid var(--color-border-strong)',
                                        color: 'white',
                                        fontSize: '14px',
                                        padding: '12px'
                                    }}
                                />
                            </div>

                            <div className="stack--tight">
                                <label className="text-tiny font-bold opacity-40">ÁMBITO_DE_SOBERANÍA</label>
                                <select 
                                    className="inspector-field__input fill"
                                    value={newScope}
                                    onChange={(e) => setNewScope(e.target.value)}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.05)', 
                                        border: '1px solid var(--color-border-strong)',
                                        color: 'white',
                                        fontSize: '14px',
                                        padding: '10px'
                                    }}
                                >
                                    <option value="ALL">✦ SOBERANÍA GLOBAL (MASTER)</option>
                                    <optgroup label="CÉLULAS MICELLARES">
                                        {workspaces.map(ws => (
                                            <option key={ws.id} value={ws.id}>○ {ws.title}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <button 
                                className={`btn btn--accent btn--full ${isForging ? 'loading' : ''}`}
                                onClick={handleGenerate}
                                disabled={!newName || isForging}
                                style={{ height: '48px', marginTop: 'var(--space-4)', fontSize: '11px', fontWeight: 'bold' }}
                            >
                                <IndraIcon name="VAULT" size="14px" />
                                <span style={{ marginLeft: '12px' }}>CRISTALIZAR IDENTIDAD</span>
                            </button>
                        </div>

                        <div className="hud-line opacity-20" style={{ margin: 'var(--space-8) 0' }} />
                        
                        <div className="opacity-40 text-tiny italic stack--tight">
                            <p>● Las llaves maestras tienen acceso a la CLI y al Core Directo.</p>
                            <p>● Las llaves de Workspace están confinadas a su célula.</p>
                        </div>
                    </aside>

                    {/* SECCIÓN B: LA BÓVEDA (Auditoría) */}
                    <main className="stack--loose" style={{ padding: 'var(--space-8)', background: 'var(--color-bg-deep)', overflowY: 'auto' }}>
                        <div className="spread">
                            <div className="stack--tight">
                                <h3 className="text-label">02 // LA BÓVEDA</h3>
                                <p className="text-hint opacity-60">Identidades registradas en el Ledger activo.</p>
                            </div>
                            <Badge label="INSPECCIÓN_SINCERA" color="var(--color-success)" variant="dot" />
                        </div>

                        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
                            {identities.map(key => (
                                <IdentityCard 
                                    key={key.id} 
                                    data={key} 
                                    onRevoke={() => {
                                        if (confirm(`¿EXPULSAR DEFINITIVAMENTE A '${key.name}'?\nEsta acción es irreversible física y lógicamente.`)) {
                                            revokeIdentity(key.id);
                                        }
                                    }}
                                />
                            ))}
                            {identities.length === 0 && (
                                <div className="center fill opacity-10" style={{ minHeight: '300px' }}>
                                    <IndraIcon name="VAULT" size="80px" />
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

const IdentityCard = ({ data, onRevoke }) => {
    return (
        <div className="ws-card glass stack--loose relative" style={{ padding: 'var(--space-5)', minHeight: '140px', border: `1px solid ${data.theme?.color}33` }}>
            <div className="spread">
                <div className="shelf--tight">
                    <IndraIcon name={data.theme?.icon} color={data.theme?.color} size="16px" />
                    <span className="font-bold text-md">{data.name}</span>
                </div>
                <button className="btn btn--danger btn--xs" onClick={onRevoke} style={{ padding: '4px' }}>
                    <IndraIcon name="CLOSE" size="10px" />
                </button>
            </div>

            <div className="stack--none">
                <span className="text-tiny font-mono opacity-40 truncate">{data.id}</span>
                <div className="shelf--tight" style={{ marginTop: 'var(--space-2)' }}>
                   <Badge label={data.theme?.label} color={data.theme?.color} variant="outline" size="xs" />
                </div>
            </div>

            <div className="hud-line opacity-10" />

            <div className="spread text-tiny opacity-40 font-mono">
                <span>{new Date(data.createdAt).toLocaleDateString()}</span>
                <span>SCOPES: {data.scopes?.length || 0}</span>
            </div>
        </div>
    );
};

export default KeychainManager;
