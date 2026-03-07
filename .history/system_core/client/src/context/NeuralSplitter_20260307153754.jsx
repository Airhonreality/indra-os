import React from 'react';
import { ProtocolProvider } from './ProtocolContext';
import { WorkspaceProvider } from './WorkspaceContext';
import { ShellProvider } from './ShellContext';

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
