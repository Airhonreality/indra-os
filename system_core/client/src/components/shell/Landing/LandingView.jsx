/**
 * =============================================================================
 * INDRA LANDING VIEW (PRE-AUTHENTICATION ZONE)
 * =============================================================================
 * AVISO ARQUITECTÓNICO: Esta es la cara pública del sistema antes de entrar al núcleo.
 * NUNCA: Inyectar aquí botones de administración, gestión de llaves o servicios post-login.
 * SIEMPRE: Mantener esta vista ligera e informativa. La lógica de gestión vive en el Nexo.
 * =============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../../state/app_state';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useShell } from '../../../context/ShellContext';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { CoreConnectionView } from '../CoreConnectionView';

// Modular Sections
import { WelcomeTab } from './WelcomeTab';
import { ArquitecturaTab } from './ArquitecturaTab';
import { ManualesTab } from './ManualesTab';
import { ToolsDockTab } from './ToolsDockTab';
import { IgnitionTab } from './IgnitionTab';

// AEE / Engines Overlays
const MIEEngine = React.lazy(() => import('../../macro_engines/MIEEngine/MIEEngine'));
const SiloShareGuestView = React.lazy(() => import('../../macro_engines/MIEEngine/guest/SiloShareGuestView').then(m => ({ default: m.SiloShareGuestView })));

const AGENT_BOOTSTRAP_HANDBOOK = `
# 🛰️ INDRA SOVEREIGN SEED (Bootstrap Protocol v1.0)
Instrucciones para Agente de IA o Humano en repositorio vacío:

1. CLONAR: git clone https://github.com/Airhonreality/indra-satellite-protocol.git .
2. INSTALAR: npm install
3. ARRANCAR: npm run dev
4. CONFIGURAR: Abre localhost:3005/architect.html para el Handshake inicial.
5. LOGICA: Tu territorio es la carpeta "src/". No toques "_INDRA_PROTOCOL_".
6. SOBERANÍA: Crea tus materializadores en "src/score/ui/" e ignítalos en "src/app.js".
`;

/**
 * LandingView (Solar Punk / Axiomatic Edition)
 */
