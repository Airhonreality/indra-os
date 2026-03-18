/**
 * =============================================================================
 * COMPONENTE: TraceInspector.jsx
 * RESPONSABILIDAD: Columna III del IDH. Desglose técnico de la traza.
 *   Permite inspeccionar el Payload enviado, el Response recibido y los Logs.
 *
 * AXIOMAS UI RESPETADOS (ADR_004):
 *   A1 — Token First: Colores semánticos para niveles de log.
 *   A6 — No Inline Styles: Pestañas controladas con data-active-tab.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import * as CopyUtils from './CopyUtils';

/**
 * Renderiza una entrada de log individual.
 */
function LogEntry({ log }) {
    const level = log.level?.toUpperCase();
    
    // Configuración visual por nivel (Axiomática)
    const config = {
        'INFO':  { icon: 'CHECK', color: 'var(--color-accent)' },
        'WARN':  { icon: 'ERROR', color: 'var(--color-warm)' },
        'ERROR': { icon: 'ERROR', color: 'var(--color-danger)' },
        'DEBUG': { icon: 'LOGIC', color: 'rgba(255,255,255,0.4)' },
    };
    
    const { icon, color } = config[level] || config['DEBUG'];

    return (
        <div className="log-entry" data-level={level.toLowerCase()}>
            <div className="log-entry__header">
                <IndraIcon name={icon} size="0.7em" style={{ color }} />
                <span className="log-entry__level">{level}</span>
                <span className="log-entry__time">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="log-entry__msg">{log.message}</div>
            {log.context && (
                <pre className="log-entry__context">
                    {JSON.stringify(log.context, null, 2)}
                </pre>
            )}
        </div>
    );
}

export function TraceInspector({ trace }) {
    const [activeTab, setActiveTab] = useState('logs'); // 'payload' | 'response' | 'logs'

    if (!trace) {
        return (
            <div className="idh-column idh-column--inspector">
                <div className="panel-header">
                    <IndraIcon name="EYE" size="1em" />
                    <h3>TRACE_INSPECTOR</h3>
                </div>
                <div className="panel-body idh-empty-state">
                    <p>Selecciona una traza del roster para inspeccionarla.</p>
                </div>
            </div>
        );
    }

    const logs      = trace.result?.metadata?.logs || [];
    const response  = trace.result || {};
    const uqo       = trace.uqo || {};

    return (
        <div className="idh-column idh-column--inspector">
            {/* ── HEADER CON TABS ─────────────────────────────────── */}
            <div className="panel-header inspector-tabs">
                <div className="tab-group">
                    <button 
                        className={`tab-btn ${activeTab === 'payload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payload')}
                    >
                        PAYLOAD
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'response' ? 'active' : ''}`}
                        onClick={() => setActiveTab('response')}
                    >
                        RESPONSE
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        LOGS ({logs.length})
                    </button>
                </div>

                <div className="panel-header__actions">
                    <button 
                        className="hud-btn" 
                        title="Copiar Reporte Sincero"
                        onClick={() => CopyUtils.copySincero(trace)}
                    >
                        <IndraIcon name="COPY" size="0.85em" />
                        <span>SHARE</span>
                    </button>
                </div>
            </div>

            {/* ── BODY ─────────────────────────────────────────────── */}
            <div className="panel-body inspector-content" data-active-tab={activeTab}>
                {activeTab === 'payload' && (
                    <div className="json-view">
                        <div className="json-toolbar">
                            <span className="text-hint">CLIENT_OUTBOUND_SIGNAL</span>
                            <button className="util-btn" onClick={() => CopyUtils.copyRaw(uqo)}>COPY</button>
                        </div>
                        <pre>{JSON.stringify(uqo, null, 2)}</pre>
                    </div>
                )}

                {activeTab === 'response' && (
                    <div className="json-view">
                        <div className="json-toolbar">
                            <span className="text-hint">CORE_INBOUND_RESULT</span>
                            <button className="util-btn" onClick={() => CopyUtils.copyRaw(response)}>COPY</button>
                        </div>
                        <pre>{JSON.stringify(response, null, 2)}</pre>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="logs-view">
                        {logs.length === 0 ? (
                            <div className="idh-empty-state">
                                <p>Este pulso no generó logs en el Core.</p>
                            </div>
                        ) : (
                            logs.map((log, i) => <LogEntry key={i} log={log} />)
                        )}
                    </div>
                )}
            </div>

            {/* ── FOOTER: METADATA ─────────────────────────────────── */}
            <div className="inspector-footer">
                <div className="footer-item">
                    <span className="label">LATENCY</span>
                    <span className="value" data-speed={trace.latency_ms > 1000 ? 'slow' : 'fast'}>
                        {trace.latency_ms}ms
                    </span>
                </div>
                <div className="footer-item">
                    <span className="label">TRACE_ID</span>
                    <span className="value mono">{trace.traceId}</span>
                </div>
            </div>
        </div>
    );
}
