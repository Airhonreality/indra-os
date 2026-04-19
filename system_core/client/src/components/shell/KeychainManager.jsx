import React, { useState } from 'react';
import { useAppState } from '../../state/app_state';
import { IndraIcon } from '../utilities/IndraIcons';
import { Badge } from '../utilities/primitives/Badge';

/**
 * =============================================================================
 * COMPONENTE: KeychainManager.jsx (Refactor v7.7 Soberano)
 * RESPONSABILIDAD: Gestión de Identidades y Tokens de Acceso.
 * AXIOMA: Sinceridad Estructural y Cero Compresión.
 * =============================================================================
 */
const KeychainManager = () => {
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
        <div className="indra-layout-tripartite fill" style={{ background: 'var(--color-bg-void)', padding: 'var(--space-6)' }}>
            
            {/* LADO IZQUIERDO: LA FORJA (Creación) */}
            <aside className="tripartite-side stack--loose" style={{ flex: '0 0 380px' }}>
                <header className="stack--tight">
                    <h2 className="font-bold text-xl color-accent">LA FORJA</h2>
                    <p className="text-xs opacity-50">Cristalizar nuevas identidades soberanas.</p>
                </header>

                <div className="slot-large stack--loose glass-strong" style={{ padding: 'var(--space-6)', border: '1px solid var(--color-accent-dim)' }}>
                    <div className="stack--tight">
                        <label className="text-tiny font-bold opacity-40">NOMBRE_DEL_SATÉLITE</label>
                        <input 
                            type="text" 
                            className="inspector-field__input fill"
                            placeholder="Ej: Agente Operativo Alpha"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            style={{ fontSize: '14px', padding: '12px' }}
                        />
                    </div>

                    <div className="stack--tight">
                        <label className="text-tiny font-bold opacity-40">ÁMBITO_DE_SOBERANÍA</label>
                        <select 
                            className="inspector-field__input fill"
                            value={newScope}
                            onChange={(e) => setNewScope(e.target.value)}
                            style={{ fontSize: '14px', padding: '10px' }}
                        >
                            <option value="ALL">✦ SOBERANÍA GLOBAL (Nexo)</option>
                            <optgroup label="WORKSPACES_DISPONIBLES">
                                {workspaces.map(ws => (
                                    <option key={ws.id} value={ws.id}>○ {ws.title}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <button 
                        className={`btn-primary fill ${isForging ? 'loading' : ''}`}
                        onClick={handleGenerate}
                        disabled={!newName || isForging}
                        style={{ height: '50px', marginTop: 'var(--space-4)' }}
                    >
                        <IndraIcon name="VAULT" />
                        <span className="ml-2">CRISTALIZAR IDENTIDAD</span>
                    </button>
                </div>
                
                <div className="slot-small opacity-50 text-tiny italic">
                    Axioma ADR-041: Las identidades heredan el alcance de su progenitor pero pueden ser acotadas a células específicas.
                </div>
            </aside>

            {/* CENTRO/DERECHA: LA BÓVEDA (Auditoría) */}
            <main className="tripartite-center fill stack--loose" style={{ flex: 1 }}>
                <header className="spread">
                    <div className="stack--tight">
                        <h2 className="font-bold text-xl">LA BÓVEDA</h2>
                        <p className="text-xs opacity-50">Identidades activas en el nexo {identities.length}.</p>
                    </div>
                    <div className="shelf--tight">
                        <Badge label="SINCERIDAD_TOTAL" color="var(--color-success)" variant="dot" />
                    </div>
                </header>

                <div className="grid-auto fill scroll-y" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)', paddingRight: 'var(--space-4)' }}>
                    {identities.map(key => (
                        <IdentityCard 
                            key={key.id} 
                            data={key} 
                            onRevoke={() => {
                                if (confirm(`¿PURGAR DEFINITIVAMENTE '${key.name}'?\nEsta acción es irreversible y eliminará el registro del Ledger.`)) {
                                    revokeIdentity(key.id);
                                }
                            }}
                        />
                    ))}
                    {identities.length === 0 && (
                        <div className="center fill opacity-20 stack--tight" style={{ minHeight: '400px' }}>
                            <IndraIcon name="VAULT" size="64px" />
                            <p>Bóveda Vacía</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const IdentityCard = ({ data, onRevoke }) => {
    return (
        <div className="slot-small stack--loose glass-hover relative" style={{ padding: 'var(--space-6)', minHeight: '160px', border: `1px solid ${data.theme?.color}22` }}>
            <div className="spread">
                <div className="shelf--tight">
                    <IndraIcon name={data.theme?.icon} color={data.theme?.color} size="20px" />
                    <span className="font-bold text-lg">{data.name}</span>
                </div>
                <button className="btn-micro-action btn-danger-hover" onClick={onRevoke}>
                    <IndraIcon name="CLOSE" size="12px" />
                </button>
            </div>

            <div className="stack--tight">
                <div className="shelf--tight opacity-60">
                    <span className="text-tiny font-mono">{data.id}</span>
                </div>
                <div className="shelf--tight">
                   <Badge label={data.theme?.label} color={data.theme?.color} variant="outline" />
                   {data.parentId && <span className="text-tiny opacity-40">Hijo de: {data.parentId.substring(0,8)}</span>}
                </div>
            </div>

            <div className="hud-line" />

            <div className="spread text-tiny opacity-50">
                <span>CREADO: {new Date(data.createdAt).toLocaleDateString()}</span>
                <span>SCOPES: {data.scopes?.length || 0}</span>
            </div>

            {/* Glow sutil de estatus */}
            <div style={{ 
                position: 'absolute', 
                top: 0, right: 0, 
                width: '40px', height: '40px', 
                background: `radial-gradient(circle at top right, ${data.theme?.color}11, transparent)`, 
                borderRadius: '0 var(--radius-lg) 0 0' 
            }} />
        </div>
    );
};

export default KeychainManager;
