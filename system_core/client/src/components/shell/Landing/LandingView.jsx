import React, { useState } from 'react';
import { useAppState } from '../../../state/app_state';
import { IndraIcon } from '../../utilities/IndraIcons';
import { FractalLogo } from './FractalLogo';
import { CoreConnectionView } from '../CoreConnectionView';
import { useShell } from '../../../context/ShellContext';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';

/**
 * LandingView (Solar Punk / Axiomatic Edition)
 * Optimized for multi-core sovereign connection and pure architecture.
 * System-wide contrast diagnostics applied.
 */
export const LandingView = () => {
    const activeTab = useAppState(s => s.docsTab);
    const setActiveTab = (tab) => useAppState.getState().openDocs(tab);
    
    const isConnected = useAppState(s => s.isConnected);
    const closeDocs = useAppState(s => s.closeDocs);
    const { theme } = useShell();

    const tabs = [
        { id: 'BIENVENIDA', label: 'INICIO', icon: 'ATOM' },
        { id: 'INSTALACION', label: 'INSTALACIÓN', icon: 'LINK' },
        { id: 'ARQUITECTURA', label: 'ARQUITECTURA', icon: 'SCHEMA' },
        { id: 'MANUALES', label: 'MANUALES', icon: 'DOCUMENT' }
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'BIENVENIDA': return <WelcomeTab />;
            case 'INSTALACION': return <InstalacionTab />;
            case 'ARQUITECTURA': return <ArquitecturaTab />;
            case 'MANUALES': return <ManualesTab />;
            default: return <WelcomeTab />;
        }
    };

    return (
        <div className="landing-axiomatic">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;900&display=swap');

                .landing-axiomatic {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100vw; height: 100vh;
                    background: var(--color-bg-void);
                    color: var(--color-text-primary);
                    overflow-x: hidden;
                    overflow-y: auto;
                    font-family: 'Outfit', sans-serif;
                    scroll-behavior: smooth;
                    transition: background 0.5s ease, color 0.5s ease;
                }

                .nav-btn--active {
                    background: var(--color-accent);
                    color: var(--color-text-inverse);
                    box-shadow: 0 0 20px var(--color-accent-glow);
                }

                /* DIAMOND PURPLE TEXT */
                .diamond-text {
                    font-size: 14px;
                    font-weight: 300;
                    letter-spacing: 1.5em;
                    margin: 0;
                    background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 50%, #7b2ff7 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: diamond-shine 5s linear infinite;
                    text-transform: uppercase;
                    opacity: 1;
                    filter: drop-shadow(0 0 5px rgba(123, 47, 247, 0.3));
                }

                @keyframes diamond-shine {
                    to { background-position: 200% center; }
                }

                .sacred-phrase {
                    font-size: 10px;
                    letter-spacing: 0.5em;
                    text-transform: uppercase;
                    opacity: 0.5;
                    font-weight: 600;
                    text-align: center;
                    margin-top: 50px;
                    color: var(--color-text-primary);
                }

                .section-full {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .logo-bg-container {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    z-index: 0;
                    pointer-events: none;
                    opacity: 0.9;
                }

                .hero-content {
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .tutorial-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    width: 100%;
                }

                .indra-card {
                    background: var(--color-bg-surface);
                    border: 1px solid var(--color-border-strong);
                    border-radius: 20px;
                    padding: 30px;
                    transition: all 0.3s ease;
                }
                .indra-card:hover {
                    border-color: var(--color-accent);
                    box-shadow: 0 10px 40px var(--color-accent-dim);
                }

                .card-title {
                    font-size: 11px;
                    letter-spacing: 0.2em;
                    font-weight: 900;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }

                .card-body {
                    font-size: 14px;
                    line-height: 1.7;
                    color: var(--color-text-secondary);
                }

                .badge-step {
                    width: 32px; height: 32px;
                    background: var(--color-text-primary);
                    color: var(--color-bg-surface);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: 900;
                    margin-bottom: 25px;
                }
                
                .code-block {
                    background: var(--color-bg-void);
                    color: var(--color-accent);
                    padding: 20px 24px;
                    border-radius: 12px;
                    font-family: var(--font-mono);
                    font-size: 10px;
                    border: 1px solid var(--color-border-strong);
                    word-break: break-all;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
                }

                /* BLINDAJE DOCUMENTAL (Axiomático) */
                .indra-document-root {
                    background: #ffffff !important;
                    color: #000000 !important;
                    box-shadow: 0 10px 50px rgba(0,0,0,0.2);
                    border-radius: 2px;
                }
                .indra-document-root * {
                    color: inherit;
                }
            `}</style>

            {/* MACRO HEADER REMOVED FOR 100% PURITY */}

            {/* ── NAVEGACIÓN UNIFICADA (FLOTANTE Y SIN FONDO) ── */}
            <div style={{ 
                flexShrink: 0, 
                position: 'relative', 
                padding: '0 var(--indra-ui-margin)', 
                zIndex: 100,
                marginTop: '32px', 
                paddingLeft: '64px'
            }}>
                <IndraEngineHood
                    leftSlot={
                        <div className="engine-hood__capsule shelf--loose" style={{ gap: 'var(--space-4)', background: 'transparent' }}>
                            {tabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    className={`btn ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{ 
                                        padding: '6px 20px', 
                                        borderRadius: 'var(--radius-pill)', 
                                        fontSize: '10px', 
                                        letterSpacing: '0.1em',
                                        fontWeight: '900',
                                        background: activeTab === tab.id ? 'var(--color-bg-surface)' : 'transparent', 
                                        color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        border: activeTab === tab.id ? '1px solid var(--color-border-strong)' : '1px solid transparent',
                                        boxShadow: activeTab === tab.id ? 'var(--shadow-float)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    {activeTab === tab.id && (
                                        <div className="breathing-pulse" style={{ width: '4px', height: '4px', background: 'var(--color-accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--color-accent)' }} />
                                    )}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    }
                    rightSlot={
                        isConnected && (
                            <button 
                                className="btn btn--xs btn--accent" 
                                onClick={closeDocs} 
                                style={{ 
                                    padding: '6px 24px', 
                                    borderRadius: 'var(--radius-pill)', 
                                    border: '1px solid var(--color-accent)',
                                    background: 'transparent',
                                    color: 'var(--color-accent)',
                                    boxShadow: '0 0 10px var(--color-accent-dim)' 
                                }}
                            >
                                <IndraIcon name="CORE" size="10px" style={{marginRight: '8px'}} />
                                <span style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.1em' }}>ENTRAR A INDRA</span>
                            </button>
                        )
                    }
                />
            </div>

            <main>
                {renderContent()}
            </main>
        </div>
    );
};

