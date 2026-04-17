import React from 'react';
/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/renderer/HonestProvider.jsx
 * RESPONSABILIDAD: Cámara de Vacío Estilística (Aislamiento de Soberanía).
 * AXIOMA: Ninguna variable CSS de la Shell debe penetrar este ecosistema.
 * =============================================================================
 */

import { AxiomRegistry } from '../../../../services/AxiomRegistry';

export const HonestContext = React.createContext(null);

export function HonestProvider({ children, styleContext = {} }) {
    // Definimos los tokens honestos (estáticos) para este documento
    // Resolvemos desde el registro para evitar dependencia de la Shell
    const honestVariables = {
        '--honest-bg': AxiomRegistry.resolver(styleContext.bgColor || '#FFFFFF'),
        '--honest-text': AxiomRegistry.resolver(styleContext.textColor || '#000000'),
        '--honest-accent': AxiomRegistry.resolver(styleContext.accentColor || '#00F5D4'),
        '--honest-accent-dim': AxiomRegistry.resolver(styleContext.accentDim || 'rgba(0, 245, 212, 0.1)'),
        '--honest-font-base': AxiomRegistry.resolver(styleContext.fontFamily || "'Inter', sans-serif"),
        '--honest-font-mono': AxiomRegistry.resolver(styleContext.fontMono || "'JetBrains Mono', monospace"),
    };

    return (
        <HonestContext.Provider value={{ styleContext }}>
            <div 
                className="honest-chamber"
                style={{
                    ...honestVariables,
                    width: '100%',
                    height: '100%',
                    display: 'contents'
                }}
            >
                <style>{`
                    /* AXIOMA DE SINCERIDAD: Reset Total de la Cascada */
                    .honest-chamber * {
                        all: revert;
                        box-sizing: border-box;
                    }

                    .honest-chamber .canvas-viewport {
                        background-color: var(--honest-bg) !important;
                        color: var(--honest-text) !important;
                        font-family: var(--honest-font-base);
                    }

                    /* Blindaje de Interpolación (Evita el neón intrusivo de la Shell) */
                    .honest-chamber .slot-pill {
                        background: var(--honest-accent-dim) !important;
                        color: var(--honest-accent) !important;
                        border: 1px solid var(--honest-accent) !important;
                        padding: 0 4px;
                        border-radius: 3px;
                        font-family: var(--honest-font-mono);
                        font-size: 0.9em;
                        margin: 0 2px;
                        display: inline-block;
                    }
                `}</style>
                {children}
            </div>
        </HonestContext.Provider>
    );
}
