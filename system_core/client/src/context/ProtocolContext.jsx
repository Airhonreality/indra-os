import React, { createContext, useContext } from 'react';
import { useAppState } from '../state/app_state';
import { executeDirective } from '../services/directive_executor';

const ProtocolContext = createContext();

/**
 * ProtocolProvider (Capa de Infraestructura)
 * Gestiona la conexión de red y la identidad contra el Core.
 */
export function ProtocolProvider({ children }) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const isConnected = useAppState(s => s.isConnected);
    const isConnecting = useAppState(s => s.isConnecting);
    const error = useAppState(s => s.error);
    const setCoreConnection = useAppState(s => s.setCoreConnection);
    const disconnect = useAppState(s => s.disconnect);
    const clearError = useAppState(s => s.clearError);
    const bootstrap = useAppState(s => s.bootstrap);

    /**
     * execute: Disparador universal de protocolos (UQO)
     * Abstrae la URL y el Secreto para los componentes.
     */
    const execute = async (uqo) => {
        // Si no se especifica provider, asumimos 'system' por defecto (Core)
        const payload = { provider: 'system', ...uqo };
        return await executeDirective(payload, coreUrl, sessionSecret);
    };

    const value = {
        coreUrl,
        sessionSecret,
        isConnected,
        isConnecting,
        error,
        setCoreConnection,
        disconnect,
        clearError,
        bootstrap,
        execute // <--- El Motor de Soberanía
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
