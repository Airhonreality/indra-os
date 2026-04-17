import React from 'react';
import { ProtocolProvider, useProtocol } from './ProtocolContext';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { ShellProvider, useShell } from './ShellContext';

// Exportación centralizada de Hooks (Façade Pattern)
export { useProtocol, useWorkspace, useShell };

/**
 * NeuralSplitter
 * Orquestador de contextos para segmentar el estado global de Indra.
 */
export function NeuralSplitter({ children }) {
    return (
        <ProtocolProvider>
            <WorkspaceProvider>
                <ShellProvider>
                    {children}
                </ShellProvider>
            </WorkspaceProvider>
        </ProtocolProvider>
    );
}
