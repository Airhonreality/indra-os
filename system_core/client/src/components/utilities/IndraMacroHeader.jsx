import React, { useState, useEffect, useMemo } from 'react';
import { IndraIcon } from './IndraIcons';
import { IndraActionTrigger } from './IndraActionTrigger';
import { useShell } from '../../context/ShellContext';
import { StyleEngineSidebar } from './StyleEngineSidebar';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { RenameDryRunModal } from './primitives/RenameDryRunModal';
import { prepareCanonicalRename, commitCanonicalRename } from '../../services/rename_protocol_runtime';
import { useWorkspace } from '../../context/WorkspaceContext';

export function IndraMacroHeader({
    atom,
    bridge, // Prop opcional pero recomendado para renombrado canónico
    onClose,
    onTitleChange,
    onIdentityChange,
    isLive = false,
    rightSlot,
    overrideTitle,
    overrideMeta,
    overrideClass,
    hideExit = false
}) {
    const t = useLexicon();
    const { updateAxiomaticIdentity } = useWorkspace();
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [isSyncingIdentity, setIsSyncingIdentity] = useState(false);
    const [renameError, setRenameError] = useState('');
    const isSaving = useAppState(s => !!s.pendingSyncs[atom?.id]);
    const pins = useAppState(s => s.pins || []);
    const { setIsStyleEngineOpen, theme, setTheme } = useShell();
    const [isPulsing, setIsPulsing] = useState(false);

    const handleThemeToggle = () => {
        // Cycling between dark, light, indra-vapor
        const nextThemes = {
            'dark': 'light',
            'light': 'indra-vapor',
            'indra-vapor': 'dark'
        };
        setTheme(nextThemes[theme] || 'dark');
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.detail.type === 'OUT') {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 400);
            }
        };
        window.addEventListener('indra-pulse', handler);
        return () => window.removeEventListener('indra-pulse', handler);
    }, []);

    // AXIOMA: Universe Injection (Inyectar color local al DOM Global)
    useEffect(() => {
        const color = atom?.color;
        if (color) {
            document.documentElement.style.setProperty('--indra-dynamic-accent', color);
            document.documentElement.style.setProperty('--indra-dynamic-border', `${color}26`);
            document.documentElement.style.setProperty('--indra-dynamic-bg', `${color}08`);
        }
        return () => {
            document.documentElement.style.removeProperty('--indra-dynamic-accent');
            document.documentElement.style.removeProperty('--indra-dynamic-border');
            document.documentElement.style.removeProperty('--indra-dynamic-bg');
        };
    }, [atom?.color]);

    const handle = atom?.handle || {};
    const label = overrideTitle || handle.label || t('status_unnamed');
    const alias = handle.alias || '';
    const atomClass = overrideClass || atom?.class || 'ATOM';
    const normalizedAlias = String(alias || '').trim().toLowerCase();

    const aliasCollision = useMemo(() => {
        if (!normalizedAlias || !atom?.id) return null;
        return pins.find(p => {
            if (!p || p.id === atom.id) return false;
            const candidate = String(p?.handle?.alias || p?.alias || '').trim().toLowerCase();
            return candidate && candidate === normalizedAlias;
        }) || null;
    }, [pins, normalizedAlias, atom?.id]);

    const handleInternalIdentityCommit = async ({ label: newLabel, alias: newAlias }) => {
        if (isSyncingIdentity) return; // BLOQUEO TRANSACCIONAL: Evitar colisiones por eco de eventos
        setIsSyncingIdentity(true);
        
        try {
            const cleanLabel = newLabel || label;
            const cleanAlias = newAlias || alias;
            
            // Si el designer pasó un callback manual, lo respetamos (estilo SchemaDesigner)
            if (onIdentityChange) {
                onIdentityChange({ label: cleanLabel, alias: cleanAlias });
                return;
            }

            // Si no hay callback pero hay bridge, activamos el flujo AGNOSTICO GLOBAL
            if (bridge) {
                try {
                    const prepared = await prepareCanonicalRename({
                        bridge,
                        provider: atom.provider || 'system',
                        protocol: 'ATOM_ALIAS_RENAME',
                        contextId: atom.id,
                        kind: 'ATOM_ALIAS',
                        data: {
                            old_alias: alias || undefined,
                            new_alias: cleanAlias,
                            new_label: cleanLabel,
                        },
                    });

                    if (prepared.status === 'PENDING') {
                        setPendingRename(prepared.pendingRename);
                        return;
                    }

                    if (prepared.status === 'NOOP') {
                        // CASO: Alias idéntico, solo cambia el Label (Renombrado Silencioso).
                        // Llamamos directamente al commit sin pasar por el modal de confirmación,
                        // ya que no hay riesgo de colisión de alias.
                        const result = await bridge.request({
                            protocol: 'ATOM_ALIAS_RENAME',
                            context_id: atom.id,
                            data: { 
                                old_alias: cleanAlias, 
                                new_alias: cleanAlias, 
                                new_label: cleanLabel,
                                dry_run: false  // Commit real
                            }
                        });
                        
                        if (result?.metadata?.status === 'OK' && result?.items?.[0]) {
                            const syncedAtom = result.items[0];
                            updateAxiomaticIdentity(atom.id, atom.provider, {
                                label: syncedAtom.handle?.label,
                                alias: syncedAtom.handle?.alias,
                                handle: syncedAtom.handle
                            });
                        }
                    }
                } catch (err) {
                    console.error('[IndraMacroHeader] Renombrado fallido:', err);
                    setRenameError(err.message);
                }
            }
        } finally {
            setIsSyncingIdentity(false); // LIBERACIÓN DEL CANDADO
        }
    };

    const confirmRename = async () => {
        if (!bridge || !pendingRename) return;
        setIsCommittingRename(true);
        try {
            const result = await commitCanonicalRename({ bridge, pendingRename });
            const syncedAtom = result.items[0];
            updateAxiomaticIdentity(atom.id, atom.provider, {
                label: syncedAtom.handle?.label,
                alias: syncedAtom.handle?.alias,
                handle: syncedAtom.handle
            });
            setPendingRename(null);
        } catch (err) {
            setRenameError(err.message);
        } finally {
            setIsCommittingRename(false);
        }
    };

    return (
        <>
        <header className="macro-header glass">

            {/* ── LADO A: IDENTIDAD ── */}
            <div className="macro-header__identity">

                {/* LOGO ICON */}
                <div className={`macro-header__logo ${isPulsing ? 'macro-header__logo--pulse' : ''}`}>
                    <IndraIcon
                        name={atomClass}
                        size="18px"
                        style={{ 
                            color: isLive ? 'var(--color-danger)' : 'var(--indra-dynamic-accent, var(--color-accent))',
                            filter: isPulsing ? 'drop-shadow(0 0 10px var(--indra-dynamic-accent, var(--color-accent)))' : 'none'
                        }}
                    />
                    {isLive && (
                        <div className="resonance-dot resonance-dot--active"
                            style={{ position: 'absolute', top: -3, right: -3 }} />
                    )}
                </div>

                {/* TITLE BLOCK */}
                <div className="macro-header__title-block">
                    {(onIdentityChange || bridge) ? (
                        <IdentityInput
                            initialLabel={label}
                            initialAlias={alias}
                            onCommit={handleInternalIdentityCommit}
                            aliasCollision={aliasCollision}
                        />
                    ) : onTitleChange ? (
                        <TitleInput 
                            initialLabel={label} 
                            onCommit={onTitleChange} 
                        />
                    ) : (
                        <h2 className="macro-header__title-static">{label}</h2>
                    )}
                </div>

                {/* ── ACTIVE ENGINE TOOLS (Axioma: Proximidad Cognitiva) ── */}
                <div className="macro-header__engine-tools shelf--tight" style={{ marginLeft: 'var(--space-6)' }}>
                    {isSaving && (
                        <div className="shelf--tight animate-pulse" style={{ color: 'var(--indra-dynamic-accent)', marginRight: '12px', background: 'var(--indra-dynamic-bg)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--indra-dynamic-border)' }}>
                            <IndraIcon name="SYNC" size="10px" className="spin" />
                            <span className="font-mono" style={{ fontSize: '8px', fontWeight: 'bold', marginLeft: '6px', letterSpacing: '0.05em' }}>
                                {t('action_save').toUpperCase()}...
                            </span>
                        </div>
                    )}
                    {rightSlot}
                </div>
            </div>            {/* ── LADO B: COMANDOS (Clean & Agnostic) ── */}
            <div className="macro-header__controls">
                
                {/* Global Tray (Originales) - Justified Left in this container */}
                <div className="macro-header__control-tray shelf--tight" style={{ 
                    padding: '4px 12px', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginRight: 'auto' // AXIOMA: Empujar el resto a la derecha
                }}>
                    <button 
                        className="btn btn--mini"
                        style={{ width: '32px', height: '32px', padding: '0' }}
                        onClick={() => useAppState.getState().openSelector()} 
                        title="Global Workspace Search"
                    >
                        <IndraIcon name="SEARCH" size="14px" />
                    </button>

                    <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', opacity: 0.2 }} />

                    {/* CORE CONNECTIVITY (Link Directo) */}
                    <button 
                        className={`btn btn--mini ${useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: (useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen) ? 'var(--color-accent)' : 'inherit',
                            filter: (useAppState.getState().docsTab === 'INSTALACION' && useAppState.getState().isDocsOpen) ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDocs('INSTALACION')}
                        title="Core Connectivity (Conector Maestro)"
                    >
                        <IndraIcon name="LINK" size="14px" />
                    </button>

                    <button 
                        className="btn btn--mini"
                        style={{ width: '32px', height: '32px', padding: '0' }}
                        onClick={handleThemeToggle}
                        title={t('ui_theme_selection')}
                    >
                        <IndraIcon name="EYE" size="14px" />
                    </button>
                    
                    <button 
                        className={`btn btn--mini ${useShell().isStyleEngineOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: useShell().isStyleEngineOpen ? 'var(--color-accent)' : 'inherit',
                            filter: useShell().isStyleEngineOpen ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => setIsStyleEngineOpen(!useShell().isStyleEngineOpen)}
                        title={t('ui_style_engine')}
                    >
                        <IndraIcon name="LAYERS" size="14px" />
                    </button>

                    <button 
                        className={`btn btn--mini ${(useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: (useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'var(--color-accent)' : 'inherit',
                            filter: (useAppState.getState().isDocsOpen && useAppState.getState().docsTab !== 'INSTALACION') ? 'drop-shadow(0 0 8px var(--color-accent))' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDocs('BIENVENIDA')}
                        title="Documentación y Guías"
                    >
                        <IndraIcon name="INFO" size="14px" />
                    </button>

                    <button 
                        className={`btn btn--mini ${useAppState.getState().isDiagnosticHubOpen ? 'btn--active-glass' : ''}`}
                        style={{ 
                            width: '32px', height: '32px', padding: '0',
                            color: useAppState.getState().isDiagnosticHubOpen ? '#ff00ff' : 'inherit',
                            filter: useAppState.getState().isDiagnosticHubOpen ? 'drop-shadow(0 0 8px #ff00ff)' : 'none'
                        }}
                        onClick={() => useAppState.getState().openDiagnosticHub()}
                        title="Cabina de Diagnóstico (IDH)"
                    >
                        <IndraIcon name="TERMINAL" size="14px" />
                    </button>
                </div>

                {/* divider removed from here */}

                {/* EXIT (Semantic Eject) */}
                {!hideExit && (
                    <button 
                        className="btn btn--mini shadow-hover"
                        onClick={onClose}
                        title={t('action_back')}
                        style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            opacity: 0.6
                        }}
                    >
                        <IndraIcon name="EJECT" size="16px" />
                    </button>
                )}

            </div>
        </header>
        
        {/* Componentes de Gracia / Portales Globales */}
        <StyleEngineSidebar />
        
        <RenameDryRunModal 
            pendingRename={pendingRename}
            isCommitting={isCommittingRename}
            error={renameError}
            onCancel={() => setPendingRename(null)}
            onConfirm={confirmRename}
        />
        </>
    );
}

// Subcomponente de Aislamiento de Red
// Resuelve el Anti-Patrón de DDOS por re-renderizado
function TitleInput({ initialLabel, onCommit }) {
    const [localValue, setLocalValue] = useState(initialLabel);

    // Resonancia: Si un proceso de fondo cambia o cura el nombre,
    // debemos absorberlo, pero *solo* si el usuario no tiene la caja seleccionada.
    useEffect(() => {
        setLocalValue(initialLabel);
    }, [initialLabel]);

    const handleBlur = () => {
        if (localValue !== initialLabel) {
            onCommit(localValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Dispara onBlur automáticamente
        }
    };

    return (
        <input
            type="text"
            className="macro-header__title-input"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="UNTITLED..."
            spellCheck={false}
        />
    );
}

function IdentityInput({ initialLabel, initialAlias, onCommit, aliasCollision = null }) {
    const [labelDraft, setLabelDraft] = useState(initialLabel || '');
    const [aliasDraft, setAliasDraft] = useState(initialAlias || '');
    const [isAliasLocked, setIsAliasLocked] = useState(true);

    useEffect(() => {
        setLabelDraft(initialLabel || '');
    }, [initialLabel]);

    useEffect(() => {
        setAliasDraft(initialAlias || '');
        setIsAliasLocked(true); // Resellamos el candado si la identidad de origen cambia
    }, [initialAlias]);

    const sanitizeAlias = (value) => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const commit = (nextLabel = labelDraft, nextAlias = aliasDraft) => {
        const cleanLabel = String(nextLabel || '').trim() || initialLabel || 'UNTITLED';
        const cleanAlias = sanitizeAlias(nextAlias || cleanLabel);

        if (cleanLabel !== initialLabel || cleanAlias !== (initialAlias || '')) {
            onCommit({ label: cleanLabel, alias: cleanAlias });
        }

        setLabelDraft(cleanLabel);
        setAliasDraft(cleanAlias);
        setIsAliasLocked(true); // Bloquear de nuevo después de commit
    };

    return (
        <div className="stack--tight" style={{ gap: '4px' }}>
            <input
                type="text"
                className="macro-header__title-input"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onBlur={() => commit(labelDraft, aliasDraft)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // AXIOMA: Solo llamamos a blur. 
                        // El evento onBlur ya tiene el commit() asignado, evitando la doble petición.
                        e.currentTarget.blur();
                    }
                    if (e.key === 'Escape') {
                        setLabelDraft(initialLabel || '');
                        setAliasDraft(initialAlias || '');
                        e.currentTarget.blur();
                        setIsAliasLocked(true);
                    }
                }}
                placeholder="UNTITLED..."
                spellCheck={false}
            />
            <div className="shelf--tight" style={{ gap: '6px', alignItems: 'center' }}>
                <div 
                    onClick={() => setIsAliasLocked(!isAliasLocked)} 
                    style={{ 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        opacity: isAliasLocked ? 0.45 : 1, transition: 'all 0.2s' 
                    }}
                    title={isAliasLocked ? "Desbloquear edición de Alias" : "Bloquear Alias"}
                >
                    <IndraIcon name={isAliasLocked ? "LOCK" : "UNLOCK"} size="8px" style={{ color: isAliasLocked ? 'inherit' : 'var(--color-warning)' }} />
                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: isAliasLocked ? 'inherit' : 'var(--color-warning)' }}>ALIAS</span>
                </div>
                <input
                    type="text"
                    className="macro-header__title-input"
                    value={aliasDraft}
                    disabled={isAliasLocked}
                    onChange={(e) => setAliasDraft(sanitizeAlias(e.target.value))}
                    onBlur={() => commit(labelDraft, aliasDraft)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                            setAliasDraft(initialAlias || '');
                            e.currentTarget.blur();
                        }
                    }}
                    placeholder="alias_tecnico"
                    spellCheck={false}
                    style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        opacity: isAliasLocked ? 0.4 : 0.95,
                        color: aliasCollision ? 'var(--color-danger)' : 'inherit',
                        borderBottomColor: aliasCollision ? 'var(--color-danger)' : (isAliasLocked ? 'transparent' : 'var(--color-border-strong)'),
                        height: '18px',
                        cursor: isAliasLocked ? 'not-allowed' : 'text',
                        background: 'transparent'
                    }}
                />
                {aliasCollision && (
                    <span style={{
                        fontSize: '8px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-danger)',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap'
                    }}>
                        ALIAS_EN_USO
                    </span>
                )}
            </div>
        </div>
    );
}

