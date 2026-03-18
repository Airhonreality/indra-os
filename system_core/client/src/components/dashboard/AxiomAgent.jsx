import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { sovereignIntelligence } from '../../services/SovereignIntelligenceProvider';
import { discoveryEngine } from '../../services/MCEP_DiscoveryEngine';
import { mcepOrchestrator } from '../../services/MCEP_Orchestrator';
import { useLexicon } from '../../services/lexicon';
import { useAppState } from '../../state/app_state';
import './AxiomAgent.css';

/**
 * AxiomAgent
 * Interfaz de interacción MCEP (Agente Operativo).
 */
export function AxiomAgent({ isOpen, onClose }) {
    const t = useLexicon();
    const openServiceManager = useAppState(s => s.openServiceManager);
    const [view, setView] = useState('chat'); 
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [capabilities, setCapabilities] = useState(null);

    const scrollRef = useRef(null);



    // Cargar capacidades al abrir (Sensing Proactivo)
    useEffect(() => {
        if (isOpen && !capabilities) {
            discoveryEngine.getDiscoveryTree().then(setCapabilities);
        }
    }, [isOpen, capabilities]);

    // Scroll al final al recibir mensajes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!inputValue.trim() || isThinking) return;

        const userPrompt = inputValue;
        setInputValue('');
        const newUserMessage = { role: 'user', content: userPrompt };
        setMessages(prev => [...prev, newUserMessage]);
        
        setIsThinking(true);

        try {
            // Ciclo Orquestado ReAct
            const result = await mcepOrchestrator.orchestrateCycle(
                userPrompt,
                { history: messages, capabilities: capabilities },
                (statusUpdate) => setMessages(prev => {
                    // Actualizar el estado temporal de pensamiento sin duplicar
                    if (prev.length > 0 && prev[prev.length - 1].role === 'system_thinking') {
                        const newArr = [...prev];
                        newArr[newArr.length - 1].content = statusUpdate;
                        return newArr;
                    }
                    return [...prev, { role: 'system_thinking', content: statusUpdate }];
                })
            );

            // Limpiar mensaje de estado (thinking)
            setMessages(prev => prev.filter(m => m.role !== 'system_thinking'));

            const agentMessage = { role: 'assistant', content: result.finalResponse };
            setMessages(prev => [...prev, agentMessage]);

        } catch (error) {
            setMessages(prev => prev.filter(m => m.role !== 'system_thinking'));
            setMessages(prev => [...prev, { role: 'system', content: `ERROR_SISTEMA: ${error.message}` }]);
        } finally {
            setIsThinking(false);
        }
    };



    const isConfigured = sovereignIntelligence.isConfigured();


    return (
        <div className="axiom-agent-drawer stack">
            <div className="axiom-agent-header">
                <div className="shelf">
                    <IndraIcon name="COGNITIVE" color="var(--color-accent)" size="14px" />
                    <span className="text--title">
                        {view === 'chat' ? t('ui_agent_chat') : t('ui_agent_config')}
                    </span>
                </div>
                <div className="shelf" style={{ gap: 'var(--space-2)' }}>
                    <button 
                        className="btn--ghost" 
                        onClick={() => openServiceManager('intelligence')}
                        style={{ padding: '4px' }}
                        title="Configurar Inteligencia"
                    >
                        <IndraIcon name="SETTINGS" size="14px" />
                    </button>
                    <button className="btn--ghost" onClick={onClose} style={{ padding: '4px' }}>
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </div>
            </div>

            <div className="axiom-agent-content fill" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="fill center stack opacity-50" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                        <div className="resonance-pulse" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-4) auto' }}></div>
                        <p className="text-hint" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>
                            {t('status_agent_ready')}<br />
                            {t('status_waiting_input')}
                        </p>
                    </div>
                )}
                {messages.filter(m => m.role !== 'system_thinking').map((msg, i) => (
                    <div key={i} className={`agent-msg agent-msg--${msg.role}`}>
                        <div className="agent-msg-meta">
                            {msg.role === 'assistant' ? t('ui_role_ai') : (msg.role === 'user' ? t('ui_role_operator') : t('ui_role_system'))} //
                        </div>
                        <div className="agent-msg-body">
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="agent-msg agent-msg--assistant thinking" style={{ background: 'transparent', border: 'none' }}>
                        <div className="resonance-pulse breathing-pulse"></div>
                        <span className="text-hint" style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
                            {messages.find(m => m.role === 'system_thinking')?.content || t('status_thinking')}
                        </span>
                    </div>
                )}
            </div>

            {view === 'chat' && isConfigured && (
                <div className="axiom-agent-footer">
                    <div className="agent-input-wrapper fill">
                        <textarea 
                            className="agent-input"
                            placeholder={t('ui_input_placeholder')}
                            value={inputValue}
                            rows={1}

                            onChange={(e) => {
                                setInputValue(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                    </div>
                    <button 
                        className="agent-submit-btn"
                        onClick={handleSend}
                        disabled={isThinking || !inputValue.trim()}
                    >
                        <IndraIcon name="ARROW_UP" color="white" size="18px" />
                    </button>
                </div>
            )}
        </div>
    );
}


