import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../../state/app_state';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useShell } from '../../../context/ShellContext';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { CoreConnectionView } from '../CoreConnectionView';

// Modular Sections
import { WelcomeTab } from './WelcomeTab';
import { ArquitecturaTab } from './ArquitecturaTab';
import { InstalacionTab } from './InstalacionTab';
import { ManualesTab } from './ManualesTab';

/**
 * LandingView (Solar Punk / Axiomatic Edition)
 */
export const LandingView = () => {
    const activeTab = useAppState(s => s.docsTab);
    const isConnected = useAppState(s => s.isConnected);
    const closeDocs = useAppState(s => s.closeDocs);
    const { theme, setTheme } = useShell();
    const [showConnector, setShowConnector] = useState(false);
    const scrollContainerRef = useRef(null);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleEnter = () => {
        if (isConnected) {
            closeDocs();
        } else {
            setShowConnector(true);
        }
    };

    const tabs = [
        { id: 'BIENVENIDA', label: 'INICIO' },
        { id: 'ARQUITECTURA', label: 'ARQUITECTURA' },
        { id: 'INSTALACION', label: 'INSTALACIÓN' },
        { id: 'MANUALES', label: 'MANUALES' }
    ];

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
            <div className="landing-axiomatic-connector">
                <style>{`
                    .landing-axiomatic-connector { 
                        display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        min-height: 100vh; background: var(--color-bg-void); color: var(--color-text-primary); 
                        width: 100%; top: 0; left: 0; position: fixed; z-index: 2000;
                    }
                `}</style>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <button className="btn btn--ghost btn--mini" onClick={() => setShowConnector(false)}>
                        <IndraIcon name="BACK" size="10px" style={{ marginRight: '8px' }} />
                        VOLVER A LA LANDING
                    </button>
                </div>
                <CoreConnectionView />
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
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    position: relative; padding: 60px 40px; box-sizing: border-box;
                    background: var(--color-bg-void);
                }

                .engine-hood-tab {
                    padding: 8px 24px; border-radius: var(--radius-pill); font-size: 10px;
                    letter-spacing: 0.1em; font-weight: 300; background: transparent;
                    color: var(--color-text-secondary); border: none;
                    display: flex; align-items: center; gap: 8px; transition: all 0.4s ease; cursor: pointer;
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
                // Quitar pointerEvents: none para asegurar clics en los botones
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
                                        className={`engine-hood-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => scrollToSection(tab.id)}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <div className="dot" style={{ width: '4px', height: '4px', borderRadius: '50%', background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent' }} />
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
                                <button className="btn btn--mini btn--primary" onClick={handleEnter} style={{ fontWeight: 300, border: 'none' }}>
                                    {isConnected ? 'VOLVER AL CORE' : 'ENTRAR A INDRA'}
                                </button>
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

                <div id="ARQUITECTURA" className="indra-section-anchor">
                    <div className="indra-section">
                        <ArquitecturaTab />
                    </div>
                </div>

                <div id="INSTALACION" className="indra-section-anchor">
                    <div className="indra-section">
                        <InstalacionTab onStartSync={() => setShowConnector(true)} />
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