const WelcomeTab = () => (
    <>
        <section className="section-full">
            <div className="logo-bg-container" style={{ 
                transform: 'scale(1.2) translateX(25%)', 
                display: 'flex', 
                justifyContent: 'flex-end',
                opacity: 0.8
            }}>
                <FractalLogo active={true} />
            </div>
            
            <div className="hero-top" style={{ 
                position: 'absolute', 
                top: '35%', 
                left: '10%',
                zIndex: 10, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start' 
            }}>
                <h1 className="diamond-text" style={{ fontSize: '64px', letterSpacing: '0.8em', paddingLeft: '0' }}>INDRA</h1>
                <span style={{ fontSize: '10px', letterSpacing: '1.2em', opacity: 0.4, fontWeight: 300, marginTop: '-5px' }}>SISTEMA_OPERATIVO</span>
            </div>

            <div className="hero-bottom" style={{ position: 'absolute', bottom: '15%', left: '10%', zIndex: 10 }}>
                <p className="sacred-phrase" style={{ margin: 0, fontSize: '9px', letterSpacing: '0.8em', opacity: 0.3, textAlign: 'left' }}>
                    AQUÍ TERMINAN TODAS LAS BANALIDADES DEL MUNDO
                </p>
            </div>
        </section>

        <section className="section-full" style={{background: 'var(--color-bg-deep)'}}>
            <div style={{maxWidth: '1000px', width: '90%', textAlign:'center'}}>
                <h2 style={{fontSize: '36px', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: '80px', color: 'var(--color-text-primary)'}}>Dharma Tecnológico: El Proyector y el Núcleo</h2>
                
                <ArchitectureVector />

                <div className="tutorial-grid" style={{marginTop: '100px'}}>
                    <div className="indra-card" style={{borderLeft: '6px solid #7b2ff7'}}>
                        <h4 className="card-title" style={{color: '#7b2ff7'}}>INTERFACE_CASCARÓN</h4>
                        <p className="card-body">
                            Esta web es un proyector vacío. No almacena datos, no conoce tu identidad. Es solo la lente industrial para tu realidad privada.
                        </p>
                    </div>
                    <div className="indra-card" style={{borderLeft: '6px solid var(--color-gold)'}}>
                        <h4 className="card-title" style={{color: 'var(--color-gold)'}}>NÚCLEO_SOBERANO</h4>
                        <p className="card-body">
                            Tu cerebro digital vive en Google Apps Script. Tú eres el dueño de las llaves servidoras (GAS) y del almacén (Drive).
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </>
);

