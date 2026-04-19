import React, { useState, useEffect } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import { Badge } from '../utilities/primitives/Badge';
import { Spinner } from '../utilities/primitives/Spinner';

/**
 * =============================================================================
 * COMPONENTE: KeychainManager.jsx (Refactor v7.9 Autoproyectado)
 * RESPONSABILIDAD: Gestión de Identidades guiada por el Esquema del Core.
 * AXIOMA: Sinceridad Estructural. La UI es un reflejo del Ledger Config.
 * =============================================================================
 */
const KeychainManager = ({ onClose }) => {
    const { 
        identities, 
        generateIdentity, 
        revokeIdentity, 
        workspaces,
        keychainSchema,
        loadIdentitySchema
    } = useAppState();

    const [formData, setFormData] = useState({});
    const [isForging, setIsForging] = useState(false);

    useEffect(() => {
        if (!keychainSchema) loadIdentitySchema();
    }, [keychainSchema, loadIdentitySchema]);

    const handleGenerate = async () => {
        const name = formData['name'];
        const scope = formData['scopes'] || 'ALL';
        
        if (!name) return;
        setIsForging(true);
        try {
            await generateIdentity(name, scope);
            setFormData({}); // Reset
        } finally {
            setIsForging(false);
        }
    };

    if (!keychainSchema) {
        return (
            <div className="indra-overlay fill center" style={{ zIndex: 5000, background: 'rgba(0,0,0,0.8)' }}>
                <Spinner label="SINCRONIZANDO_CONTRATO_LEDGER..." />
            </div>
        );
    }

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
                            <p className="text-tiny opacity-50 font-mono">CORE_IDENT_LEDGER // {keychainSchema.metadata?.ledger_version || 'v7.9'}</p>
                        </div>
                    </div>
                    <button className="btn btn--danger btn--mini" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </header>

                <div className="fill shelf--none" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden' }}>
                    
                    {/* SECCIÓN A: LA FORJA (Proyección Dinámica) */}
                    <aside className="stack--loose" style={{ padding: 'var(--space-8)', background: 'var(--color-bg-void)', borderRight: '1px solid var(--color-border)' }}>
                        <div className="stack--tight">
                            <h3 className="text-label color-accent">01 // LA FORJA</h3>
                            <p className="text-hint opacity-60">Sincronizado con esquema canónico.</p>
                        </div>

                        <div className="stack--loose" style={{ marginTop: 'var(--space-6)' }}>
                            {keychainSchema.fields.map(field => (
                                <div key={field.id} className="stack--tight">
                                    <label className="text-tiny font-bold opacity-40">{field.label}</label>
                                    
                                    {field.id === 'scopes' ? (
                                        <select 
                                            className="inspector-field__input fill dynamic-input"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                        >
                                            <option value="ALL">✦ SOBERANÍA GLOBAL (MASTER)</option>
                                            <optgroup label="CÉLULAS MICELLARES ACTIVE">
                                                {workspaces.map(ws => (
                                                    <option key={ws.id} value={ws.id}>○ {ws.title}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    ) : (
                                        <input 
                                            type="text" 
                                            className="inspector-field__input fill dynamic-input"
                                            placeholder={field.placeholder}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}

                            <button 
                                className={`btn btn--accent btn--full ${isForging ? 'loading' : ''}`}
                                onClick={handleGenerate}
                                disabled={!formData['name'] || isForging}
                                style={{ height: '48px', marginTop: 'var(--space-4)', fontSize: '11px', fontWeight: 'bold' }}
                            >
                                <IndraIcon name="VAULT" size="14px" />
                                <span style={{ marginLeft: '12px' }}>GENERAR_IDENTIDAD_EN_CORE</span>
                            </button>
                        </div>

                        <div className="hud-line opacity-20" style={{ margin: 'var(--space-8) 0' }} />
                        
                        <div className="opacity-40 text-tiny italic stack--tight">
                            <p>● El esquema dicta los requerimientos de la identidad.</p>
                            <p>● Sinceridad ADR-041 activa: UI como mero proyector.</p>
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
                        </div>
                    </main>
                </div>
            </div>

            <style>{`
                .dynamic-input {
                    background: rgba(255,255,255,0.05) !important;
                    border: 1px solid var(--color-border-strong) !important;
                    color: white !important;
                    font-size: 13px !important;
                    padding: 10px !important;
                    transition: all 0.2s ease;
                }
                .dynamic-input:focus {
                    background: rgba(255,255,255,0.1) !important;
                    border-color: var(--color-accent) !important;
                    outline: none;
                }
            `}</style>
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
