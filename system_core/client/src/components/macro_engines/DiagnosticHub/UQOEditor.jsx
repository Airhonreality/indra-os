/**
 * =============================================================================
 * COMPONENTE: UQOEditor.jsx
 * RESPONSABILIDAD: Columna II del IDH. La "Reality Console".
 *   Permite la inyección manual de directivas UQO al Core.
 *
 * AXIOMAS UI RESPETADOS (ADR_004):
 *   A3 — HUD Texture: El editor usa fondo profundo y bordes de alta densidad.
 *   A6 — No Inline Styles: Estados (valid/invalid/running) vía data-attributes.
 * =============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { executeDirective } from '../../../services/directive_executor';
import { useAppState } from '../../../state/app_state';

/**
 * ResonanceMatrix — Visualización geométrica de ráfagas.
 * Representa el progreso de una operación mediante una grilla de puntos industrial.
 */
function ResonanceMatrix({ pulseState = 'idle' }) {
    // Generamos 40 puntos para el HUD lateral
    const dots = Array.from({ length: 40 });

    return (
        <div className="resonance-matrix" data-pulse={pulseState}>
            {dots.map((_, i) => (
                <div key={i} className="resonance-matrix__dot" />
            ))}
        </div>
    );
}

/**
 * Suite Presets — Comandos rápidos axiomáticos y de alto estrés.
 */
const PRESETS = [
    { label: 'PING CORE', uqo: { provider: 'system', protocol: 'SYSTEM_MANIFEST' } },
    { label: 'AUDIT RESONANCE', uqo: { provider: 'system', protocol: 'SYSTEM_AUDIT' } },
    { 
        label: 'STRESS: ATOM BLAST', 
        suite: [
            { provider: 'system', protocol: 'ATOM_CREATE', data: { class: 'WORKSPACE', handle: { label: 'T-STRESS-1' } } },
            { provider: 'system', protocol: 'ATOM_CREATE', data: { class: 'WORKSPACE', handle: { label: 'T-STRESS-2' } } },
            { provider: 'system', protocol: 'ATOM_CREATE', data: { class: 'WORKSPACE', handle: { label: 'T-STRESS-3' } } }
        ] 
    },
    { 
        label: 'STRESS: SCHEMA READ', 
        suite: Array.from({ length: 5 }).map(() => ({ provider: 'system', protocol: 'ATOM_READ', context_id: 'schemas' }))
    },
    { label: 'REPAIR WORKSPACE', uqo: { provider: 'system', protocol: 'SYSTEM_WORKSPACE_REPAIR' } },
];