const InstalacionTab = () => (
    <div style={{maxWidth: '1000px', width: '90%', margin: '0 auto', padding: '160px 0 120px 0'}}>
        <h2 style={{fontSize: '52px', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '10px'}}>Instalación del Núcleo</h2>
        <p style={{fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '80px'}}>Modelo Solar Punk: Sin instaladores, sin intermediarios.</p>

        <div className="stack" style={{gap: '50px'}}>
            <div className="indra-card" style={{display:'flex', gap: '40px', alignItems: 'center', borderLeft: '8px solid var(--color-accent)'}}>
                <div className="badge-step">1</div>
                <div className="stack--tight" style={{flex: 1}}>
                    <h3 style={{margin:0, fontSize: '20px'}}>IGNICIÓN SOBERANA</h3>
                    <p className="card-body" style={{marginTop: '10px'}}>
                        **No necesitas instalar nada.** Abre una terminal de **PowerShell** y pega el comando. INDRA preparará un entorno temporal para inyectar el código en tu Google Apps Script.
                    </p>
                </div>
                <div className="code-block">
                    irm https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1 | iex
                </div>
            </div>

            <div className="indra-card" style={{display:'flex', gap: '40px', alignItems: 'center'}}>
                <div className="badge-step">2</div>
                <div className="stack--tight">
                    <h3 style={{margin:0, fontSize: '20px'}}>EXTRACCIÓN DE REZONANCIA</h3>
                    <p className="card-body" style={{marginTop: '10px'}}>
                        Google te entregará una URL de "Web App" al finalizar. Esa es la antena de tu núcleo. Pégala abajo para materializar tu sistema.
                    </p>
                </div>
            </div>

            <div style={{marginTop: '40px', padding: '60px', background: 'var(--color-bg-deep)', borderRadius: '40px', border: '2px dashed var(--color-border-strong)'}}>
                <div style={{textAlign: 'center', marginBottom: '50px'}}>
                    <span style={{fontSize:'10px', fontWeight: 900, background: 'var(--color-accent)', color: 'var(--color-text-inverse)', padding: '6px 16px', borderRadius: '30px', boxShadow: '0 5px 15px var(--color-accent-glow)'}}>CONECTOR_ACTIVO</span>
                </div>
                <CoreConnectionView />
            </div>
        </div>
    </div>
);

