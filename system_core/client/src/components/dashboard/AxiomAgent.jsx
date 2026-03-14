import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { sovereignIntelligence } from '../../services/SovereignIntelligenceProvider';
import { discoveryEngine } from '../../services/MCEP_DiscoveryEngine';
import { mcepOrchestrator } from '../../services/MCEP_Orchestrator';
import './AxiomAgent.css';

/**
 * AxiomAgent
 * Interfaz de interacción MCEP (Agente Operativo).
 */
export function AxiomAgent({ isOpen, onClose }) {
    const [view, setView] = useState(sovereignIntelligence.isConfigured() ? 'chat' : 'config'); 
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [capabilities, setCapabilities] = useState(null);
    const [testResults, setTestResults] = useState({});
    
    // Estado local para configuración (soberana)
    const [config, setConfig] = useState({
        gemini: localStorage.getItem('indra-ai-gemini') || '',
        groq: localStorage.getItem('indra-ai-groq') || '',
        grok: localStorage.getItem('indra-ai-grok') || '',
        custom: localStorage.getItem('indra-ai-custom') || '',
        customUrl: localStorage.getItem('indra-ai-custom-url') || ''
    });

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
    
    const handleSaveConfig = (provider, value, baseUrl = null) => {
        if (provider === 'customUrl') {
            setConfig(prev => ({ ...prev, customUrl: value }));
            sovereignIntelligence.setCredentials('custom', config.custom, value);
            return;
        }
        setConfig(prev => ({ ...prev, [provider]: value }));
        sovereignIntelligence.setCredentials(provider, value, provider === 'custom' ? config.customUrl : null);
    };


    const handleTestConnection = async (provider) => {
        setTestResults(prev => ({ ...prev, [provider]: 'testing' }));
        try {
            const result = await sovereignIntelligence.verifyConnection(provider);
            setTestResults(prev => ({ ...prev, [provider]: result.success ? 'ok' : 'error' }));
        } catch (error) {
            setTestResults(prev => ({ ...prev, [provider]: 'error' }));
        }
    };



    const isConfigured = sovereignIntelligence.isConfigured();


    return (
        <div className="axiom-agent-drawer stack">
            <div className="axiom-agent-header">
                <div className="shelf">
                    <IndraIcon name="COGNITIVE" color="var(--color-accent)" size="14px" />
                    <span className="text--title">
                        {view === 'chat' ? 'OPERATIONAL_CHAT // MCEP' : 'COGNITIVE_SETUP // SOBERANÍA'}
                    </span>
                </div>
                <div className="shelf" style={{ gap: 'var(--space-2)' }}>
                    {isConfigured && (
                        <button 
                            className={`btn--ghost ${view === 'config' ? 'color-accent' : ''}`} 
                            onClick={() => setView(view === 'chat' ? 'config' : 'chat')}
                            style={{ padding: '4px' }}
                            title="Cambiar entre Chat y Configuración"
                        >
                            <IndraIcon name={view === 'chat' ? "SETTINGS" : "TERMINAL"} size="14px" />
                        </button>
                    )}
                    <button className="btn--ghost" onClick={onClose} style={{ padding: '4px' }}>
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </div>
            </div>

            <div className="axiom-agent-content fill" ref={scrollRef}>
                {view === 'chat' && isConfigured ? (
                    <>
                        {messages.length === 0 && (
                            <div className="fill center stack opacity-50" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                                <div className="resonance-pulse" style={{ width: '40px', height: '40px', margin: '0 auto var(--space-4) auto' }}></div>
                                <p className="text-hint" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>
                                    PROTOCOLO MCEP INICIALIZADO.<br />
                                    ESPERANDO DESPLIEGUE DE INTENCIÓN...
                                </p>
                            </div>
                        )}
                        {messages.filter(m => m.role !== 'system_thinking').map((msg, i) => (
                            <div key={i} className={`agent-msg agent-msg--${msg.role}`}>
                                <div className="agent-msg-meta">
                                    {msg.role === 'assistant' ? 'INTELIGENCIA' : (msg.role === 'user' ? 'OPERADOR' : 'SISTEMA')} //
                                </div>
                                <div className="agent-msg-body">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="agent-msg agent-msg--assistant thinking" style={{ background: 'transparent', border: 'none' }}>
                                <div className="resonance-pulse"></div>
                                <span className="text-hint" style={{ fontSize: '11px' }}>
                                    {messages.find(m => m.role === 'system_thinking')?.content || 'DESCUBRIENDO_CONTEXTO...'}
                                </span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="stack--loose" style={{ padding: 'var(--space-2)' }}>
                        <div className="stack" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <p className="text--title" style={{ fontSize: '12px', color: 'var(--color-accent)' }}>
                                {isConfigured ? 'MODO MANTENIMIENTO' : 'ESTADO DE CUNA REQUERIDO'}
                             </p>
                             <p className="text-body" style={{ fontSize: '11px', marginTop: 'var(--space-2)', opacity: 0.7 }}>
                                {isConfigured 
                                    ? 'Ajusta tus parámetros cognitivos o cambia de modelo. El chat se reactivará al volver.'
                                    : 'Indra no detecta una vía de inteligencia activa. Por favor, configura al menos una API Key soberana para despertar al agente.'}
                             </p>
                        </div>

                        <div className="shelf" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                            <p className="text-hint" style={{ fontSize: '10px' }}>
                                CONFIGURACIÓN SOBERANA // LLAVES LOCALES
                            </p>
                            {!isConfigured && (
                                <span className="tag color-danger shadow-glow" style={{ fontSize: '8px', padding: '2px 6px' }}>OFFLINE_STATE</span>
                            )}
                        </div>
                        
                        {['gemini', 'groq', 'grok', 'custom'].map(provider => (
                            <div key={provider} className="stack" style={{ 
                                background: 'rgba(255,255,255,0.02)', 
                                padding: 'var(--space-4)', 
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                marginBottom: 'var(--space-2)'
                            }}>
                                <label className="text-label" style={{ fontSize: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{provider === 'custom' ? 'UNIVERSAL (OpenAI Compatible)' : `${provider} API KEY`}</span>
                                    {provider === 'custom' && <span style={{ opacity: 0.5, fontSize: '9px' }}>LMStudio, DeepSeek, local...</span>}
                                </label>

                                {provider === 'custom' && (
                                    <div className="stack" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-1)' }}>
                                        <input 
                                            type="text"
                                            className="agent-input fill"
                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                                            value={config.customUrl}
                                            onChange={(e) => handleSaveConfig('customUrl', e.target.value)}
                                            placeholder="Base URL (ej: https://api.deepseek.com/v1)"
                                        />
                                    </div>
                                )}

                                <div className="shelf" style={{ marginTop: 'var(--space-2)' }}>
                                    <input 
                                        type="password"
                                        className="agent-input fill"
                                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        value={config[provider]}
                                        onChange={(e) => handleSaveConfig(provider, e.target.value)}
                                        placeholder={`Enter ${provider} key...`}
                                    />
                                    <button 
                                        className="btn--ghost" 
                                        onClick={() => handleTestConnection(provider)}
                                        disabled={!config[provider] || (provider === 'custom' && !config.customUrl) || testResults[provider] === 'testing'}
                                        style={{ 
                                            padding: '8px', 
                                            color: testResults[provider] === 'ok' ? 'var(--color-success)' : (testResults[provider] === 'error' ? 'var(--color-danger)' : 'inherit')
                                        }}
                                    >
                                        <IndraIcon name={testResults[provider] === 'testing' ? 'RELOAD' : 'CHECK'} size="14px" />
                                    </button>
                                </div>
                                {testResults[provider] === 'ok' && <span className="text-hint color-success" style={{ fontSize: '9px' }}>Conectado correctamente //</span>}
                                {testResults[provider] === 'error' && <span className="text-hint color-danger" style={{ fontSize: '9px' }}>Error de conexión //</span>}
                            </div>
                        ))}

                        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'rgba(109, 40, 217, 0.1)', borderRadius: '12px', border: '1px solid rgba(109, 40, 217, 0.2)' }}>
                            <p className="text-body" style={{ fontSize: '11px', color: '#a78bfa', lineHeight: '1.4' }}>
                                <IndraIcon name="INFO" size="12px" style={{ marginBottom: '4px' }} /><br />
                                <strong>Soberanía Total:</strong> El chat permanecerá bloqueado hasta que se valide una vía de inteligencia. Tus llaves permanecen encriptadas localmente.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {view === 'chat' && isConfigured && (
                <div className="axiom-agent-footer">
                    <div className="agent-input-wrapper fill">
                        <textarea 
                            className="agent-input"
                            placeholder="Define intención (ej: 'Navega en Drive buscando balances')..."
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


