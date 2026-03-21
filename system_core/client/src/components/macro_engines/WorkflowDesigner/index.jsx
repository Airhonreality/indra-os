import React, { useState } from 'react';
import { useShell } from '../../../context/ShellContext';
import { useWorkflow, WorkflowProvider } from './context/WorkflowContext';
import { StationCard } from './StationCard';
import { WorkflowTrigger } from './WorkflowTrigger';
import { WorkflowInspector } from './WorkflowInspector';
import { WorkflowSandbox } from './WorkflowSandbox';
import { useWorkflowExecution } from './useWorkflowExecution';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import './WorkflowDesigner.css';

/**
 * =============================================================================
 * MOTOR MACRO: WorkflowDesigner (Orquestador de Manifestación)
 * DOGMA: Purificación Estética y Resonancia Modular
 * =============================================================================
 */

function WorkflowDesignerContent({ bridge }) {
    const { closeArtifact } = useShell();
    const {
        workflow,
        isLoading,
        isSaving,
        selectedStationId,
        setSelectedStationId,
        addStation,
        updateTrigger,
        saveWorkflow,
        integrityMap // Extraemos el mapa de integridad calculado por useWorkflowHydration
    } = useWorkflow();

    const [showSandbox, setShowSandbox] = useState(false);
    const { status, traceLogs, runTrace, currentStepId } = useWorkflowExecution(workflow);

    if (isLoading && !workflow) {
        return (
            <div className="center fill stack opacity-50">
                <IndraIcon name="LOGIC" size="32px" className="spin" />
                <span className="indra-field-label" style={{ marginTop: '12px' }}>SINCRONIZANDO_FLUIDO</span>
            </div>
        );
    }

    const accentColor = workflow.metadata?.brand_mark?.accent || '#00f5d4';

    return (
        <div
            className="macro-designer-wrapper fill workflow-layout-shell"
            style={{ 
                '--indra-dynamic-accent': accentColor,
                '--indra-dynamic-bg': `${accentColor}10`,
                '--indra-dynamic-border': `${accentColor}30`,
                '--indra-dynamic-glow': `${accentColor}20`
            }}
            data-resonance={isLoading ? 'active' : 'idle'}
            lang="es"
        >
            <IndraMacroHeader
                atom={workflow}
                bridge={bridge}
                onClose={() => closeArtifact()}
                rightSlot={
                    <button 
                        className={`btn ${isSaving ? 'btn--ghost' : 'btn--accent'} shelf--tight`} 
                        onClick={(e) => { e.stopPropagation(); saveWorkflow(); }}
                        disabled={isSaving}
                    >
                        <IndraIcon name={isSaving ? 'SYNC' : 'SAVE'} size="12px" className={isSaving ? 'spin' : ''} />
                        <span className="font-mono" style={{ fontSize: '10px' }}>
                            {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                        </span>
                    </button>
                }
            />

            <div className="workflow-triptych-body">
                
                {/* 1. LIENZO (70% - Izquierda) */}
                <main className="workflow-column-canvas" onClick={() => setSelectedStationId(null)}>
                    <div className="pipeline-viewport fill">
                        <div className="station-stack-vertical" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8) 0' }}>
                            
                            {/* Gatillo (Ignición Modular) */}
                            {workflow.payload?.trigger && (
                                <div style={{ marginBottom: 'var(--space-8)' }}>
                                    <WorkflowTrigger 
                                        trigger={workflow.payload.trigger} 
                                        onUpdate={updateTrigger} 
                                        isSelected={selectedStationId === 'trigger'}
                                        onSelect={() => setSelectedStationId('trigger')}
                                        isExecuting={status === 'RUNNING' && !currentStepId} // Primer estado
                                    />
                                </div>
                            )}

                            {/* Estaciones de Orquestación */}
                            {workflow.payload?.stations?.map((station, index) => (
                                <React.Fragment key={station.id}>
                                    <div className="flow-line-connector-v">
                                        <div className={`pipe-glow-v ${currentStepId === station.id ? 'active' : ''}`} />
                                    </div>
                                    <StationCard
                                        index={index}
                                        station={station}
                                        isSelected={selectedStationId === station.id}
                                        isExecuting={currentStepId === station.id}
                                        integrityStatus={integrityMap?.[station.id]}
                                        onSelect={(e) => {
                                            if (e) e.stopPropagation();
                                            setSelectedStationId(station.id);
                                        }}
                                    />
                                </React.Fragment>
                            ))}

                            <div className="flow-line-connector-v" style={{ opacity: 0.1 }} />
                            <div className="indra-field-label" style={{ opacity: 0.2, fontSize: '7px' }}>FIN_DEL_FLUJO</div>
                        </div>
                    </div>

                    {/* SANDBOX HUD (Overlay) */}
                    <div className={`workflow-sandbox-hud ${showSandbox ? 'active' : ''}`}>
                        <div className="spread pointer" onClick={() => setShowSandbox(!showSandbox)} style={{ padding: 'var(--space-3)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <span className="indra-field-label" style={{ color: 'var(--color-accent)' }}>EJECUCIÓN_ESTADO // {status}</span>
                            <IndraIcon name={showSandbox ? 'ARROW_DOWN' : 'ARROW_UP'} size="10px" />
                        </div>
                        <div style={{ height: '200px' }}>
                            <WorkflowSandbox status={status} traceLogs={traceLogs} runTrace={runTrace} />
                        </div>
                    </div>
                </main>

                {/* 2. PANEL DE ESCRUTINIO (30% - Derecha) */}
                <aside className="workflow-column-multimodal">
                    
                    <div className="multimodal-header stack" style={{ padding: 'var(--space-5)', gap: 'var(--space-6)' }}>
                        <div className="stack--tight">
                            <div className="indra-field-label">01 // DISPARADOR / ENTRADA</div>
                            <div className="shelf--tight" style={{ gap: '10px' }}>
                                <div className="lego-tool" onClick={() => updateTrigger({ type: 'MANUAL', label: 'IGNICIÓN_MANUAL' })} title="Acción Humana">
                                    <IndraIcon name="PLAY" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>BOTÓN</span>
                                </div>
                                <div className="lego-tool" onClick={() => updateTrigger({ type: 'TIME_TICK', label: 'IGNICIÓN_PROGRAMADA' })} title="Reloj de Indra">
                                    <IndraIcon name="TIME" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>RELOJ</span>
                                </div>
                                <div className="lego-tool" onClick={() => updateTrigger({ type: 'WEBHOOK', label: 'IGNICIÓN_RECEPCIÓN' })} title="Pulso Webhook">
                                    <IndraIcon name="SYNC" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>PULSO</span>
                                </div>
                            </div>
                        </div>

                        <div className="stack--tight">
                            <div className="indra-field-label">02 // PASOS / FLUJO</div>
                            <div className="shelf--tight" style={{ gap: '10px' }}>
                                <div className="lego-tool" onClick={() => addStation('PROTOCOL')} title="Acción Atómica">
                                    <IndraIcon name="SERVICE" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>ACCIÓN</span>
                                </div>
                                <div className="lego-tool" onClick={() => addStation('ROUTER')} title="Bifurcación de Rama">
                                    <IndraIcon name="LOGIC" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>BIFUR</span>
                                </div>
                                <div className="lego-tool" onClick={() => addStation('MAP')} title="Mapeador de Energía">
                                    <IndraIcon name="SCHEMA" size="14px" />
                                    <span className="font-mono" style={{ fontSize: '7px' }}>MAPEADO</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hud-line" style={{ opacity: 0.1 }} />

                    <div className="multimodal-body fill stack overflow-hidden">
                        {selectedStationId ? (
                            <div className="fill stack overflow-hidden">
                                <div className="indra-field-label" style={{ padding: 'var(--space-4) var(--space-4) 0 var(--space-4)' }}>03 // PROPIEDADES</div>
                                <div className="fill" style={{ overflowY: 'auto' }}>
                                    <WorkflowInspector />
                                </div>
                            </div>
                        ) : (
                            <div className="center stack opacity-20" style={{ height: '100%', padding: 'var(--space-8)' }}>
                                <IndraIcon name="SEARCH" size="32px" />
                                <span className="indra-field-label" style={{ marginTop: '12px', textAlign: 'center' }}>SELECCIONAR_ÁTOMO</span>
                            </div>
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
}

// ── ENVOLTORIO DE CONTEXTO ──
export function WorkflowDesigner({ atom, bridge }) {
    return (
        <WorkflowProvider key={atom.id} initialData={atom} bridge={bridge}>
            <WorkflowDesignerContent bridge={bridge} />
        </WorkflowProvider>
    );
}