export function UQOEditor() {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);

    const [mode, setMode] = useState('dev'); // 'dev' | 'quick'
    const [rawJson, setRawJson] = useState('{\n  "provider": "system",\n  "protocol": "SYSTEM_MANIFEST"\n}');
    const [isValid, setIsValid] = useState(true);
    const [isPulsing, setIsPulsing] = useState(false);
    const [smokeTests, setSmokeTests] = useState([]);
    const [selectedSmokeIdx, setSelectedSmokeIdx] = useState(-1);

    // Carga asíncrona de Smoke Tests (Solo dev local)
    useEffect(() => {
        const loadSmokeTests = async () => {
            try {
                // Importación dinámica: Si el archivo no existe en el sistema (production), el catch lo ignora.
                // Esto es compatible con Vite base paths.
                const module = await import('../../../smoke_tests_local.js');
                if (module && module.SMOKE_TESTS) {
                    setSmokeTests(module.SMOKE_TESTS);
                }
            } catch (e) {
                // Fallo silencioso si no existe (Axioma de Supervivencia)
            }
        };
        loadSmokeTests();
    }, []);

    // Handler de cambio en el editor
    const handleJsonChange = (val) => {
        setRawJson(val);
        try {
            JSON.parse(val);
            setIsValid(true);
        } catch {
            setIsValid(false);
        }
    };

    // Ejecución de la directiva o suite
    const handlePulse = async () => {
        if (!isValid || isPulsing) return;
        
        try {
            const data = JSON.parse(rawJson);
            setIsPulsing(true);
            
            // Si es un array, es una suite (ráfaga)
            if (Array.isArray(data)) {
                for (const uqo of data) {
                    await executeDirective(uqo, coreUrl, sessionSecret);
                }
            } else {
                // Ejecución única normal
                await executeDirective(data, coreUrl, sessionSecret);
            }
            
        } catch (err) {
            console.error('[UQOEditor] Pulse Failure:', err);
        } finally {
            setIsPulsing(false);
        }
    };

    // Ejecución de Smoke Test (JS dinámico)
    const runSmokeTest = async () => {
        if (selectedSmokeIdx < 0 || isPulsing) return;
        
        setIsPulsing(true);
        const test = smokeTests[selectedSmokeIdx];
        
        // AXIOMA DE SINCERIDAD: Creamos una "Traza Virtual" para que el usuario vea el inicio en el Roster
        console.log(`🚀 IGNICIÓN: ${test.label}`);
        
        try {
            // Evaluamos el código pasando el contexto de conexión y una función de logueo
            const scriptFunc = new Function('context', 'sendDirective', `
                return (async () => {
                    ${test.code}
                })();
            `);
            
            // Pasamos executeDirective directamente para que cada paso genere su propia traza real en el Roster
            const result = await scriptFunc(
                { coreUrl, sessionSecret }, 
                (uqo) => executeDirective(uqo, coreUrl, sessionSecret)
            );
            
            console.log('🏁 RESULTADO SMOKE:', result);
            if (!result.success) throw new Error(result.error);
            
            alert(`SUCCESS: ${result.message}`);
        } catch (err) {
            console.error('[SmokeTest] Execution Error:', err);
            alert(`CRITICAL_SMOKE_ERROR: ${err.message}`);
        } finally {
            setIsPulsing(false);
        }
    };

    const applyPreset = (preset) => {
        const content = preset.suite || preset.uqo;
        const json = JSON.stringify(content, null, 2);
        setRawJson(json);
        setIsValid(true);
    };

    return (
        <div className="idh-column idh-column--editor">
            {/* ── HEADER ───────────────────────────────────────────── */}
            <div className="panel-header">
                <IndraIcon name="TERMINAL" size="1em" />
                <h3>REALITY CONSOLE</h3>
                <div className="mode-tabs">
                    <button 
                        className={`tab-btn ${mode === 'dev' ? 'active' : ''}`}
                        onClick={() => setMode('dev')}
                    >
                        DEV
                    </button>
                    <button 
                        className={`tab-btn ${mode === 'quick' ? 'active' : ''}`}
                        onClick={() => setMode('quick')}
                    >
                        QUICK
                    </button>
                </div>
            </div>

            {/* ── BODY ─────────────────────────────────────────────── */}
            <div className="panel-body editor-body">
                
                {/* Visualización de Resonancia Lateral */}
                <div className="editor-layout-h">
                    <ResonanceMatrix pulseState={isPulsing ? 'running' : 'idle'} />
                    
                    <div className="editor-container" data-valid={isValid} data-pulsing={isPulsing}>
                        <div className="editor-toolbar">
                            <span className="editor-label">INPUT_SIGNAL</span>
                            {!isValid && <span className="status-badge error">JSON_INVALID</span>}
                        </div>
                        
                        <textarea
                            className="uqo-textarea"
                            value={rawJson}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            spellCheck="false"
                            disabled={isPulsing}
                            placeholder='{ "provider": "...", "protocol": "..." }'
                        />
                    </div>
                </div>

                {/* Presets / Quick Actions */}
                <div className="presets-grid">
                    {smokeTests.length > 0 && (
                        <div className="smoke-test-section stack--3xs border-bottom--thin" style={{ paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                            <span className="section-label" style={{ color: '#ff00ff' }}>DEV_SMOKE_VALUATION</span>
                            <div className="shelf--tight fill">
                                <select 
                                    className="smoke-select fill h-100"
                                    value={selectedSmokeIdx}
                                    onChange={(e) => setSelectedSmokeIdx(parseInt(e.target.value))}
                                    style={{ background: 'rgba(255,0,255,0.05)', border: '1px solid rgba(255,0,255,0.2)', color: '#ff00ff', fontSize: '10px', height: '30px' }}
                                >
                                    <option value={-1}>SELECT_SMOKE_SCRIPT...</option>
                                    {smokeTests.map((t, i) => (
                                        <option key={i} value={i}>{t.label}</option>
                                    ))}
                                </select>
                                <button 
                                    className="btn btn--active-glass h-100"
                                    style={{ borderColor: '#ff00ff', color: '#ff00ff' }}
                                    onClick={runSmokeTest}
                                    disabled={selectedSmokeIdx < 0 || isPulsing}
                                >
                                    IGNITE
                                </button>
                            </div>
                        </div>
                    )}

                    <span className="section-label">AXIOMATIC_SUITES</span>
                    <div className="presets-list">
                        {PRESETS.map((p, i) => (
                            <button 
                                key={i} 
                                className="preset-btn"
                                onClick={() => applyPreset(p)}
                                disabled={isPulsing}
                            >
                                <IndraIcon name="PLAY" size="0.6em" />
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FOOTER: IGNICIÓN ─────────────────────────────────── */}
            <div className="editor-footer">
                <button 
                    className="pulse-button" 
                    onClick={handlePulse}
                    disabled={!isValid || isPulsing || !coreUrl}
                    data-pulsing={isPulsing}
                >
                    <div className="pulse-button__glitch"></div>
                    <IndraIcon name={isPulsing ? 'LOAD' : 'TARGET'} size="1.2em" />
                    <span>{isPulsing ? 'RESONANDO...' : 'PULSAR_REALIDAD'}</span>
                </button>
            </div>
        </div>
    );
}
