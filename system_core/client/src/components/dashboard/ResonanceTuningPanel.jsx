/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ResonanceTuningPanel.jsx
 * RESPONSABILIDAD: Sintonía de esquemas externos (Nexus/Resonancia).
 *
 * DHARMA:
 *   - Sinceridad de Origen: Muestra de dónde viene el dato.
 *   - Sintonía Biyectiva: Control total sobre el flujo de verdad.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';
import { executeDirective } from '../../services/directive_executor';
export function ResonanceTuningPanel({ artifact, onConfirm, onCancel }) {
    const [mode, setMode] = useState(artifact.resonance_config?.mode || 'MIRROR'); // MIRROR | SOVEREIGN
    const [frequency, setFrequency] = useState(artifact.resonance_config?.frequency || 'LATENT'); // LOW | LATENT | VITAL
    const [mutedFields, setMutedFields] = useState(artifact.resonance_config?.mutedFields || artifact.resonance_config?.muted_fields || []);
    const [fieldMappings, setFieldMappings] = useState({});
    const [publishImmediately, setPublishImmediately] = useState(false);
    const [inductionMonitor, setInductionMonitor] = useState({ step: 'READY', status: 'IDLE', message: null, error: null });
    const [isInducing, setIsInducing] = useState(false);
    const [currentTicketId, setCurrentTicketId] = useState(null);
    
    // ESTADOS DEL NEXO (Quantum Binding)
    const [targetSchema, setTargetSchema] = useState(null);
    const [isSelectingSchema, setIsSelectingSchema] = useState(false);
    const [schemaFields, setSchemaFields] = useState([]);
    const [previewData, setPreviewData] = useState([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    const {
        pins,
        coreUrl,
        sessionSecret,
        lang,
        activeWorkspaceId,
        inductionTicketId,
        inductionTicketSnapshot,
        setInductionTicket,
        refreshInductionTicket,
        clearInductionTicket
    } = useAppState();
    const t = useLexicon(lang);

    const fields = artifact.payload?.fields || [];
    const provider = artifact.provider || 'UNKNOWN';

    const [analysisReport, setAnalysisReport] = useState(null);

    // AXIOMA DE SINCERIDAD: Cargar datos reales y previsualizar transformación cognitiva
    React.useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoadingPreview(true);
            try {
                // Si hay un schema destino, usamos el motor de RESONANCIA pura
                if (targetSchema) {
                    const result = await executeDirective({
                        provider: 'compute', // El cerebro de Indra
                        protocol: 'RESONANCE_ANALYZE',
                        data: {
                            bridge_atom: {
                                payload: {
                                    source_provider: artifact.provider,
                                    target_provider: targetSchema.provider,
                                    mappings: { [targetSchema.id]: fieldMappings }
                                }
                            },
                            sat_payload: { items: previewData.length ? previewData : [{ id: 'mock', payload: { fields: {} } }] },
                            dry_run: true
                        }
                    }, coreUrl, sessionSecret);
                    
                    setAnalysisReport(result.metadata?.resonance || null);
                } else {
                    // Si no hay destino, solo cargamos el stream crudo original
                    const result = await executeDirective({
                        provider: artifact.provider,
                        protocol: 'TABULAR_STREAM',
                        context_id: artifact.id,
                        query: { limit: 5 }
                    }, coreUrl, sessionSecret);
                    setPreviewData(result.items || []);
                }
            } catch (err) {
                console.error("[Resonance] Fallo en análisis cognitivo:", err);
            } finally {
                setIsLoadingPreview(false);
            }
        };

        const timer = setTimeout(fetchAnalysis, 500); // Debounce para no saturar el core
        return () => clearTimeout(timer);
    }, [artifact, targetSchema, fieldMappings, coreUrl, sessionSecret]);

    const hydrateSchemaFromId = async (schemaId) => {
        if (!schemaId) return;
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: schemaId
            }, coreUrl, sessionSecret);

            const schema = result.items?.[0];
            if (schema) {
                setTargetSchema(schema);
                setSchemaFields(schema.payload?.fields || []);
            }
        } catch (err) {
            console.warn('[Resonance] No se pudo hidratar schema inducido:', err?.message || err);
        }
    };

    React.useEffect(() => {
        const shouldReconnect = inductionTicketId && inductionTicketSnapshot?.source_artifact?.id === artifact.id;
        if (!shouldReconnect) return;

        setCurrentTicketId(inductionTicketId);
        setInductionMonitor({
            step: inductionTicketSnapshot.step || 'IN_PROGRESS',
            status: inductionTicketSnapshot.status || 'IN_PROGRESS',
            message: inductionTicketSnapshot.status === 'COMPLETED' ? 'Inducción reenganchada tras refresco.' : 'Proceso de inducción en seguimiento.',
            error: inductionTicketSnapshot.errors?.[0] || null
        });

        if (inductionTicketSnapshot?.result?.schema_id) {
            hydrateSchemaFromId(inductionTicketSnapshot.result.schema_id);
        }
    }, [artifact.id, inductionTicketId, inductionTicketSnapshot]);

    const toggleField = (id) => {
        setMutedFields(prev => 
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSelectSchema = async (schemaPin) => {
        setIsSelectingSchema(false);
        try {
            // Hidratamos el schema para obtener sus campos (REPEATERs/Slots)
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_READ',
                context_id: schemaPin.id
            }, coreUrl, sessionSecret);
            
            const fullSchema = result.items?.[0];
            if (fullSchema) {
                setTargetSchema(fullSchema);
                setSchemaFields(fullSchema.payload?.fields || []);
            }
        } catch (err) {
            console.error('[Nexus] Failed to load target schema:', err);
        }
    };

    const updateMapping = (sourceFieldId, targetFieldId) => {
        setFieldMappings(prev => ({
            ...prev,
            [sourceFieldId]: targetFieldId
        }));
    };

    const handleAutoGenerateSchema = async () => {
        if (isInducing) return;
        setIsInducing(true);
        setInductionMonitor({ step: 'VALIDATING', status: 'IN_PROGRESS', message: 'Validando contrato de entrada...', error: null });
        try {
            const inductionResult = await executeDirective({
                provider: 'system',
                protocol: 'INDUCTION_INDUCE_FULL_STACK',
                workspace_id: activeWorkspaceId,
                data: {
                    source_artifact: artifact,
                    muted_fields: mutedFields,
                    publish_immediately: publishImmediately
                }
            }, coreUrl, sessionSecret);

            const ticketId = inductionResult.metadata?.ticket_id || null;
            const ticket = inductionResult.metadata?.ticket || null;
            if (ticketId) {
                setCurrentTicketId(ticketId);
                setInductionTicket(ticketId, ticket || { ticket_id: ticketId, status: 'IN_PROGRESS' });
            }

            if (inductionResult.metadata?.status === 'OK') {
                const schemaAtom = inductionResult.metadata?.schema_atom;
                const bridgeAtom = inductionResult.metadata?.bridge_atom;
                if (schemaAtom) {
                    setTargetSchema(schemaAtom);
                    setSchemaFields(schemaAtom.payload?.fields || []);
                }

                const mapping = bridgeAtom?.payload?.mappings?.[schemaAtom?.id] || {};
                setFieldMappings(mapping);
                setInductionMonitor({
                    step: inductionResult.metadata?.step || 'COMPLETED',
                    status: 'COMPLETED',
                    message: 'Inducción industrial completada. Schema y Bridge generados.',
                    error: null
                });
            } else {
                setInductionMonitor({
                    step: inductionResult.metadata?.step || 'FAILED',
                    status: 'ERROR',
                    message: null,
                    error: inductionResult.metadata?.error || 'INDUCTION_FAILED'
                });
            }
        } catch (error) {
            console.error('[Resonance] Error en inducción industrial:', error);
            setInductionMonitor({ step: 'FAILED', status: 'ERROR', message: null, error: error.message || 'INDUCTION_FAILED' });
        } finally {
            setIsInducing(false);
        }
    };

    const handleRefreshTicket = async () => {
        const ticket = await refreshInductionTicket();
        if (!ticket) return;

        setCurrentTicketId(ticket.ticket_id);
        setInductionMonitor({
            step: ticket.step || 'IN_PROGRESS',
            status: ticket.status || 'IN_PROGRESS',
            message: ticket.status === 'COMPLETED' ? 'Ticket sincronizado correctamente.' : 'Estado de inducción actualizado desde Core.',
            error: ticket.errors?.[0] || null
        });

        if (ticket.result?.schema_id) {
            await hydrateSchemaFromId(ticket.result.schema_id);
        }
    };

    const handleCancelTicket = async () => {
        const ticketId = currentTicketId || inductionTicketId;
        if (!ticketId) return;

        try {
            await executeDirective({
                provider: 'system',
                protocol: 'INDUCTION_CANCEL',
                data: { ticket_id: ticketId }
            }, coreUrl, sessionSecret);

            setInductionMonitor({ step: 'CANCELLED', status: 'CANCELLED', message: 'Inducción cancelada por usuario.', error: null });
            clearInductionTicket();
            setCurrentTicketId(null);
        } catch (err) {
            console.error('[Resonance] No se pudo cancelar ticket:', err);
        }
    };

    const handleConfirm = () => {
        const resonance_config = {
            mode,
            frequency,
            muted_fields: mutedFields,
            mutedFields: mutedFields,
            nexus_binding: targetSchema ? {
                target_id: targetSchema.id,
                target_label: targetSchema.handle?.label || targetSchema.id,
                mappings: fieldMappings
            } : null
        };

        const resonantArtifact = {
            ...artifact,
            origin: 'RESONANT',
            resonance_config,
            resonance_ticket_id: currentTicketId || inductionTicketId || null,
            linked_schema_id: targetSchema?.id || null
        };

        onConfirm(resonantArtifact);
    };

    return (
        <div className="indra-overlay" onClick={onCancel}>
            <div className="indra-container glass-chassis stack--loose" style={{
                width: '100%',
                maxWidth: '1200px',
                height: '85vh',
                padding: 'var(--space-8)'
            }} onClick={e => e.stopPropagation()}>
                {/* ── HEADER CLARO Y DIRECTO ── */}
                <header className="spread" style={{ flexShrink: 0 }}>
                    <div className="stack--tight">
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>
                            Configurar Conexión de Datos
                        </h2>
                        <span className="util-label" style={{ opacity: 0.8 }}>
                            {provider.toUpperCase()} {" // "} <span style={{ opacity: 0.7 }}>{artifact.handle?.label || artifact.id}</span>
                        </span>
                    </div>
                    <button onClick={onCancel} className="btn btn--mini btn--ghost">
                        <IndraIcon name="CLOSE" size="20px" />
                    </button>
                </header>

                {/* ── LAYOUT DE DOS COLUMNAS ── */}
                {/* ── LAYOUT BIPARTITO (INDRA Standard) ── */}
                <div className="indra-layout-bipartite fill" style={{ background: 'transparent' }}>
                    
                    {/* COLUMNA A: SELECCIÓN DE CAMPOS (38.2%) */}
                    <div className="bipartite-side stack" style={{ minWidth: '340px', background: 'transparent' }}>
                        <div style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--space-2)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.7 }}>1. SELECCIONAR CAMPOS A IMPORTAR</span>
                        </div>
                        
                        <div style={{ overflowY: 'auto', paddingRight: 'var(--space-4)', flex: 1 }} className="stack--tight">
                            {fields.map(f => (
                                <div key={f.id} 
                                    className={`slot-small spread ${mutedFields.includes(f.id) ? 'opacity-30' : ''}`}
                                    style={{ 
                                        padding: 'var(--space-3) var(--space-4)', 
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleField(f.id)}
                                >
                                    <div className="shelf--loose">
                                        <div style={{ 
                                            width: '14px', height: '14px', 
                                            border: '1px solid var(--color-border)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: mutedFields.includes(f.id) ? 'transparent' : 'var(--color-accent)'
                                        }}>
                                             {!mutedFields.includes(f.id) && <IndraIcon name="CHECK" size="10px" color="var(--color-bg-void)" />}
                                         </div>
                                        <div className="stack--tight">
                                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{f.label || f.id}</span>
                                            <div className="shelf--tight">
                                                <span className="util-label">{f.type === 'COMPUTED' ? 'LÓGICA' : f.type}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MAPEO SI HAY SCHEMA */}
                                    {targetSchema && !mutedFields.includes(f.id) && (
                                        <div className="stack--tight" onClick={e => e.stopPropagation()} style={{ width: '45%' }}>
                                            <select 
                                                className="util-input--sm"
                                                style={{ width: '100%', padding: '4px' }}
                                                value={fieldMappings[f.id] || ''}
                                                onChange={(e) => updateMapping(f.id, e.target.value)}
                                            >
                                                <option value="">(Sin Mapear)</option>
                                                {schemaFields.map(sf => (
                                                    <option key={sf.id} value={sf.id}>{sf.label || sf.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUMNA B: REGLAS DE SINCRONÍA (61.8%) */}
                    <div className="bipartite-main stack" style={{ minHeight: 0, background: 'transparent' }}>

                        {/* ÁREA DE SCROLL PARA CONFIGURACIÓN */}
                        <div style={{ overflowY: 'auto', paddingRight: 'var(--space-2)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                            
                            {/* MODO DE ESCRITURA */}
                            <div className="stack--tight">
                                <span style={{ fontSize: '11px', marginBottom: 'var(--space-3)', display: 'block', color: 'var(--color-text-secondary)' }}>Permisos de Escritura</span>
                                <div className="stack--tight" style={{ gap: 'var(--space-2)' }}>
                                    <button 
                                        className={`btn ${mode === 'MIRROR' ? 'btn--accent' : 'btn--ghost'}`}
                                        onClick={() => setMode('MIRROR')}
                                        style={{ justifyContent: 'flex-start', padding: 'var(--space-4)', width: '100%', textAlign: 'left', border: mode === 'MIRROR' ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.1)' }}
                                    >
                                        <div className="stack--tight">
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Modo Espejo (Mirror)</span>
                                            <span style={{ fontSize: '9px', opacity: 0.6 }}>INDRA refleja el origen. Permisos de solo lectura.</span>
                                        </div>
                                    </button>
                                    <button 
                                        className={`btn ${mode === 'SOVEREIGN' ? 'btn--accent' : 'btn--ghost'}`}
                                        onClick={() => setMode('SOVEREIGN')}
                                        style={{ justifyContent: 'flex-start', padding: 'var(--space-4)', width: '100%', textAlign: 'left', border: mode === 'SOVEREIGN' ? '1px solid var(--color-accent)' : '1px solid var(--color-border)' }}
                                    >
                                        <div className="stack--tight">
                                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Modo Soberano (Sovereign)</span>
                                            <span style={{ fontSize: '9px', opacity: 0.6 }}>INDRA tiene el control. Permite lectura y escritura.</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* FRECUENCIA */}
                            <div className="stack--tight">
                                <span className="text-label" style={{ marginBottom: 'var(--space-3)' }}>Frecuencia de Actualización</span>
                                <div style={{ padding: 'var(--space-2) 0' }}>
                                    <input 
                                        type="range" 
                                        min="0" max="2" step="1"
                                        value={frequency === 'LOW' ? 0 : frequency === 'LATENT' ? 1 : 2}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            setFrequency(v === 0 ? 'LOW' : v === 1 ? 'LATENT' : 'VITAL');
                                        }}
                                        style={{ width: '100%', height: '4px', background: 'var(--color-border)', outline: 'none', cursor: 'pointer', appearance: 'none', borderRadius: '2px' }}
                                    />
                                    <div className="spread" style={{ marginTop: 'var(--space-3)', opacity: 0.8 }}>
                                        <span className="util-label" style={{ color: frequency === 'LOW' ? 'var(--color-accent)' : 'inherit' }}>Baja</span>
                                        <span className="util-label" style={{ color: frequency === 'LATENT' ? 'var(--color-accent)' : 'inherit' }}>Síncrona</span>
                                        <span className="util-label" style={{ color: frequency === 'VITAL' ? 'var(--color-accent)' : 'inherit' }}>En tiempo real</span>
                                    </div>
                                </div>
                            </div>

                            {/* VINCULO A SCHEMA */}
                            <div className="stack--tight" style={{ 
                                padding: 'var(--space-6)', 
                                border: '1px solid rgba(var(--rgb-accent), 0.2)', 
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(var(--rgb-accent), 0.02)' 
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: 'var(--space-4)', display: 'block', letterSpacing: '0.05em' }}>Vincular a Esquema INDRA (Schema)</span>

                                <div className="stack--tight" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                                    <div className="spread">
                                        <span className="util-label">Monitor de Inducción</span>
                                        <span className="util-label">{inductionMonitor.step}</span>
                                    </div>
                                    {inductionMonitor.message && <span style={{ fontSize: '10px', opacity: 0.85 }}>{inductionMonitor.message}</span>}
                                    {inductionMonitor.error && <span style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{inductionMonitor.error}</span>}
                                    {(currentTicketId || inductionTicketId) && (
                                        <span style={{ fontSize: '9px', opacity: 0.6 }}>Ticket: {currentTicketId || inductionTicketId}</span>
                                    )}
                                    <div className="shelf--tight" style={{ marginTop: 'var(--space-2)' }}>
                                        <button className="btn btn--ghost" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={handleRefreshTicket}>
                                            RECONSULTAR ESTADO
                                        </button>
                                        {(currentTicketId || inductionTicketId) && (
                                            <button className="btn btn--ghost" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={handleCancelTicket}>
                                                CANCELAR
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <label className="shelf--tight" style={{ marginBottom: 'var(--space-4)', gap: 'var(--space-2)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={publishImmediately}
                                        onChange={(e) => setPublishImmediately(e.target.checked)}
                                    />
                                    <span style={{ fontSize: '10px' }}>Publicar inmediatamente como AEE Form</span>
                                </label>
                                
                                {!targetSchema ? (
                                    <div className="stack--tight" style={{ gap: 'var(--space-3)' }}>
                                        <button 
                                            className="btn btn--accent" 
                                            style={{ width: '100%', padding: 'var(--space-4)', border: 'none' }}
                                            onClick={handleAutoGenerateSchema}
                                            disabled={isInducing}
                                        >
                                            <div className="shelf--tight">
                                                <IndraIcon name="MAGIC" size="14px" />
                                                <span style={{ fontWeight: 900, fontSize: '11px' }}>{isInducing ? 'INDUCIENDO...' : 'INDUCCIÓN INDUSTRIAL'}</span>
                                            </div>
                                        </button>
                                        
                                        <button 
                                            className="btn btn--ghost" 
                                            style={{ width: '100%', padding: 'var(--space-3)', fontSize: '11px', border: '1px solid var(--color-border)' }}
                                            onClick={() => setIsSelectingSchema(true)}
                                        >
                                            <div className="shelf--tight">
                                                <IndraIcon name="SEARCH" size="14px" />
                                                <span>Vincular a Esquema Existente</span>
                                            </div>
                                        </button>
                                        
                                        <span style={{ fontSize: '9px', opacity: 0.4, textAlign: 'center', marginTop: 'var(--space-2)' }}>
                                            Usa la conversión si no has creado tu estructura en INDRA aún.
                                        </span>
                                    </div>
                                ) : (
                                    <div className="stack--tight">
                                        <div className="spread" style={{ background: 'rgba(var(--rgb-accent), 0.1)', padding: 'var(--space-3)', borderRadius: '4px', border: '1px solid var(--color-accent)' }}>
                                            <div className="stack--tight">
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-accent)' }}>{targetSchema.handle?.label || targetSchema.id}</span>
                                                <span style={{ fontSize: '9px', opacity: 0.6 }}>Esquema Vinculado</span>
                                            </div>
                                            <button className="btn-icon" onClick={() => setTargetSchema(null)}>
                                                <IndraIcon name="CLOSE" size="14px" />
                                            </button>
                                        </div>
                                        <span style={{ fontSize: '10px', marginTop: 'var(--space-3)', fontStyle: 'italic', opacity: 0.5 }}>
                                            {Object.keys(fieldMappings).length} campos mapeados en la columna izquierda.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── DATA PREVIEW (Sinceridad de Realidad / Resonancia Cognitiva) ── */}
                            <div className="stack--tight" style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
                                <div className="spread">
                                    <span className="text-label" style={{ marginBottom: 'var(--space-2)' }}>VISTA PREVIA DE MATERIA (RESONANCIA COGNITIVA)</span>
                                    {analysisReport && <span className="util-label" style={{ color: 'var(--color-accent)' }}>RESONANCIA ACTIVA: {analysisReport.actions?.length || 0} CAMBIOS</span>}
                                </div>
                                <div className="terminal-inset" style={{ padding: 'var(--space-2)', maxHeight: '140px', overflow: 'hidden' }}>
                                    {isLoadingPreview ? (
                                        <div className="center" style={{ padding: 'var(--space-8)', opacity: 0.5, fontSize: '10px', color: 'var(--color-accent)' }}>Realizando Análisis Resonante...</div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left', color: 'inherit' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.6 }}>
                                                    {fields.slice(0, 4).map(f => (
                                                        <th key={f.id} style={{ padding: '6px', fontWeight: 'bold' }}>
                                                            {f.label || f.id}
                                                            {fieldMappings[f.id] && <div style={{ fontSize: '8px', color: 'var(--color-accent)' }}>→ {fieldMappings[f.id]}</div>}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* 
                                                    AXIOMA DE SINCERIDAD: 
                                                    Si hay reporte de resonancia, mostramos el dato como quedará 
                                                    tras la hidratación/sincronización.
                                                */}
                                                {(analysisReport?.preview_items || previewData).map((row, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)', background: idx % 2 === 0 ? 'rgba(var(--color-accent-rgb), 0.02)' : 'transparent' }}>
                                                        {fields.slice(0, 4).map(f => {
                                                            const rawVal = row.payload?.fields?.[f.id] || '';
                                                            // Buscamos si hay una acción de transformación para este campo en el reporte
                                                            const action = analysisReport?.actions?.find(a => a.item_id === row.id && a.field === fieldMappings[f.id]);
                                                            
                                                            return (
                                                                <td key={f.id} style={{ padding: '6px', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
                                                                    {action ? (
                                                                        <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{String(action.value)}</span>
                                                                    ) : String(rawVal)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER DE GUARDADO */}
                <footer style={{ marginTop: 'var(--space-8)', flexShrink: 0 }}>
                    <IndraActionTrigger 
                        label="Guardar Configuración y Activar Conexión"
                        onClick={handleConfirm}
                        variant="accent"
                        size="large"
                        fullWidth
                    />
                </footer>

                {/* MODAL SELECCIÓN SCHEMA */}
                {isSelectingSchema && (
                    <div className="center" style={{ 
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                        zIndex: 1500, background: 'rgba(0,0,0,0.9)', padding: 'var(--space-4)'
                    }}>
                        <div style={{ 
                            width: '400px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-accent)', 
                            borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-float)'
                        }}>
                            <div className="spread" style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Elegir Esquema INDRA</h3>
                                <button className="btn-icon" onClick={() => setIsSelectingSchema(false)}>
                                    <IndraIcon name="CLOSE" size="16px" color="var(--color-text-dim)" />
                                </button>
                            </div>

                            <div className="stack--tight" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                                {pins.filter(p => p.class === 'DATA_SCHEMA').map(p => (
                                    <button 
                                        key={p.id} 
                                        className="btn btn--ghost spread" 
                                        style={{ 
                                            width: '100%', marginBottom: '4px', textAlign: 'left', 
                                            padding: 'var(--space-3)', border: '1px solid var(--color-border)' 
                                        }}
                                        onClick={() => handleSelectSchema(p)}
                                    >
                                        <div className="shelf--tight">
                                            <IndraIcon name="DATA_SCHEMA" size="14px" color="var(--color-warm)" />
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{p.handle?.label || p.id}</span>
                                        </div>
                                        <IndraIcon name="CHEVRON_RIGHT" size="12px" color="var(--color-text-tertiary)" />
                                    </button>
                                ))}
                                {pins.filter(p => p.class === 'DATA_SCHEMA').length === 0 && (
                                    <div className="center" style={{ padding: 'var(--space-8)', opacity: 0.5, textAlign: 'center' }}>
                                        <span style={{ fontSize: '11px' }}>No hay Schemas anclados en este workspace.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .btn { cursor: pointer; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-primary); border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-family: var(--font-sans); }
                .btn--accent { background: var(--color-accent); color: var(--color-text-inverse); border-color: var(--color-accent); font-weight: bold; }
                .btn--accent:hover { filter: brightness(1.1); box-shadow: 0 0 15px var(--color-accent-glow); }
                .btn--ghost:hover { background: var(--color-bg-hover); border-color: var(--color-border-strong); }
                .opacity-30 { opacity: 0.3; }
                select { cursor: pointer; outline: none; }
                select option { background: var(--color-bg-surface); color: var(--color-text-primary); }
                
                /* Personalización de Scrollbars para mantener HUD aesthetic */
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--color-accent); }
            `}</style>
        </div>
    );
}
