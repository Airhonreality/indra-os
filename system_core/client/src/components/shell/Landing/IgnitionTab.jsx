import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { MarkdownProjector } from '../../utilities/MarkdownProjector';

/**
 * IgnitionTab - El Sendero del Arquitecto (MCEP v2.3)
 */
export const IgnitionTab = () => {
    return (
        <div className="ignition-wrapper" style={{ width: '100%', color: 'var(--color-text-primary)' }}>
            <style>{`
                .ignition-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 32px;
                    margin-top: 40px;
                }
                .ignition-step {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 32px;
                    transition: all 0.3s ease;
                }
                .ignition-step:hover {
                    background: rgba(255, 255, 255, 0.05);
                    transform: translateY(-5px);
                }
                .step-number {
                    font-family: 'Syncopate', sans-serif;
                    font-size: 10px;
                    color: #7b2ff7;
                    margin-bottom: 16px;
                    display: block;
                }
                .repo-mockup {
                    background: #0d1117;
                    border-radius: 8px;
                    border: 1px solid #30363d;
                    padding: 24px;
                    margin-top: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                }
                .repo-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #30363d;
                    padding-bottom: 12px;
                    margin-bottom: 24px;
                }
                .code-block {
                    background: #161b22;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    color: #e6edf3;
                    margin: 10px 0;
                }
            `}</style>

            <header style={{ maxWidth: '800px' }}>
                <h2 className="diamond-text" style={{ fontSize: '42px', margin: '0 0 16px 0', fontWeight: 900 }}>
                    INDRA LAUNCHPAD
                </h2>
                <p style={{ opacity: 0.7, fontSize: '18px', lineHeight: '1.6' }}>
                    El protocolo agnóstico para construir satélites soberanos en minutos. Sigue el sendero de ignición.
                </p>
            </header>

            <div className="ignition-grid">
                {/* PASO 1: DESCUBRIMIENTO */}
                <div className="ignition-step">
                    <span className="step-number">PASO 01 // ANALÍSIS</span>
                    <h3 style={{ margin: '0 0 12px 0' }}>Descubre tu Lógica</h3>
                    <p style={{ fontSize: '14px', opacity: 0.6, lineHeight: '1.5' }}>
                        Inicia un diálogo con la IA para mapear tus nodos de negocio. Define qué quieres gestionar antes de tocar una sola línea de código.
                    </p>
                    <div className="code-block" style={{ fontSize: '10px', color: '#7b2ff7' }}>
                        PROMPT: "Analiza mi flujo de negocio y propón un mapa de esquemas Indra..."
                    </div>
                </div>

                {/* PASO 2: REPO SEMILLA REEMPLAZADO POR PROYECCIÓN REAL */}
                <div className="ignition-step" style={{ gridRow: 'span 2' }}>
                    <span className="step-number">PASO 02 // COLONIZACIÓN</span>
                    <h3 style={{ margin: '0 0 12px 0' }}>Siembre la Semilla</h3>
                    <p style={{ fontSize: '14px', opacity: 0.6 }}>
                        Descarga el motor consolidado del Protocolo Satélite (ISP). Esta sección es una proyección viva del repositorio oficial.
                    </p>
                    
                    <div className="repo-mockup">
                        <div className="repo-header">
                            <div className="flex row gap--10 middle" style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
                                <IndraIcon name="FILE" size="14px" />
                                <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '13px' }}>indra-satellite-protocol / README.md</span>
                            </div>
                            <a href="https://github.com/Airhonreality/indra-satellite-protocol" target="_blank" rel="noreferrer noopener" className="btn btn--primary btn--mini" style={{ background: '#238636', border: 'none', borderRadius: '6px', color: 'white', padding: '4px 12px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                                 VIEW SOURCE
                            </a>
                        </div>
                        
                        <MarkdownProjector url="/indra-satellite-protocol/README.md" />
                    </div>
                </div>

                {/* PASO 3: IDE + IA */}
                <div className="ignition-step">
                    <span className="step-number">PASO 03 // SIMBIÓSIS</span>
                    <h3 style={{ margin: '0 0 12px 0' }}>Simbiósis con IA</h3>
                    <p style={{ fontSize: '14px', opacity: 0.6, lineHeight: '1.5' }}>
                        Abre tu IDE favorito (Cursor, VSCode) con un Agente (Antigravity). La semilla autoguía a la IA mediante la carpeta .ia-agente.
                    </p>
                </div>

                {/* PASO 4: CIERRE */}
                <div className="ignition-step" style={{ borderLeft: '4px solid #7b2ff7' }}>
                    <span className="step-number">PASO 04 // RESONANCIA</span>
                    <h3 style={{ margin: '0 0 12px 0' }}>Palabra Sagrada</h3>
                    <p style={{ fontSize: '14px', opacity: 0.6, lineHeight: '1.5' }}>
                        Tu visión se graba en 0_USER_VOICE.md. La IA ahora diseña bajo tu mando absoluto, validando cada bit en el HUD en tiempo real.
                    </p>
                </div>
            </div>
        </div>
    );
};
