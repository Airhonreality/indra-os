import React, { useState, useEffect } from 'react';
import { useProtocol } from '../../../context/NeuralSplitter';
import { useLexicon } from '../../../hooks/useLexicon';

/**
 * COMPONENTE: KeychainManager
 * RESPONSABILIDAD: Gestión del Ledger de Identidades (Llavero) del Core.
 * Permite al usuario maestro ver, crear y revocar llaves soberanas.
 */
export const KeychainManager = () => {
    const { execute } = useProtocol();
    const t = useLexicon();
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');

    // 1. CARGA: Auditar el llavero actual
    const loadKeychain = async () => {
        setLoading(true);
        try {
            const res = await execute({
                protocol: 'SYSTEM_KEYCHAIN_AUDIT'
            });
            if (res.items) setKeys(res.items);
        } catch (e) {
            console.error("❌ Fallo al auditar keychain:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadKeychain(); }, []);

    // 2. ACCIÓN: Generar nueva llave
    const handleGenerate = async () => {
        if (!newName) return;
        setLoading(true);
        try {
            await execute({
                protocol: 'SYSTEM_KEYCHAIN_GENERATE',
                data: { name: newName }
            });
            setNewName('');
            await loadKeychain();
        } catch (e) {
            alert("Error al generar llave: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. ACCIÓN: Revocar llave
    const handleRevoke = async (id) => {
        if (!confirm("¿Estás seguro de revocar esta llave? El satélite perderá acceso inmediato.")) return;
        setLoading(true);
        try {
            await execute({
                protocol: 'SYSTEM_KEYCHAIN_REVOKE',
                context_id: id
            });
            await loadKeychain();
        } catch (e) {
            alert("Error al revocar: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="keychain-manager" style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '14px', letterSpacing: '0.1em' }}>LEYENDA_DE_SOBERANÍA // KEYCHAIN</h3>

            {/* FORMULARIO DE CREACIÓN */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input 
                    type="text" 
                    placeholder="Nombre del Satélite (ej: Seed_Hibrido_01)" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{ padding: '10px 20px', background: '#34A853', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'GENERANDO...' : 'GENERAR LLAVE'}
                </button>
            </div>

            {/* LISTA DE LLAVES */}
            <div className="key-list">
                {keys.length === 0 && <p style={{ opacity: 0.5, fontSize: '12px' }}>No hay llaves registradas.</p>}
                {keys.map(key => (
                    <div key={key.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '15px', 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '10px',
                        borderRadius: '6px'
                    }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{key.name}</div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4285F4', marginTop: '4px' }}>{key.id}</div>
                            <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '4px' }}>ESTADO: {key.status} // CLASE: {key.class}</div>
                        </div>
                        {key.status === 'ACTIVE' && (
                            <button 
                                onClick={() => handleRevoke(key.id)}
                                style={{ background: 'transparent', color: '#EA4335', border: '1px solid #EA4335', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                            >
                                REVOCAR
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