const ArquitecturaTab = () => (
    <div style={{maxWidth: '960px', width: '90%', margin: '0 auto', padding: '160px 0'}}>
        <h2 style={{fontSize: '52px', fontWeight: 900, marginBottom: '60px'}}>Arquitectura Fractal</h2>
        <div className="stack" style={{gap: '40px'}}>
            <div className="indra-card">
                <h3 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '15px', color:'var(--color-accent)'}}>
                    <IndraIcon name="SCHEMA" />
                    PROVIDERS AGNÓSTICOS
                </h3>
                <p className="card-body">
                    INDRA está diseñado para no depender de ninguna nube específica. Hoy usamos Google por su capa serverless gratuita, pero el sistema puede proyectar realidades de Notion, Airtable o cualquier API mediante sus Silos de Datos.
                </p>
            </div>
            <div className="indra-card">
                <h3 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '15px', color:'#f107a3'}}>
                    <IndraIcon name="DNA" />
                    CONEXIONES & AGENTES
                </h3>
                <p className="card-body">
                    El sistema integra un bus de comunicación para agentes de IA que pueden razonar sobre tu propio grafo de conocimientos sin que los datos salgan de tu control perimetral.
                </p>
            </div>
        </div>
    </div>
);

const ManualesTab = () => (
    <div style={{maxWidth: '1000px', width: '90%', margin: '0 auto', padding: '160px 0'}}>
        <h2 style={{fontSize: '52px', fontWeight: 900, marginBottom: '80px'}}>Manuales de Vuelo</h2>
        <div className="tutorial-grid">
            {[
                { title: 'Carga Realidad: Inducción', desc: 'Aprende a asimilar bases de datos externas (Notion/Drive) y convertirlas en esquemas inteligentes automáticamente.' },
                { title: 'Diseño de Cotizador', desc: 'Manual paso a paso para crear un sistema de cotización profesional con repetidores y lógica de cálculo.' },
                { title: 'Diseño de Puentes', desc: 'Tutorial avanzado sobre cómo conectar silos de datos y orquestar flujos de verdad bidireccionales.' },
                { title: 'Navegación & Interfaz HUD', desc: 'Domina la interfaz industrial, atajos de teclado y el motor de búsqueda universal de INDRA.' }
            ].map((m, i) => (
                <div key={i} className="indra-card">
                    <h3 className="card-title" style={{color: 'var(--color-text-primary)'}}>{m.title}</h3>
                    <p className="card-body" style={{fontSize: '13px'}}>{m.desc}</p>
                    <button className="btn btn--mini" style={{marginTop: '30px', fontSize: '9px', fontWeight: '900'}}>ABRIR_MANUAL</button>
                </div>
            ))}
        </div>
    </div>
);

const ArchitectureVector = () => (
    <svg viewBox="0 0 1000 400" style={{width: '100%', height: 'auto', filter: 'drop-shadow(0 0 30px rgba(0,234,211,0.1))'}}>
        <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-accent)" />
                <stop offset="100%" stopColor="#f107a3" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <path d="M 200 200 Q 500 150 800 200" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6,6" />
        <path d="M 200 200 Q 500 250 800 200" fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="1.5" />
        
        <circle cx="200" cy="200" r="50" fill="var(--color-bg-surface)" stroke="var(--color-accent)" strokeWidth="2" filter="url(#glow)" />
        <text x="200" y="275" textAnchor="middle" fill="var(--color-text-primary)" style={{fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em'}}>ENTORNO_GITHUB</text>
        
        <circle cx="500" cy="200" r="80" fill="var(--color-bg-surface)" stroke="var(--color-gold, #FFD700)" strokeWidth="3" filter="url(#glow)" />
        <text x="500" y="325" textAnchor="middle" fill="var(--color-text-primary)" style={{fontSize: '12px', fontWeight: 900, letterSpacing: '0.2em'}}>NÚCLEO_INDRA</text>
        
        <circle cx="800" cy="200" r="50" fill="var(--color-bg-surface)" stroke="#f107a3" strokeWidth="2" filter="url(#glow)" />
        <text x="800" y="275" textAnchor="middle" fill="var(--color-text-primary)" style={{fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em'}}>REALIDADES_PROPIAS</text>
        
        <circle r="5" fill="var(--color-accent)">
            <animateMotion dur="5s" repeatCount="indefinite" path="M 200 200 Q 500 150 800 200" />
        </circle>
    </svg>
);
