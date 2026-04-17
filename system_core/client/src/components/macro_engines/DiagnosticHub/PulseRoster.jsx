/**
 * =============================================================================
 * COMPONENTE: PulseRoster.jsx
 * RESPONSABILIDAD: Columna I del IDH. Lista cronológica de todas las trazas
 *   capturadas en la sesión. Es el "historial de pulsos".
 *
 * AXIOMAS UI RESPETADOS (ADR_004):
 *   A1 — Token First: Cero colores literales. Todo usa variables CSS.
 *   A2 — Slot Hierarchy: Cada entrada es una variante de .slot-small.
 *   A4 — Herencia de Iconos: Los IndraIcon heredan color del padre.
 *   A6 — No Inline Styles: Estados controlados con data-status="ok|error|warn"
 * =============================================================================
 */

import { IndraIcon } from '../../utilities/IndraIcons';
import { copyUQO } from './CopyUtils';

/**
 * Mapea un status del Core a un nombre de icono y un atributo de dato.
 * El CSS del IDH toma data-status para colorear sin lógica JS.
 */
const STATUS_MAP = {
    'OK':       { icon: 'CHECK',    dataStatus: 'ok'   },
    'ERROR':    { icon: 'ERROR',    dataStatus: 'error' },
    'ERROR_FLOW': { icon: 'ERROR',  dataStatus: 'error' },
    'UNKNOWN':  { icon: 'LOAD',     dataStatus: 'warn'  },
};

/**
 * Formatea la latencia de manera legible.
 * Bajo 1000ms → muestra ms. Sobre → muestra segundos.
 * @param {number} ms
 * @returns {string}
 */
function formatLatency(ms) {
    if (!ms && ms !== 0) return '—';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formatea un epoch timestamp a hora legible HH:MM:SS.
 * @param {number} epoch
 */
function formatTime(epoch) {
    if (!epoch) return '—';
    return new Date(epoch).toLocaleTimeString('es-CO', { hour12: false });
}

/**
 * Una sola fila del historial.
 * @param {{ trace: Object, isSelected: boolean, onClick: Function }}
 */
function RosterEntry({ trace, isSelected, onClick }) {
    const status       = trace.result?.metadata?.status || 'UNKNOWN';
    const { icon, dataStatus } = STATUS_MAP[status] || STATUS_MAP['UNKNOWN'];
    const logCount     = (trace.result?.metadata?.logs || []).length;

    const handleCopyUQO = (e) => {
        // Detener propagación para no seleccionar la fila al copiar
        e.stopPropagation();
        copyUQO(trace);
    };

    return (
        <div
            className="roster-entry"
            data-status={dataStatus}
            data-selected={isSelected ? 'true' : undefined}
            onClick={onClick}
        >
            {/* Indicador de estado: el color lo controla el CSS via data-status */}
            <div className="roster-entry__status-dot" aria-hidden="true" />

            <div className="roster-entry__body">
                <div className="roster-entry__primary">
                    <IndraIcon name={icon} size="0.75em" className="roster-entry__icon" />
                    <span className="roster-entry__protocol">{trace.protocol}</span>
                    <span className="roster-entry__separator">·</span>
                    <span className="roster-entry__provider">{trace.provider}</span>
                </div>
                <div className="roster-entry__secondary">
                    <span className="roster-entry__time">{formatTime(trace.timestamp_out)}</span>
                    {logCount > 0 && (
                        <span className="roster-entry__log-badge">{logCount} logs</span>
                    )}
                </div>
            </div>

            {/* Latencia: se empuja a la derecha con margin-left: auto en CSS */}
            <div className="roster-entry__meta">
                <span
                    className="roster-entry__latency"
                    data-speed={trace.latency_ms > 3000 ? 'slow' : trace.latency_ms > 1000 ? 'medium' : 'fast'}
                >
                    {formatLatency(trace.latency_ms)}
                </span>
                {/* Botón de copiado visible solo en hover (CSS lo controla con opacity) */}
                <button
                    className="roster-entry__copy-btn hud-btn"
                    onClick={handleCopyUQO}
                    title="Copiar UQO"
                    aria-label="Copiar comando UQO"
                >
                    <IndraIcon name="COPY" size="0.75em" />
                </button>
            </div>
        </div>
    );
}

/**
 * PulseRoster — Lista completa de trazas.
 * @param {{
 *   traces: Array,
 *   selectedTrace: Object|null,
 *   onSelect: Function,
 *   onClear: Function,
 *   onExport: Function,
 * }} props
 */
export function PulseRoster({ traces, selectedTrace, onSelect, onClear, onExport }) {
    const isEmpty = !traces || traces.length === 0;

    return (
        <div className="idh-column idh-column--roster">
            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="panel-header">
                <IndraIcon name="FLOW" size="1em" />
                <h3>PULSE ROSTER</h3>
                <div className="panel-header__actions">
                    <button
                        className="hud-btn"
                        onClick={onExport}
                        title="Exportar historial como JSON"
                        disabled={isEmpty}
                        aria-label="Exportar trazas"
                    >
                        <IndraIcon name="SAVE" size="0.85em" />
                    </button>
                    <button
                        className="hud-btn danger"
                        onClick={onClear}
                        title="Vaciar historial de sesión"
                        disabled={isEmpty}
                        aria-label="Vaciar historial"
                    >
                        <IndraIcon name="DELETE" size="0.85em" />
                    </button>
                </div>
            </div>

            {/* ── LISTADO ──────────────────────────────────────────── */}
            <div className="panel-body roster-list">
                {isEmpty ? (
                    <div className="idh-empty-state">
                        <IndraIcon name="TERMINAL" size="2em" />
                        <p>Sin pulsos registrados.</p>
                        <small>Las trazas aparecerán aquí en tiempo real.</small>
                    </div>
                ) : (
                    traces.map((trace) => (
                        <RosterEntry
                            key={trace.traceId}
                            trace={trace}
                            isSelected={selectedTrace?.traceId === trace.traceId}
                            onClick={() => onSelect(trace)}
                        />
                    ))
                )}
            </div>

            {/* ── FOOTER CON CONTEO ────────────────────────────────── */}
            {!isEmpty && (
                <div className="roster-footer">
                    <span className="roster-footer__count">
                        {traces.length} / 200 trazas
                    </span>
                </div>
            )}
        </div>
    );
}
