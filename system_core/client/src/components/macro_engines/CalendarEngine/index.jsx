import React, { useState } from 'react';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Spinner } from '../../utilities/primitives';
import { NexusServiceSlot } from '../../utilities/NexusServiceSlot';

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
    const { updatePinIdentity } = useWorkspace();
    const { events, calendars, loading, error, refresh } = useCalendarHydration(atom, bridge);

    const [viewMode, setViewMode] = useState('MULTI_REALITY'); // MULTI_REALITY | ATOMIC
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    const [localLabel, setLocalLabel] = useState(atom?.handle?.label || 'UNIVERSAL_CALENDAR');
    const accentColor = '#00d2d3';

    const handleTitleChange = (newLabel) => {
        setLocalLabel(newLabel);
        updatePinIdentity(atom.id, atom.provider, { label: newLabel });
    };

    const moveDate = (days) => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + days);
        setCurrentDate(next);
    };

    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': 'rgba(0, 210, 211, 0.2)',
        '--indra-dynamic-bg': 'rgba(0, 210, 211, 0.05)',
    };

    return (
        <div className="macro-designer fill calendar-engine" style={dynamicStyles}>
            {/* 0. INDRA MACRO HEADER */}
            <IndraMacroHeader
                atom={{ ...atom, handle: { ...atom.handle, label: localLabel } }}
                onClose={() => bridge?.close?.()}
                onTitleChange={handleTitleChange}
                isSaving={false}
            />

            {/* 1. CONTROL HOOD */}
            <div className="indra-container" style={{ minHeight: '50px' }}>
                <div className="indra-header-label">TEMPORAL_COMMAND_CENTER</div>
                <div className="engine-hood p-2 p-x-3 flex align-center gap-3">
                    <div className="shelf--tight mr-3 p-1 bg-void rounded">
                        <button className={`btn btn--xs ${viewMode === 'MULTI_REALITY' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setViewMode('MULTI_REALITY')}>
                            <IndraIcon name="LAYERS" size="12px" /> MULTI_REALITY
                        </button>
                        <button className={`btn btn--xs ${viewMode === 'ATOMIC' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setViewMode('ATOMIC')}>
                            <IndraIcon name="DATABASE" size="12px" /> ATOMIC_SILO
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
                        <button className="btn btn--xs btn--ghost" onClick={refresh} title="REFRESCAR_FLUJOS">
                            <IndraIcon name="REFRESH" size="14px" />
                        </button>
                        <button className="btn btn--xs btn--accent" style={{ background: 'var(--indra-dynamic-accent)', color: '#000' }}>
                            <IndraIcon name="PLUS" size="14px" /> NUEVO_EVENTO
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. DESIGNER BODY */}
            <div className="designer-body">
                <div className="indra-container fill overflow-hidden">
                    <div className="indra-header-label">CHRONOS_FABRIC</div>
                    
                    <div className="reality-viewport fill p-0">
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
                <div className="indra-container overflow-hidden" style={{ width: '380px', flexShrink: 0 }}>
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
                                        <span className="font-mono text-xs font-bold" style={{ color: 'var(--indra-dynamic-accent)' }}>OPERACIONES_BINARIAS</span>
                                        <IndraIcon name="SETTINGS" size="14px" className="opacity-40" />
                                    </div>
                                    <div className="grid grid-2 gap-2">
                                        <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">REPROGRAMAR</button>
                                        <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">MIGRAR_SILO</button>
                                        <button className="btn btn--xs btn--ghost border-dim text-2xs truncate">COPIAR_ID</button>
                                        <button className="btn btn--xs btn--ghost border-red text-2xs truncate">ELIMINAR</button>
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
                                            <span className="font-mono text-xs font-bold uppercase" style={{ color: 'var(--indra-dynamic-accent)' }}>CONTROL_DE_SILOS</span>
                                            <div className="font-mono text-3xs opacity-40 mt-1">Multi-Reality Management</div>
                                        </div>
                                        <div className="bg-void p-1 px-2 border-all font-mono text-2xs font-bold">
                                            {calendars?.length || 0}
                                        </div>
                                    </div>
                                    
                                    <div className="stack gap-2 mt-2">
                                        {calendars?.length > 0 ? (
                                            calendars.map(cal => (
                                                <div key={cal.id} className="silo-card indra-container p-3 shelf--loose active">
                                                    <div className="shelf--tight fill">
                                                        <div 
                                                            className="color-dot mr-2" 
                                                            style={{ 
                                                                width: '10px', height: '10px', borderRadius: '50%',
                                                                backgroundColor: cal.payload?.fields?.color || 'var(--indra-dynamic-accent)',
                                                                boxShadow: `0 0 10px ${cal.payload?.fields?.color || 'var(--indra-dynamic-accent)'}40`
                                                            }} 
                                                        />
                                                        <div className="stack--tight fill">
                                                            <div className="font-mono text-xs font-bold truncate pr-3">{cal.handle?.label}</div>
                                                            <div className="font-mono text-3xs opacity-40">{cal.id === 'primary' ? 'CANAL_MAESTRO' : 'CANAL_VINCULADO'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="shelf--tight">
                                                        <IndraIcon name="EYE" size="14px" className="opacity-60 pointer hover-accent" />
                                                        <IndraIcon name="SETTINGS" size="14px" className="opacity-40" />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="stack center border-all border-dashed p-6 opacity-30 bg-void">
                                                <IndraIcon name="DATABASE" size="48px" />
                                                <span className="font-mono text-2xs mt-4 text-center">
                                                    BUSCANDO_FLUJOS_TEMPORALES...
                                                </span>
                                            </div>
                                        )}
                                        <button className="btn btn--xs btn--ghost border-dim mt-2 py-2">
                                            <IndraIcon name="PLUS" size="10px" className="mr-1" /> VINCULAR_NUEVA_REALIDAD
                                        </button>
                                    </div>
                                </div>

                                <div className="stack gap-3 border-top pt-4">
                                    <span className="font-mono text-3xs opacity-40 uppercase">// INFRASTRUCTURE_SECURITY</span>
                                    <NexusServiceSlot 
                                        providerId="calendar_universal" 
                                        label="GOOGLE_CALENDAR_NEXUS"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. FOOTER */}
            <div className="indra-footer flex align-center justify-between">
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
        </div>
    );
}

export default CalendarEngine;
