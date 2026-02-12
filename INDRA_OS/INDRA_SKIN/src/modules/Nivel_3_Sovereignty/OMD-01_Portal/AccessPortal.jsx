import React, { useState } from 'react';

/**
 * OMD-01: Portal de Acceso (The Keyhole)
 * DHARMA: Frontera de seguridad y sincronía soberana.
 */
import { CONFIG } from '../../../core/Config';
import connector from '../../../core/Core_Connector';

const AccessPortal = ({ law }) => {
    const [apiKey, setApiKey] = useState('');
    const [coreUrl, setCoreUrl] = useState(CONFIG.CORE_URL || '');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [probeResult, setProbeResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, VALIDATING, SUCCESS, ERROR

    const visual = law.visual_rules || {};

    // AXIOMA: Simplificación máxima - Cualquier llave no vacía es válida para el intento
    const isValidFormat = (key) => key && key.trim().length > 0;

    const handlePing = async () => {
        setProbeResult({ status: 'WAITING', msg: 'Sondeando vector...' });
        try {
            const url = coreUrl.includes('?') ? `${coreUrl}&mode=debug_echo` : `${coreUrl}?mode=debug_echo`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.status === 'DIAGNOSTIC_PROBE_ACTIVE_V1') {
                setProbeResult({
                    status: 'SUCCESS',
                    msg: `CONECTADO: Core v${data.timestamp.substring(11, 19)} | Isótopo: DETECTADO`
                });
            } else {
                setProbeResult({ status: 'OLD', msg: 'CONECTADO: Core Antiguo (No hay Isótopo)' });
            }
        } catch (e) {
            setProbeResult({ status: 'FAIL', msg: `ERROR: Vector inalcanzable (Check URL)` });
        }
    };

    const handleConnect = async () => {
        if (window.INDRA_DEBUG) window.INDRA_DEBUG.logs.push({ msg: "Intentando conectar vector...", level: 'info', time: new Date().toLocaleTimeString(), node: 'PORTAL' });

        // 1. Guardar URL inmediatamente si ha cambiado (Prioridad Máxima)
        const finalUrl = coreUrl || CONFIG.CORE_URL;
        if (coreUrl && coreUrl !== CONFIG.CORE_URL) {
            localStorage.setItem('INDRA_OVERRIDE_URL', coreUrl);
        }

        // 2. Validar Formato de Llave
        if (!isValidFormat(apiKey)) {
            setErrorMessage("FORMATO INVÁLIDO: La llave no puede estar vacía.");
            setStatus('ERROR');
            if (window.INDRA_DEBUG) window.INDRA_DEBUG.logs.push({ msg: "Fallo de validación local.", level: 'error', time: new Date().toLocaleTimeString(), node: 'PORTAL' });
            return;
        }

        setStatus('VALIDATING');
        setErrorMessage('');

        // 3. Persistencia y Propagación (Axioma de Sincronía)
        localStorage.setItem('INDRA_SESSION_TOKEN', apiKey);

        // Sincronizar el singleton del conector inmediatamente
        connector.init(finalUrl, apiKey);

        if (window.INDRA_DEBUG) {
            window.INDRA_DEBUG.logs.push({ msg: "Token guardado. Propagando al Conector...", level: 'info', time: new Date().toLocaleTimeString(), node: 'PORTAL' });
            window.INDRA_DEBUG.logs.push({ msg: "Reiniciando el sistema para ignición limpia...", level: 'warn', time: new Date().toLocaleTimeString(), node: 'PORTAL' });
        }

        setTimeout(() => {
            setStatus('SUCCESS');
            window.location.reload();
        }, 1200);
    };

    if (status === 'SUCCESS') return null; // El portal se desvanece (Culling)

    return (
        <div className="w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-3xl pointer-events-auto">
            {/* Scaffolding Frame */}
            <div className={`relative w-[400px] stark-ui-group flex flex-col items-center gap-8 border-t-2 transition-all duration-500 ${status === 'ERROR' ? 'border-status-error animate-shake' : 'border-accent-primary'}`}
                style={{ borderColor: status === 'IDLE' ? visual.color : undefined }}>

                {/* Header Section */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center border border-white/10 rotate-45 mb-4">
                        <span className="text-accent-primary -rotate-45 font-bold">ST</span>
                    </div>
                    <h1 className="text-xs font-black tracking-[0.8em] uppercase text-white/90">
                        {law.sub_artefactos?.find(a => a.id === 'gate_header')?.contenido?.titulo || 'ORBITAL CORE'}
                    </h1>
                    <p className="text-[7px] font-mono text-white/20 uppercase tracking-[0.4em]">
                        {law.sub_artefactos?.find(a => a.id === 'gate_header')?.contenido?.subtitulo || 'Reality Orchestration System'}
                    </p>
                </div>

                {/* Input Section */}
                <div className="w-full flex flex-col gap-4">
                    <div className="stack-v gap-2">
                        <label className="text-[7px] font-mono text-white/30 uppercase tracking-widest ml-1">MASTER_API_KEY</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                if (status === 'ERROR') setStatus('IDLE');
                            }}
                            placeholder="Introduce tu llave maestra..."
                            className="stark-atom-input text-center tracking-[0.2em]"
                            autoFocus
                        />
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="w-full flex justify-center">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-[6px] uppercase tracking-widest text-white/20 hover:text-accent-primary transition-colors"
                        >
                            {showAdvanced ? '[-] Ocultar Configuración de Red' : '[+] Configuración de Red'}
                        </button>
                    </div>

                    {/* Server Endpoint Input */}
                    {showAdvanced && (
                        <div className="stack-v gap-2 animate-fadeIn">
                            <label className="text-[7px] font-mono text-white/30 uppercase tracking-widest ml-1">HYPERLINK_VECTOR (URL)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={coreUrl}
                                    onChange={(e) => setCoreUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="stark-atom-input text-[8px] text-white/50 tracking-wide font-mono flex-1"
                                />
                                <button
                                    onClick={handlePing}
                                    className="px-3 bg-white/5 hover:bg-white/10 text-[7px] font-bold uppercase tracking-tight border border-white/10"
                                >
                                    Ping
                                </button>
                            </div>
                            {probeResult && (
                                <span className={`text-[6px] font-mono uppercase text-center mt-1 ${probeResult.status === 'SUCCESS' ? 'text-accent-primary' : 'text-status-error'}`}>
                                    {probeResult.msg}
                                </span>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleConnect}
                        disabled={status === 'VALIDATING'}
                        className={`stark-atom-btn stark-atom-btn-primary ${status === 'VALIDATING' ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {status === 'VALIDATING' ? 'Sincronizando...' : 'Conectar'}
                    </button>
                </div>

                {/* Footer / Status */}
                <div className="flex items-center gap-4 py-2">
                    <div className={`w-1 h-1 rounded-full ${status === 'VALIDATING' ? 'bg-accent-primary animate-pulse' : 'bg-white/10'}`}></div>
                    <span className="text-[6px] font-mono text-white/10 uppercase tracking-widest italic">
                        Securing session via Stark_Protocol_v7
                    </span>
                    <div className={`w-1 h-1 rounded-full ${status === 'VALIDATING' ? 'bg-accent-primary animate-pulse' : 'bg-white/10'}`}></div>
                </div>

                {/* Error Pulse */}
                {status === 'ERROR' && (
                    <div className="absolute -bottom-10 left-0 w-full text-center">
                        <span className="text-[8px] font-bold text-status-error uppercase tracking-widest animate-pulse">
                            {errorMessage}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccessPortal;
