/**
 * @deprecated PulseMonitor - DESACTIVADO en favor de WorkflowSandbox.traceLogs
 * 
 * Este componente realizaba polling continuo (cada 5s) para leer la cola de pulsos.
 * El costo en cuota de GAS era alto (~700-2000 llamadas/día por usuario) para bajo valor informativo.
 * 
 * La observabilidad completa ahora es proporcionada por:
 * - WorkflowSandbox.jsx: Displays execution.log en tiempo real post-WORKFLOW_EXECUTE
 * - useWorkflowExecution.js: Popula traceLogs con pasos, estados, items procesados
 * 
 * Si necesitas ver un historial de ejecuciones, considera un Ledger separado para audit.
 * No eliminar archivo aún (preservado para rollback).
 */

import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useLexicon } from '../../../services/lexicon';

/**
 * PulseMonitor: El tablero de seguimiento de la Red de Pulsos.
 * Se integra en los componentes de automatización para dar visibilidad
 * a las tareas en segundo plano.
 */
export function PulseMonitor({ workflowId, bridge }) {
    const t = useLexicon();
    const [pulses, setPulses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQueue = async () => {
        if (!bridge) return;
        try {
            const response = await bridge.execute({
                protocol: 'SYSTEM_QUEUE_READ',
                provider: 'system'
            });
            
            // Si workflowId existe, filtramos solo los de este workflow
            let items = response.items || [];
            if (workflowId) {
                items = items.filter(p => {
                    try {
                        const payload = typeof p.uqo_payload === 'string' ? JSON.parse(p.uqo_payload) : p.uqo_payload;
                        return payload?.data?.workflow_id === workflowId || payload?.data?.workflow?.id === workflowId;
                    } catch(e) { return false; }
                });
            }
            setPulses(items);
        } catch (err) {
            console.error('[PulseMonitor] Error reading queue', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000); // Polling cada 5s
        return () => clearInterval(interval);
    }, [workflowId, bridge]);

    const getStatusTheme = (status) => {
        switch (status) {
            case 'EXECUTING': return { color: 'var(--color-cold)', label: 'EJECUTANDO', glow: 'glow-violet' };
            case 'PENDING': return { color: 'var(--color-accent)', label: 'PENDIENTE', glow: '' };
            case 'FAILED': return { color: 'var(--color-danger)', label: 'FALLIDO', glow: 'glow-red' };
            case 'COMPLETED': return { color: 'var(--color-success)', label: 'COMPLETADO', glow: '' };
            default: return { color: 'var(--color-text-tertiary)', label: status, glow: '' };
        }
    };

    return (
        <section className="pulse-monitor stack--md">
            <header className="spread border-bottom--thin" style={{ paddingBottom: 'var(--space-2)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="CORE" size="12px" color="var(--color-accent)" />
                    <span className="hud-label-mono" style={{ fontSize: '10px' }}>PULSE_MONITOR</span>
                </div>
                {isLoading && <div className="spinner--xs" />}
            </header>

            <div className="pulse-list stack--xs overflow-y" style={{ maxHeight: '300px' }}>
                {pulses.length === 0 ? (
                    <div className="empty-state center stack--xs" style={{ padding: 'var(--space-4)', opacity: 0.3 }}>
                        <IndraIcon name="LOGS" size="20px" />
                        <span style={{ fontSize: '10px' }}>SIN_PULSOS_ACTIVOS</span>
                    </div>
                ) : (
                    pulses.map(pulse => {
                        const theme = getStatusTheme(pulse.status);
                        return (
                            <div key={pulse.pulse_id} className={`pulse-row ${theme.glow} glass shelf--tight`}>
                                <div className="status-indicator" style={{ backgroundColor: theme.color }} />
                                <div className="stack--3xs fill">
                                    <div className="spread">
                                        <span className="pulse-id">#{pulse.pulse_id.substring(0, 6)}</span>
                                        <span className="pulse-status" style={{ color: theme.color }}>{theme.label}</span>
                                    </div>
                                    <div className="pulse-meta shelf--tight">
                                        <IndraIcon name={pulse.trigger_source === 'WEBHOOK' ? 'SYNC' : 'TIME'} size="8px" />
                                        <span>{pulse.trigger_source}</span>
                                        <span style={{ opacity: 0.3 }}>•</span>
                                        <span>{new Date(pulse.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
