import React, { useState } from 'react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { NexusServiceSlot } from '../../utilities/NexusServiceSlot';
import { IndraFractalTree } from '../../utilities/IndraFractalTree';
import { useLexicon } from '../../../services/lexicon';
import { prepareCanonicalRename, commitCanonicalRename } from '../../../services/rename_protocol_runtime';

import { useCalendarHydration } from './hooks/useCalendarHydration';
import { TimelineGrid } from './components/TimelineGrid';
import { EventAtomUI } from './components/EventAtomUI';

import './CalendarEngine.css';

/**
 * =============================================================================
 * MACRO ENGINE: CalendarEngine (Universal)
 * RESPONSABILIDAD: Proyectar realidades temporales unificadas.
 * AXIOMA: No es un silo, es una ventana a múltiples silos.
 * =============================================================================
 */

export function CalendarEngine({ atom, bridge }) {
    const { updateAxiomaticIdentity } = useWorkspace();
    const t = useLexicon();
    const { events, calendars, account, loading, error, refresh } = useCalendarHydration(atom, bridge);

    const [viewMode, setViewMode] = useState('MULTI_REALITY'); // MULTI_REALITY | ATOMIC
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [renameError, setRenameError] = useState('');
    
    const [localHandle, setLocalHandle] = useState({
        ...(atom?.handle || {}),
        label: atom?.handle?.label || 'UNIVERSAL_CALENDAR'
    });

    const handleIdentityChange = async ({ label: newLabel, alias: newAlias }) => {
        const cleanLabel = newLabel || 'UNIVERSAL_CALENDAR';
        const cleanAlias = String(newAlias || '').trim() || localHandle?.alias;
        const prevAlias = String(localHandle?.alias || '').trim();
        const aliasChanged = !!cleanAlias && cleanAlias !== prevAlias;

        if (aliasChanged) {
            try {
                const prepared = await prepareCanonicalRename({
                    bridge,
                    provider: atom.provider || 'system',
                    protocol: 'ATOM_ALIAS_RENAME',
                    contextId: atom.id,
                    kind: 'ATOM_ALIAS',
                    data: {
                        old_alias: prevAlias || undefined,
                        new_alias: cleanAlias,
                        new_label: cleanLabel,
                    },
                });

                if (prepared.status === 'PENDING') {
                    setRenameError('');
                    setPendingRename(prepared.pendingRename);
                    return;
                }

                if (prepared.status === 'NOOP' && prepared.result?.items?.[0]) {
                    const syncedAtom = prepared.result.items[0];
                    const syncedHandle = {
                        ...(syncedAtom.handle || {}),
                        label: syncedAtom.handle?.label || 'UNIVERSAL_CALENDAR'
                    };
                    setLocalHandle(syncedHandle);
                    updateAxiomaticIdentity(atom.id, atom.provider, {
                        label: syncedHandle.label,
                        alias: syncedHandle.alias,
                        handle: syncedHandle
                    });
                    return;
                }
            } catch (err) {
                setRenameError(String(err?.message || 'No se pudo validar el renombrado.'));
                return;
            }
        }

        const nextHandle = {
            ...localHandle,
            label: cleanLabel,
            ...(cleanAlias ? { alias: cleanAlias } : {})
        };
        setLocalHandle(nextHandle);
        updateAxiomaticIdentity(atom.id, atom.provider, {
            label: cleanLabel,
            ...(cleanAlias ? { alias: cleanAlias } : {}),
            handle: nextHandle
        });
        
        // PUREZA: Persistir identidad
        bridge.save({
            ...atom,
            handle: { ...atom.handle, ...nextHandle }
        });
    };

    const cancelPendingRename = () => {
        setPendingRename(null);
        setIsCommittingRename(false);
        setRenameError('');
    };

    const confirmPendingRename = async () => {
        if (!pendingRename || pendingRename?.preview?.has_blockers) return;
        setIsCommittingRename(true);
        setRenameError('');
        try {
            const result = await commitCanonicalRename({ bridge, pendingRename });
            const syncedAtom = result.items[0];
            const syncedHandle = {
                ...(syncedAtom.handle || {}),
                label: syncedAtom.handle?.label || 'UNIVERSAL_CALENDAR'
            };
            setLocalHandle(syncedHandle);
            updateAxiomaticIdentity(atom.id, atom.provider, {
                label: syncedHandle.label,
                alias: syncedHandle.alias,
                handle: syncedHandle
            });
            setPendingRename(null);
            setIsCommittingRename(false);
        } catch (err) {
            setRenameError(String(err?.message || 'No se pudo ejecutar el commit del renombrado.'));
            setIsCommittingRename(false);
        }
    };

    const moveDate = (days) => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + days);
        setCurrentDate(next);
    };

    return (
        <div className="macro-designer fill calendar-engine stack" style={{ backgroundColor: 'var(--color-bg-void)', overflow: 'hidden' }}>
            {/* 0. INDRA MACRO HEADER (Consumo Automático de Identidad) */}
            <IndraMacroHeader
                atom={{ ...atom, handle: { ...atom.handle, ...localHandle } }}
                onClose={() => bridge?.close?.()}
                onIdentityChange={handleIdentityChange}
                isSaving={false}
            />

            {/* ENVOLTURA TOPOLÓGICA DEL MOTOR (Respeto a Variables Globales) */}
            <div className="fill stack overflow-hidden" style={{ padding: 'var(--indra-ui-margin)', gap: 'var(--indra-ui-gap)' }}>
                
                {/* 1. CONTROL HOOD */}
                <div className="indra-container" style={{ minHeight: '64px', flexShrink: 0 }}>
                    <div className="indra-header-label">{t('ui_controls')}</div>
                    <div className="engine-hood p-2 px-3 flex align-center gap-3 fill">
                        <div className="shelf--tight mr-3 p-1 bg-void rounded flex">
                            <button className={`btn btn--xs ${viewMode === 'MULTI_REALITY' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setViewMode('MULTI_REALITY')}>
                                <IndraIcon name="LAYERS" size="12px" /> {t('ui_multi_view')}
                            </button>
                            <button className={`btn btn--xs ${viewMode === 'ATOMIC' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setViewMode('ATOMIC')}>
                                <IndraIcon name="DATABASE" size="12px" /> {t('ui_silo_view')}
                            </button>
                        </div>

                        <div className="shelf--tight border-left pl-3 ml-2">
                            <button className="btn btn--xs btn--ghost" onClick={() => moveDate(-7)}>
                                <IndraIcon name="CHEVRON_LEFT" size="14px" />
                            </button>
                            <span className="font-mono text-xs font-bold uppercase mx-3 flex align-center" style={{ width: '180px', justifyContent: 'center', letterSpacing: '1px' }}>
                                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </span>
                            <button className="btn btn--xs btn--ghost" onClick={() => moveDate(7)}>
                                <IndraIcon name="CHEVRON_RIGHT" size="14px" />
                            </button>
                        </div>

                        <div className="flex-1" />

                        <div className="shelf--tight gap-2">
                            <button className="btn btn--xs btn--ghost" onClick={refresh} title={t('action_refresh')}>
                                <IndraIcon name="REFRESH" size="14px" />
                            </button>
                            <button 
                                className={`btn btn--xs ${calendars?.length > 0 ? 'btn--accent' : 'btn--ghost border-dim opacity-50'}`} 
                                style={calendars?.length > 0 ? { background: 'var(--indra-dynamic-accent)', color: '#000' } : {}}
                                disabled={!calendars?.length}
                            >
                                <IndraIcon name="PLUS" size="14px" /> {t('action_new_event')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. DESIGNER BODY */}
                <div className="designer-body fill shelf" style={{ gap: 'var(--indra-ui-gap)', minHeight: 0 }}>
                    <div className="indra-container fill overflow-hidden relative">
                        <div className="indra-header-label">{t('ui_calendar')}</div>
                        
                        <div className="reality-viewport fill p-0 relative">
                            {loading && events.length === 0 ? (
                                <div className="fill center bg-void z-50">
                                    <Spinner label="SINCRONIZANDO_REALIDADES_TEMPORALES" />
                                </div>
                            ) : (
                                <TimelineGrid 
                                    currentDate={currentDate} 
                                    events={events} 
                                    viewMode={viewMode}
                                    onEventClick={setSelectedEvent}
                                />
                            )}
                        </div>
                    </div>

                    {/* 3. TEMPORAL INSPECTOR / SILO CONTROL */}
                    <div className="indra-container overflow-hidden relative" style={{ width: '380px', flexShrink: 0 }}>
                        <div className="indra-header-label">TEMPORAL_INSPECTOR</div>
                        
                        <div className="flex-1 overflow-y-auto p-4 scroll-minimal stack gap-5" style={{ marginTop: '20px' }}>
                            {selectedEvent ? (
                                <div className="animate-fade-in stack gap-5">
                                    <div>
                                        <div className="font-mono text-3xs opacity-40 uppercase mb-3">// ATOM_PROJECTION</div>
                                        <EventAtomUI event={selectedEvent} />
                                    </div>

                                    <div className="stack gap-3 border-top pt-4">
                                        <div className="spread align-center">
                                            <span className="font-mono text-xs font-bold" style={{ color: 'var(--indra-dynamic-accent)' }}>{t('ui_binary_operations')}</span>
                                            <IndraIcon name="SETTINGS" size="14px" className="opacity-40" />
                                        </div>
                                        <div className="grid grid-2 gap-2">
                                            <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">{t('action_reschedule')}</button>
                                            <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">{t('action_migrate_silo')}</button>
                                            <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">{t('action_copy_id')}</button>
                                            <button className="btn btn--xs btn--ghost border-red text-2xs truncate">{t('action_delete')}</button>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-void border-all opacity-80 rounded">
                                        <div className="font-mono text-3xs opacity-40 mb-2">// METADATA_SHAFT</div>
                                        <div className="stack gap-1">
                                            <div className="spread"><span className="font-mono text-3xs opacity-40">ID:</span> <span className="font-mono text-3xs truncate select-text">{selectedEvent.id}</span></div>
                                            <div className="spread"><span className="font-mono text-3xs opacity-40">SILO:</span> <span className="font-mono text-3xs font-bold">{selectedEvent.payload?.fields?.source_identity?.silo}</span></div>
                                        </div>
                                    </div>

                                    <button className="btn btn--xs btn--ghost border-dim w-100" onClick={() => setSelectedEvent(null)}>
                                        ⟵ CERRAR_INSPECTOR
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in stack gap-5">
                                    <div className="stack gap-3">
                                        <div className="spread align-center shelf--loose border-bottom pb-2">
                                            <div>
                                                <span className="font-mono text-xs font-bold uppercase" style={{ color: 'var(--indra-dynamic-accent)' }}>{t('ui_silo_control')}</span>
                                                <div className="font-mono text-3xs opacity-40 mt-1">
                                                    {account ? `${t('ui_session')}: ${account.handle?.label}` : t('status_loading')}
                                                </div>
                                            </div>
                                            <div className="bg-void p-1 px-2 border-all font-mono text-2xs font-bold" style={{ color: calendars?.length > 0 ? 'var(--indra-dynamic-accent)' : 'inherit' }}>
                                                {calendars?.length || 0}
                                            </div>
                                        </div>
                                        
                                        <div className="stack gap-2 mt-2">
                                            {calendars?.length > 0 ? (
                                                <IndraFractalTree 
                                                    data={calendars.map(cal => ({
                                                        ...cal,
                                                        label: cal.handle?.label || 'CALENDARIO_SIN_NOMBRE',
                                                        isPrimary: cal.id === 'primary'
                                                    }))}
                                                    renderItem={({ node }) => (
                                                        <div className="silo-card indra-container p-3 shelf--loose active mb-2">
                                                            <div className="shelf--tight fill">
                                                                <div 
                                                                    className="color-dot mr-2" 
                                                                    style={{ 
                                                                        width: '10px', height: '10px', borderRadius: '50%',
                                                                        backgroundColor: node.payload?.fields?.color || 'var(--indra-dynamic-accent)',
                                                                        boxShadow: `0 0 10px ${node.payload?.fields?.color || 'var(--indra-dynamic-accent)'}40`
                                                                    }} 
                                                                />
                                                                <div className="stack--tight fill">
                                                                    <div className="font-mono text-xs font-bold truncate pr-3">{node.label}</div>
                                                                    <div className="font-mono text-3xs opacity-40">{node.isPrimary ? 'CANAL_MAESTRO' : 'CANAL_VINCULADO'}</div>
                                                                </div>
                                                            </div>
                                                            <div className="shelf--tight">
                                                                <IndraIcon name="EYE" size="14px" className="opacity-60 pointer hover-accent" />
                                                                <IndraIcon name="SETTINGS" size="14px" className="opacity-40" />
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                            ) : (
                                                <div className="stack center border-all border-dashed p-6 opacity-30 bg-void">
                                                <IndraIcon name={error ? 'ALERT_TRIANGLE' : 'DATABASE'} size="48px" style={{ color: error ? 'var(--color-error)' : 'inherit' }} />
                                                <div className="font-mono text-xs opacity-60 text-center mt-2">
                                                    {error ? error : (loading ? 'SINCRONIZANDO_REALIDADES...' : 'NO_SE_DETECTARON_CALENDARIOS')}
                                                </div>
                                            </div>
                                            )}
                                            <button className="btn btn--xs py-2 w-100 mt-2" style={{ border: '1px solid var(--indra-dynamic-accent)', color: 'var(--indra-dynamic-accent)', background: 'var(--indra-dynamic-bg)' }}>
                                                <IndraIcon name="PLUS" size="10px" className="mr-2" /> {t('action_link_reality')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="stack gap-3 border-top pt-4">
                                    <span className="font-mono text-3xs opacity-40 uppercase">// INFRASTRUCTURE_SECURITY</span>
                                    <NexusServiceSlot 
                                        providerId="calendar_universal" 
                                        label={account ? `SINCERADO: ${account.handle?.label}` : "CONEXIÓN_NATIVA_INDRA"}
                                    />
                                </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. FOOTER */}
            <div className="indra-footer flex align-center justify-between" style={{ padding: '0 var(--indra-ui-margin)', height: '28px', borderTop: '1px solid var(--indra-dynamic-border)', background: 'var(--color-bg-void)' }}>
                <div className="shelf--loose">
                    <div className="shelf--tight">
                        <span className="font-mono text-3xs opacity-40">READY:</span>
                        <div className="color-dot" style={{ width: '6px', height: '6px', backgroundColor: '#00ff9d', borderRadius: '50%' }} />
                    </div>
                    <div className="shelf--tight ml-3">
                        <span className="font-mono text-3xs opacity-40">REALITY:</span>
                        <span className="font-mono text-3xs font-bold text-accent">{viewMode}</span>
                    </div>
                    <div className="shelf--tight ml-3">
                        <span className="font-mono text-3xs opacity-40">SYNC:</span>
                        <span className="font-mono text-3xs">{loading ? 'STREAMEANDO...' : 'SINCERADO'}</span>
                    </div>
                </div>
                <div className="shelf--tight opacity-40">
                    <span className="font-mono text-3xs uppercase mr-4">ADR_015 // UNIVERSAL_CALENDAR_PROVIDER</span>
                    <span className="font-mono text-3xs">v2.0_INDUSTRIAL</span>
                </div>
            </div>

            <RenameDryRunModal
                pendingRename={pendingRename}
                isCommitting={isCommittingRename}
                error={renameError}
                onCancel={cancelPendingRename}
                onConfirm={confirmPendingRename}
            />
        </div>
    );
}

export default CalendarEngine;
