import React, { createContext, useContext } from 'react';
import { useAppState } from '../state/app_state';
import { DesignerBridge } from '../services/CapabilityBridge';
import { AgnosticVault } from '../../public/indra-satellite-protocol/src/score/logic/AgnosticVault.js';

const ProtocolContext = createContext();

export function ProtocolProvider({ children }) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const lang = useAppState(s => s.lang);
    const isConnected = useAppState(s => s.isConnected);
    const isConnecting = useAppState(s => s.isConnecting);
    const error = useAppState(s => s.error);
    const setCoreConnection = useAppState(s => s.setCoreConnection);
    const disconnect = useAppState(s => s.disconnect);
    const clearError = useAppState(s => s.clearError);
    const bootstrap = useAppState(s => s.bootstrap);

    // --- INSTANCIACIÓN DE SOBERANÍA GLOBAL ---
    const bridge = React.useMemo(() => {
        if (!coreUrl || !sessionSecret) return null;
        return new DesignerBridge(
            { id: 'SYSTEM_GLOBAL' }, // Átomo virtual para operaciones globales
            { close: () => {} },
            { url: coreUrl, secret: sessionSecret, lang: lang || 'es' }
        );
    }, [coreUrl, sessionSecret, lang]);

    const value = {
        bridge, // <--- Único punto de entrada recomendado
        vault: bridge?.vault,
        isConnected,
        isConnecting,
        error,
        setCoreConnection,
        disconnect,
        clearError,
        bootstrap,
        
        // DEPRECATED: Usar el bridge.
        coreUrl, 
        sessionSecret,
        execute: (uqo) => bridge?.execute(uqo)
    };

    return (
        <ProtocolContext.Provider value={value}>
            {children}
        </ProtocolContext.Provider>
    );
}

export const useProtocol = () => {
    const context = useContext(ProtocolContext);
    if (!context) throw new Error('useProtocol must be used within a ProtocolProvider');
    return context;
};