export const LandingView = () => {
    const [activeSubPage, setActiveSubPage] = useState(null);
    const activeTab = useAppState(s => s.docsTab);
    const isConnected = useAppState(s => s.isConnected);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const closeDocs = useAppState(s => s.closeDocs);

    const { 
        showConnector, 
        openConnector, 
        closeConnector, 
        openDocs 
    } = useAppState();

    const googleUser = useAppState(s => s.googleUser);
    const activeTool = useAppState(s => s.activeTool);
    const openIngestSession = useAppState(s => s.openIngestSession);
    const { theme, setTheme } = useShell();
    
    // Si ya tenemos usuario de google pero no conectado al core → mostramos el conector directo
    useEffect(() => {
        if (googleUser && !isConnected) {
            openConnector();
        }
    }, [googleUser, isConnected]);

    // Lógica Sincera: Detección de link de ingesta pública o silo público
    useEffect(() => {
        const hash = window.location.hash;
        
        // Detección de Ingesta Masiva / Silo Público
        if (hash.startsWith('#/ingest') || hash.startsWith('#/silo')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const token = params.get('token');
            if (token) {
                console.info("[IndraForge] Detectado link atómico externo...");
                openIngestSession(token);
            }
        }
    }, [openIngestSession]);

    const scrollContainerRef = useRef(null);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleEnter = () => {
        if (isConnected) {
            closeDocs();
        } else {
            openConnector();
        }
    };

    const tabs = [
        { id: 'BIENVENIDA', label: 'INICIO' },
        { id: 'IGNICION', label: 'IGNICIÓN' },
        { id: 'ARQUITECTURA', label: 'ARQUITECTURA' },
        { id: 'HERRAMIENTAS', label: 'HERRAMIENTAS', isSubPage: true },
        { id: 'MANUALES', label: 'MANUALES' },
        { id: 'AGENTE_SEED', label: '🤖 AGENTE', isSubPage: true }
    ];

    const handleTabClick = (tab) => {
        if (tab.isSubPage) {
            setActiveSubPage(tab.id);
        } else {
            setActiveSubPage(null);
            scrollToSection(tab.id);
        }
    };

    useEffect(() => {
        if (showConnector || !scrollContainerRef.current) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
                    const id = entry.target.id;
                    if (id !== activeTab) {
                        useAppState.getState().openDocs(id);
                    }
                }
            });
        }, { 
            root: scrollContainerRef.current,
            threshold: [0.5] 
        });

        const sections = scrollContainerRef.current.querySelectorAll('.indra-section-anchor');
        sections.forEach(s => observer.observe(s));

        return () => observer.disconnect();
    }, [activeTab, showConnector]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            // Programmatic update of activeTab state
            useAppState.getState().openDocs(id);
            // Programmatic scroll inside container
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (showConnector) {
        return (
            <div className="landing-axiomatic-connector" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--color-bg-void)', color: 'var(--color-text-primary)',
                width: '100%', top: 0, left: 0, position: 'fixed', zIndex: 2000
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <button className="btn btn--ghost btn--mini" onClick={closeConnector}>
                        <IndraIcon name="BACK" size="10px" style={{ marginRight: '8px' }} />
                        VOLVER A LA LANDING
                    </button>
                </div>
                <CoreConnectionView />
            </div>
        );
    }

    // Renderizado del gestor de silo público
    if (activeTool === 'SILO_GUEST') {
        // En este caso renderizamos la vista especializada de Silo en vez del Engine crudo
        return (
            <React.Suspense fallback={<div className="fill center status-panel">ABRIENDO SILO COMPARTIDO...</div>}>
                <SiloShareGuestView />
            </React.Suspense>
        );
    }

    // AXIOMA DE LIBERTAD: Renderizado del motor activo (MIE)
    if (activeTool === 'MIE' || activeTool === 'INGEST_GUEST' || activeTool === 'INGEST_EXPIRED') {
        return (
            <React.Suspense fallback={<div className="fill center status-panel">CARGANDO MOTOR NUCLEAR...</div>}>
                <MIEEngine />
            </React.Suspense>
        );
    }

    // AXIOMA DE LIBRERÍA LIBRE: Sub-página de herramientas como overlay soberano
    if (activeSubPage === 'HERRAMIENTAS') {
        return (
            <ToolsDockTab onBack={() => setActiveSubPage(null)} />
        );
    }

    if (activeSubPage === 'AGENTE_SEED') {
        return (
            <div className="fill center" style={{ background: 'var(--color-bg-void)', padding: '60px' }}>
                <div className="indra-card" style={{ maxWidth: '800px', width: '100%', border: '1px solid var(--color-accent)' }}>
                    <h2 className="diamond-text" style={{ fontSize: '24px', marginBottom: '20px' }}>SEMILLA DE ARRANQUE PARA AGENTES 🤖</h2>
                    <p style={{ opacity: 0.6, fontSize: '12px', marginBottom: '15px' }}>Copia este bloque y dáselo a un agente de IA en un repositorio vacío para que construya tu satélite automáticamente.</p>
                    <textarea 
                        readOnly 
                        value={AGENT_BOOTSTRAP_HANDBOOK} 
                        style={{ 
                            width: '100%', height: '300px', background: 'rgba(0,0,0,0.3)', color: '#00ffc8', 
                            padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '11px'
                        }}
                    />
                    <button className="btn btn--primary mt--20" onClick={() => {
                        navigator.clipboard.writeText(AGENT_BOOTSTRAP_HANDBOOK);
                        alert("Semilla copiada al portapapeles. ¡Órbita lista!");
                    }}>COPIAR SEMILLA</button>
                    <button className="btn btn--ghost mt--10" onClick={() => setActiveSubPage(null)}>VOLVER</button>
                </div>
            </div>
        );
    }

    return (
        <div className="landing-axiomatic-wrapper" style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'var(--color-bg-void)', overflow: 'hidden' 
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&display=swap');
                
                .landing-scroll-container {
                    width: 100%;
                    height: 100%;
                    overflow-x: hidden;
                    overflow-y: auto;
                    scroll-behavior: smooth;
                    font-family: 'Outfit', sans-serif;
                }

                .indra-section {
                    width: 100%; min-height: 40vh;
                    display: flex; flex-direction: column; 
                    align-items: flex-start; justify-content: center;
                    position: relative; padding: 60px 40px; box-sizing: border-box;
                    background: var(--color-bg-void);
                }

                .engine-hood-tab {
                    padding: 8px 16px; border-radius: var(--radius-pill); font-size: 10px;
                    letter-spacing: 0.1em; font-weight: 300; background: transparent;
                    color: var(--color-text-secondary); border: none;
                    display: flex; align-items: center; gap: 8px; transition: all 0.4s ease; cursor: pointer;
                    white-space: nowrap;
                }
                .engine-hood-tab.active {
                    color: var(--color-text-primary);
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(32px);
                }

                .indra-card {
                    background: rgba(var(--color-bg-surface-rgb), 0.7);
                    backdrop-filter: blur(32px); border-radius: 12px; padding: 32px;
                    position: relative; border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                .diamond-text {
                    font-family: 'Outfit', sans-serif;
                    background: linear-gradient(135deg, #7b2ff7, #2196f3);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 30px rgba(123, 47, 247, 0.2));
                }
            `}</style>
            
            {/* EL MENU FLOTANTE CON EFECTO GLASS */}
            <div style={{ 
                position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', 
                width: '90%', maxWidth: '1200px', zIndex: 1000,
                pointerEvents: 'none' // IMPIDE QUE EL WRAPPER BLOQUEE CLICS GLOBALES, LOS HIJOS TIENEN AUTO
            }}>
                <div style={{
                    background: 'rgba(var(--color-bg-void-rgb), 0.3)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    borderRadius: '50px', // Redondeado pero sin bordes visibles
                    padding: '4px'
                }}>
                    <IndraEngineHood 
                        leftSlot={
                            <div className="flex row gap--10">
                                {tabs.map(tab => (
                                    <div 
                                        key={tab.id} 
                                        className={`engine-hood-tab ${(tab.isSubPage ? activeSubPage : activeTab) === tab.id ? 'active' : ''}`}
                                        onClick={() => handleTabClick(tab)}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <div className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: (tab.isSubPage ? activeSubPage : activeTab) === tab.id ? 'var(--color-accent)' : 'transparent' }} />
                                        {tab.label}
                                    </div>
                                ))}
                            </div>
                        }
                        rightSlot={
                            <div className="flex row gap--10" style={{ pointerEvents: 'auto' }}>
                                <button className="btn btn--mini btn--ghost" onClick={toggleTheme} style={{ border: 'none' }}>
                                    <IndraIcon name={theme === 'dark' ? 'LIGHT' : 'DARK'} size="14px" />
                                </button>
                                {sessionSecret === 'PUBLIC_GRANT' ? (
                                    <button className="btn btn--mini btn--danger" onClick={() => { localStorage.clear(); window.location.href = '/'; }} style={{ fontWeight: 300, border: 'none' }}>
                                        SALIR DE PROYECCIÓN
                                    </button>
                                ) : (
                                    <button className="btn btn--mini btn--primary" onClick={handleEnter} style={{ fontWeight: 300, border: 'none' }}>
                                        {isConnected ? 'VOLVER AL CORE' : 'ENTRAR A INDRA'}
                                    </button>
                                )}
                            </div>
                        }
                    />
                </div>
            </div>

            <div className="landing-scroll-container" ref={scrollContainerRef}>
                <div id="BIENVENIDA" className="indra-section-anchor">
                    <div className="indra-section" style={{ padding: 0 }}>
                        <WelcomeTab />
                    </div>
                </div>

                <div id="IGNICION" className="indra-section-anchor">
                    <div className="indra-section">
                        <IgnitionTab />
                    </div>
                </div>

                <div id="ARQUITECTURA" className="indra-section-anchor">
                    <div className="indra-section">
                        <ArquitecturaTab />
                    </div>
                </div>


                <div id="MANUALES" className="indra-section-anchor">
                    <div className="indra-section">
                        <ManualesTab />
                    </div>
                </div>

            </div>
        </div>
    );
};
