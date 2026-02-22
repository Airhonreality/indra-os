/**
 * IdentityLobe.js
 * DHARMA: Custodio de la Identidad Fenotípica (ADR-022).
 * Misión: Gestión determinista de Artefactos y Mapa de Identidad.
 */

export const identityReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_ARTIFACT_REQUEST': {
            console.log("[IdentityLobe] 🧬 Processing ADD_ARTIFACT_REQUEST:", action.payload);
            const { artifact, position, schemaId } = action.payload;
            const nodeCount = Object.keys(state.phenotype.artifacts || {}).length;
            const dispersionOffset = nodeCount * 30;
            const safePos = position || { x: dispersionOffset, y: dispersionOffset };

            // AXIOMA: No Guesswork (ADR-022). La identidad debe venir del compilador.
            const label = artifact.LABEL || null;
            const archetype = artifact.ARCHETYPE || null;
            const domain = artifact.DOMAIN || null;

            const artifactId = artifact.id || artifact.ID;

            if (!artifactId) {
                console.error("[IdentityLobe] ❌ Cannot manifest artifact without ID.");
                return state;
            }

            // AXIOMA: Singularidad de Manifestación (Anti-Duplicación)
            if (state.phenotype.artifacts[artifactId]) {
                console.warn(`[IdentityLobe] 🧬 Artifact ${artifactId} already manifested. Aborting duplication.`);
                return state;
            }

            // AXIOMA: Reificación del Objeto en el Grafo (ADR-022)
            const newGraphNode = {
                ...artifact,
                id: artifactId,
                LABEL: label,
                ARCHETYPE: archetype,
                ARCHETYPES: artifact.ARCHETYPES || (archetype ? [archetype] : []),
                CAPABILITIES: artifact.CAPABILITIES || {},
                origin: artifact.origin || 'GENESIS_CORE',
                schemaId: schemaId || artifact.schemaId,
                x: safePos.x,
                y: safePos.y,
                _isDirty: true
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: {
                        ...state.phenotype.artifacts,
                        [artifactId]: newGraphNode
                    }
                }
            };
        }

        case 'UPDATE_NODE': {
            const { id, updates } = action.payload;
            if (!state.phenotype.artifacts[id]) return state;

            const newNode = {
                ...state.phenotype.artifacts[id],
                ...updates,
                _isDirty: true
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: {
                        ...state.phenotype.artifacts,
                        [id]: newNode
                    }
                }
            };
        }

        case 'REMOVE_ARTIFACT': {
            // Cascada: Si se borra un nodo, limpiar conexiones huérfanas
            const { id } = action.payload;
            const newArtifacts = { ...state.phenotype.artifacts };
            delete newArtifacts[id];

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: newArtifacts,
                    relationships: (state.phenotype.relationships || []).filter(rel =>
                        rel.source !== id && rel.target !== id
                    )
                }
            };
        }

        case 'COSMOS_MOUNTED': {
            console.log("[IdentityLobe] 🌌 Reifying Cosmos Artifacts. Payload keys:", Object.keys(action.payload || {}));
            // AXIOMA: Reificación Masiva de Identidad (ADR-022)
            const artifacts = action.payload.artifacts || {};
            const normalizedArtifacts = {};

            // Asegurar que cada artefacto tenga su ID canónico y metadatos base
            Object.keys(artifacts).forEach(key => {
                const art = artifacts[key];
                const id = art.id || art.ID || key;
                normalizedArtifacts[id] = {
                    ...art,
                    id: id,
                    LABEL: art.LABEL || null,
                    ARCHETYPE: art.ARCHETYPE || null,
                    origin: art.origin || 'NULL_ORIGIN_SENSING'
                };
            });

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: normalizedArtifacts
                }
            };
        }

        default:
            return state;
    }
};
