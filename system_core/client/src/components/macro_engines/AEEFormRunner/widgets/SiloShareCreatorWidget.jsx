import React, { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import ArtifactSelector from '../../../utilities/ArtifactSelector';
import { QRCodeSVG } from 'qrcode.react';

/**
 * SiloShareCreatorWidget — (AEE Widget)
 * RESPONSABILIDAD: Crear y configurar accesos públicos colaborativos (Silo Share)
 * a carpetas soberanas. Genera un token v2 con permisos granulares.
 */
export function SiloShareCreatorWidget({ field, value, onChange, disabled }) {
    const config = field.config || {};
    const defaultPreset = config.default_preset || 'BALANCED';
    
    // Fases: 'IDLE' -> 'SELECTING_SILO' -> 'CONFIGURING' -> 'GENERATED'
    const [phase, setPhase] = useState(value ? 'GENERATED' : 'IDLE');
    
    // Estado draft durante la creación
    const [draftSilo, setDraftSilo] = useState(null); // guardará el rootFolder
    const [permissions, setPermissions] = useState({
        can_upload: true,
        can_download: true,
        can_delete: false,
    });
    const [expiryDays, setExpiryDays] = useState(config.default_expiry_days || 7);
    const [preset, setPreset] = useState(defaultPreset);

    // ── VALOR ACTUAL ACTIVO (Si ya fue generado)
    const currentToken = value && typeof value === 'object' && value.type === 'SILO_SHARE_TOKEN' ? value : null;

    // ── GESTIÓN DE FASES
    const handleSiloSelected = (artifact) => {
        if (!artifact) {
            setPhase('IDLE');
            return;
        }
        
        // Asume que ArtifactSelector retorna un objeto canónico de Indra
        setDraftSilo({
            id: artifact.raw?.id || artifact.id,
            name: artifact.label || artifact.title || artifact.name,
            provider: artifact.provider || 'drive'
        });
        setPhase('CONFIGURING');
    };

    const handleGenerate = () => {
        // Mock de autenticación del propietario (en un caso real, viene de useAppState)
        const dummyOwner = "owner@indra.io";
        const dummyAvatar = "https://ui-avatars.com/api/?name=OWNER&background=random";
        
        // En V1, embebemos un token dummy o pediríamos uno real al Core.
        // Simulamos un auth token aquí.
        const fakeAccessToken = "ya29.simulated_token_for_drive";

        const payload = {
            v: 2,
            mode: "SILO_SHARE",
            label: `Silo: ${draftSilo.name}`,
            rootFolderId: draftSilo.id,
            rootFolderName: draftSilo.name,
            provider: draftSilo.provider,
            ownerEmail: dummyOwner,
            ownerAvatar: dummyAvatar,
            accessToken: fakeAccessToken,
            permissions: permissions,
            miePreset: preset,
            expiresAt: new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000)).toISOString()
        };

        const tokenBase64 = btoa(JSON.stringify(payload));
        const publicUrl = `${window.location.origin}/#/silo?token=${tokenBase64}`;

        const finalValue = {
            type: 'SILO_SHARE_TOKEN',
            label: draftSilo.name,
            rootFolderId: draftSilo.id,
            provider: draftSilo.provider,
            permissions,
            miePreset: preset,
            expiresAt: payload.expiresAt,
            publicUrl,
            generatedAt: new Date().toISOString()
        };

        onChange(field.alias, finalValue);
        setPhase('GENERATED');
    };

    const clearLink = () => {
        onChange(field.alias, null);
        setDraftSilo(null);
        setPhase('IDLE');
    };

    const copyLink = () => {
        if(currentToken) {
            navigator.clipboard.writeText(currentToken.publicUrl);
            alert("Enlace público copiado al portapapeles.");
        }
    };

    // ── RENDER DE FASES ──

    return (
        <div className="form-item stack--tight" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', background: 'var(--glass-light)' }}>
            <div className="shelf--between">
                <div className="shelf--tight">
                    <IndraIcon name="SHARE" size="14px" color="var(--color-accent)" />
                    <label className="util-label" style={{ fontSize: '12px' }}>{field.label || 'CONFIGURAR SILO PÚBLICO'}</label>
                </div>
                {currentToken && (
                    <div className="status-glow" style={{ fontSize: '8px' }}>LINK ACTIVO</div>
                )}
            </div>

            {/* FASE: IDLE */}
            {phase === 'IDLE' && (
                <div 
                    className="glass-hover stack center"
                    onClick={() => !disabled && setPhase('SELECTING_SILO')}
                    style={{
                        border: '1px dashed var(--color-border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        minHeight: '80px',
                        padding: 'var(--space-4)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.02)',
                        marginTop: '10px'
                    }}
                >
                    <IndraIcon name="FOLDER" size="24px" style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SELECCIONAR CARPETA RAÍZ</span>
                    <span className="util-hint" style={{ fontSize: '9px', opacity: 0.5 }}>Abre el explorador de realidad para elegir un folder</span>
                </div>
            )}

            {/* FASE: SELECTING SILO (Modal) */}
            {phase === 'SELECTING_SILO' && (
                <ArtifactSelector 
                    onSelect={handleSiloSelected}
                    onCancel={() => setPhase('IDLE')}
                    title="SELECCIONA EL FOLDER A PUBLICAR"
                />
            )}

            {/* FASE: CONFIGURING */}
            {phase === 'CONFIGURING' && draftSilo && (
                <div className="stack--loose" style={{ marginTop: '16px' }}>
                    
                    <div className="shelf--tight glass-pill" style={{ padding: '8px 12px', background: 'var(--color-bg-deep)' }}>
                        <IndraIcon name="FOLDER" size="12px" />
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-accent)' }}>{draftSilo.name}</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>({draftSilo.id.substring(0,8)}...)</span>
                    </div>

                    <div className="stack--tight">
                        <span className="util-label" style={{ fontSize: '9px' }}>PERMISOS DEL COLABORADOR</span>
                        <div className="shelf--tight" style={{ gap: '16px' }}>
                            <label className="shelf--tight" style={{ cursor: 'pointer', fontSize: '11px' }}>
                                <input type="checkbox" checked={permissions.can_upload} onChange={e => setPermissions({...permissions, can_upload: e.target.checked})} />
                                Subir Archivos
                            </label>
                            <label className="shelf--tight" style={{ cursor: 'pointer', fontSize: '11px' }}>
                                <input type="checkbox" checked={permissions.can_download} onChange={e => setPermissions({...permissions, can_download: e.target.checked})} />
                                Descargar
                            </label>
                            <label className="shelf--tight" style={{ cursor: 'pointer', fontSize: '11px' }}>
                                <input type="checkbox" checked={permissions.can_delete} onChange={e => setPermissions({...permissions, can_delete: e.target.checked})} />
                                Eliminar
                            </label>
                        </div>
                    </div>

                    <div className="shelf--between">
                        <div className="stack--tight" style={{ flex: 1 }}>
                            <span className="util-label" style={{ fontSize: '9px' }}>VALIDÉZ (DÍAS)</span>
                            <select 
                                value={expiryDays} 
                                onChange={e => setExpiryDays(parseInt(e.target.value))}
                                style={{ background: 'var(--color-bg-void)', border: '1px solid var(--color-border)', color: 'white', padding: '4px', fontSize: '11px' }}
                            >
                                <option value={1}>24 Horas</option>
                                <option value={7}>7 Días</option>
                                <option value={30}>1 Mes</option>
                            </select>
                        </div>
                        <div className="stack--tight" style={{ flex: 1 }}>
                            <span className="util-label" style={{ fontSize: '9px' }}>MIE PRESET (CALIDAD RECEPTORA)</span>
                            <select 
                                value={preset} 
                                onChange={e => setPreset(e.target.value)}
                                style={{ background: 'var(--color-bg-void)', border: '1px solid var(--color-border)', color: 'white', padding: '4px', fontSize: '11px' }}
                            >
                                <option value="PLUMA">PLUMA (Max Compresión)</option>
                                <option value="BALANCED">BALANCED (Recomendado)</option>
                                <option value="CRISTAL">CRISTAL (Lossless)</option>
                                <option value="SINCERO">SINCERO (Original)</option>
                            </select>
                        </div>
                    </div>

                    <div className="shelf--between" style={{ marginTop: '8px' }}>
                        <button className="btn btn--ghost btn--mini" onClick={() => setPhase('IDLE')} style={{ fontSize: '9px' }}>
                            CANCELAR
                        </button>
                        <button className="btn btn--accent btn--mini" onClick={handleGenerate} style={{ fontSize: '10px', padding: '8px 16px' }}>
                            GENERAR LINK PÚBLICO
                        </button>
                    </div>

                </div>
            )}

            {/* FASE: GENERATED */}
            {phase === 'GENERATED' && currentToken && (
                <div className="stack--loose center" style={{ marginTop: '16px', background: 'var(--color-bg-void)', padding: '24px', borderRadius: '12px' }}>
                    
                    <QRCodeSVG value={currentToken.publicUrl} size={120} bgColor={"transparent"} fgColor={"var(--color-accent)"} level={"L"} includeMargin={false} />
                    
                    <div className="stack--tight center" style={{ textAlign: 'center' }}>
                        <span className="util-label" style={{ color: 'var(--color-accent)', fontSize: '10px' }}>ENLACE PÚBLICO A: {currentToken.label.toUpperCase()}</span>
                        <div className="shelf--tight" style={{ background: 'var(--color-bg-deep)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '100%', overflow: 'hidden' }}>
                            <span className="font-mono" style={{ fontSize: '9px', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentToken.publicUrl}
                            </span>
                            <button className="btn-icon" onClick={copyLink} style={{ marginLeft: '8px', color: 'var(--color-text-primary)'}}>
                                <IndraIcon name="COPY" size="12px" />
                            </button>
                        </div>
                        <div className="shelf--tight" style={{ fontSize: '9px', opacity: 0.5, gap: '12px', marginTop: '4px' }}>
                            <span>Vence: {new Date(currentToken.expiresAt).toLocaleDateString()}</span>
                            <span>| Permisos: {[currentToken.permissions.can_upload && 'S', currentToken.permissions.can_download && 'D', currentToken.permissions.can_delete && 'X'].filter(Boolean).join(', ')}</span>
                        </div>
                    </div>

                    <div className="shelf center" style={{ width: '100%', marginTop: '8px' }}>
                        <button className="btn btn--ghost btn--mini" onClick={clearLink} style={{ fontSize: '9px', color: 'var(--color-danger)' }}>
                            <IndraIcon name="CLOSE" size="10px" style={{ marginRight: '4px' }}/>
                            REVOCAR Y CREAR NUEVO
                        </button>
                        <a href={currentToken.publicUrl} target="_blank" rel="noreferrer" className="btn btn--ghost btn--mini" style={{ fontSize: '9px' }}>
                            VER PORTAL <IndraIcon name="BRIDGE" size="10px" style={{ marginLeft: '4px' }}/>
                        </a>
                    </div>
                </div>
            )}

            {error && (
                <div className="util-hint" style={{ color: 'var(--color-danger)', marginTop: '8px' }}>{error}</div>
            )}
        </div>
    );
}

// Dummy error state just in case, though not deeply used in widget yet
const error = null;
