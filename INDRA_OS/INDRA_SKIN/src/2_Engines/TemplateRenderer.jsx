/**
 * CAPA 2: ENGINES
 * TemplateRenderer.jsx
 * DHARMA: Renderizar templates de documentos y dashboards con placeholders dinámicos.
 * AXIOMA: Separation of Concerns - Este motor renderiza CONTENIDO, no ESTRUCTURA.
 * 
 * FEATURE CLAVE: Permite que un dashboard muestre el Cosmos de origen y actúe
 * como punto de intervención reglado (el usuario puede ver de dónde viene el dato
 * y modificarlo si tiene permisos).
 */

import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../core/1_Axiomatic_Store/AxiomaticStore.jsx';
import adapter from '../core/Sovereign_Adapter.js';

/**
 * Renderiza un template (email, reporte, dashboard) resolviendo placeholders.
 * @param {string} templateId - ID del template a renderizar
 * @param {Object} context - Contexto de datos para resolver placeholders
 * @param {boolean} showCosmosMetadata - Si debe mostrar metadata del Cosmos de origen
 */
const TemplateRenderer = ({ templateId, context, showCosmosMetadata = false }) => {
    const { state } = useAxiomaticStore();
    const [renderedContent, setRenderedContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        renderTemplate();
    }, [templateId, context]);

    const renderTemplate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Llamar al RenderEngine del backend para resolver placeholders
            const response = await adapter.call('renderEngine', 'render', {
                template: templateId,
                context: context || {}
            });

            if (response && response.output) {
                setRenderedContent(response.output);
            } else {
                setError('Template vacío o inválido');
            }
        } catch (err) {
            console.error('[TemplateRenderer] Error rendering template:', err);
            setError(err.message || 'Error al renderizar el template');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-accent-primary">Renderizando template...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto">
            {/* Metadata del Cosmos (solo lectura) */}
            {showCosmosMetadata && state.phenotype.cosmosIdentity && (
                <div className="w-full p-3 bg-accent-primary/5 border-b border-accent-primary/20 flex items-center gap-3">
                    <span className="text-xs font-mono text-accent-primary">🌌</span>
                    <div className="flex flex-col flex-1">
                        <span className="text-xs font-bold text-white">
                            {state.phenotype.cosmosIdentity.label}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">
                            Cosmos ID: {state.phenotype.cosmosIdentity.id}
                        </span>
                    </div>

                    {/* Indicador de sincronización en vivo */}
                    <div className="flex items-center gap-2 text-[9px] text-white/30">
                        <span className="animate-pulse">●</span>
                        <span>Live</span>
                    </div>
                </div>
            )}

            {/* Contenido Renderizado */}
            <div
                className="flex-1 p-6 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
        </div>
    );
};

export default TemplateRenderer;




