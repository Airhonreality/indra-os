/**
 * =============================================================================
 * UTILERÍA: components/utilities/honest_system/HonestProvider.jsx
 * RESPONSABILIDAD: Cámara de Vacío Estilística Universal.
 * AXIOMA: Ninguna variable CSS de la Shell debe penetrar este ecosistema.
 * =============================================================================
 */

import React from 'react';
import { AxiomRegistry } from '../../../services/AxiomRegistry';

export const HonestContext = React.createContext(null);

export function HonestProvider({ children, styleContext = {}, className = "" }) {
    // Definimos los tokens honestos (estáticos) para este ecosistema
    // Resolvemos desde el registro para evitar dependencia de la Shell
    const honestVariables = {
        '--honest-bg': AxiomRegistry.resolve(styleContext.bgColor || '#000000'),
        '--honest-text': AxiomRegistry.resolve(styleContext.textColor || '#FFFFFF'),
        '--honest-accent': AxiomRegistry.resolve(styleContext.accentColor || '#00F5D4'),
        '--honest-accent-dim': AxiomRegistry.resolve(styleContext.accentDim || 'rgba(0, 245, 212, 0.1)'),
        '--honest-font-base': AxiomRegistry.resolve(styleContext.fontFamily || "'Inter', sans-serif"),
        '--honest-font-mono': AxiomRegistry.resolve(styleContext.fontMono || "'JetBrains Mono', monospace"),
    };

    return (
        <HonestContext.Provider value={{ styleContext }}>
            <div 
                className={`honest-chamber ${className}`}
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

                    .honest-chamber .canvas-viewport, 
                    .honest-chamber .stream-viewport {
                        background-color: var(--honest-bg) !important;
                        color: var(--honest-text) !important;
                        font-family: var(--honest-font-base);
                    }

                    /* Blindaje de Elementos Comunes (Píldoras, Slats, Overlays) */
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
