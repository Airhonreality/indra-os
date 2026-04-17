/**
 * IntelligencePortal.jsx
 * WIDGET DE SOBERANÍA COGNITIVA
 * Permite gestionar llaves de IA in-situ.
 */

import { useState } from 'react';
import { IndraIcon } from './IndraIcons';
import { sovereignIntelligence } from '../../services/SovereignIntelligenceProvider';
import { useLexicon } from '../../services/lexicon';

export function IntelligencePortal({ onUpdate }) {
    const t = useLexicon();
    const providers = ['gemini', 'groq', 'grok', 'custom', 'openai'];
    
    const [config, setConfig] = useState({
        gemini: localStorage.getItem('indra-ai-gemini') || '',
        groq: localStorage.getItem('indra-ai-groq') || '',
        grok: localStorage.getItem('indra-ai-grok') || '',
        openai: localStorage.getItem('indra-ai-openai') || '',
        custom: localStorage.getItem('indra-ai-custom') || '',
        customUrl: localStorage.getItem('indra-ai-custom-url') || ''
    });

    const [testStatus, setTestStatus] = useState({});

    const handleChange = (p, val) => {
        const newConfig = { ...config, [p]: val };
        setConfig(newConfig);
        
        if (p === 'customUrl') {
            sovereignIntelligence.setCredentials('custom', newConfig.custom, val);
        } else {
            sovereignIntelligence.setCredentials(p, val, p === 'custom' ? newConfig.customUrl : null);
        }
        
        if (onUpdate) onUpdate();
    };

    const handleTest = async (p) => {
        setTestStatus(prev => ({ ...prev, [p]: 'testing' }));
        try {
            const res = await sovereignIntelligence.verifyConnection(p);
            setTestStatus(prev => ({ ...prev, [p]: res.success ? 'ok' : 'error' }));
        } catch (e) {
            setTestStatus(prev => ({ ...prev, [p]: 'error' }));
        }
    };

    return (
        <div className="intelligence-portal-stack stack--tight">
            <header className="shelf--loose" style={{ marginBottom: 'var(--space-2)' }}>
                <span className="text-label" style={{ fontSize: '10px', opacity: 0.5 }}>
                    {t('ui_keys_config')} {" // SOBERANÍA_LOCAL"}
                </span>
            </header>

            {providers.map(p => (
                <div key={p} className={`intelligence-row glass-void ${config[p] ? 'has-key' : 'empty'}`}>
                    <div className="spread">
                        <div className="shelf">
                            <IndraIcon name={p.toUpperCase()} size="14px" />
                            <span className="text-mono" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{p}</span>
                        </div>
                        <div className="shelf">
                            {testStatus[p] === 'ok' && <span className="dot color-success"></span>}
                            {testStatus[p] === 'error' && <span className="dot color-danger"></span>}
                        </div>
                    </div>

                    <div className="intelligence-row__input-group shelf--tight">
                        <input 
                            type="password"
                            value={config[p]}
                            placeholder={`Ingresar API KEY para ${p}...`}
                            onChange={(e) => handleChange(p, e.target.value)}
                            className="input-base text--xs"
                            style={{ flex: 1, height: '28px', fontSize: '10px' }}
                        />
                        <button 
                            className="btn--ghost" 
                            onClick={() => handleTest(p)}
                            disabled={!config[p]}
                        >
                            <IndraIcon name={testStatus[p] === 'testing' ? 'RELOAD' : 'CHECK'} size="12px" />
                        </button>
                    </div>

                    {p === 'custom' && config.custom && (
                        <input 
                            type="text"
                            value={config.customUrl}
                            placeholder="Base URL (OAI Compatible)"
                            onChange={(e) => handleChange('customUrl', e.target.value)}
                            className="input-base text--xs"
                            style={{ marginTop: '4px', fontSize: '10px', width: '100%' }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
