/**
 * =============================================================================
 * HOOK: useProtocolDiscovery.js (Agnosticismo de Silo)
 * DOGMA: "El Core Declara, la UI Refleja".
 * =============================================================================
 */

import { useState, useEffect, useMemo } from 'react';

export function useProtocolDiscovery(bridge) {
    const [discovery, setDiscovery] = useState({
        providers: [],
        protocolsByProvider: {},
        isLoading: true,
        error: null
    });

    useEffect(() => {
        if (!bridge) return;

        const fetchProtocols = async () => {
            try {
                // Invocamos el Manifiesto del Core (Ley de Sinceridad)
                // Usamos vaultKey para que el catálogo de protocolos sea instantáneo (T=0)
                const response = await bridge.execute({
                    provider: 'system',
                    protocol: 'SYSTEM_MANIFEST'
                }, { vaultKey: 'system_core_manifest' });

                // El Core retorna items aunque el status sea 'NEEDS_SETUP' (algunos silos sin cuenta).
                // Aceptamos cualquier respuesta con items válidos según el Return Law.
                if (Array.isArray(response.items)) {
                    const providers = [];
                    const protocolsByProvider = {};

                    response.items.forEach(silo => {
                        // Agrupar por silo base (ej: notion:HG -> notion)
                        const baseId = silo.provider_base || silo.id.split(':')[0];
                        
                        if (!providers.find(p => p.id === baseId)) {
                            providers.push({
                                id: baseId,
                                label: silo.handle?.label || baseId.toUpperCase()
                            });
                        }

                        // Mapear protocolos declarados
                        const protos = (silo.protocols || []).map(p => {
                            const meta = silo.protocol_meta?.[p] || {};
                            return {
                                id: p,
                                label: p.replace(/_/g, ' ').toLowerCase(),
                                fields: meta.fields || Object.keys(meta.inputs || {}).map(k => ({ 
                                    id: k, 
                                    label: meta.inputs[k].label || k,
                                    options: meta.inputs[k].options || null,
                                    type: meta.inputs[k].type || 'string',
                                    required: !!meta.inputs[k].required
                                })) || []
                            };
                        });

                        protocolsByProvider[baseId] = [
                            ...(protocolsByProvider[baseId] || []),
                            ...protos
                        ];
                    });

                    // De-duplicar protocolos por baseId
                    Object.keys(protocolsByProvider).forEach(pid => {
                        const unique = [];
                        const seen = new Set();
                        protocolsByProvider[pid].forEach(p => {
                            if (!seen.has(p.id)) {
                                seen.add(p.id);
                                unique.push(p);
                            }
                        });
                        protocolsByProvider[pid] = unique;
                    });

                    setDiscovery({
                        providers,
                        protocolsByProvider,
                        isLoading: false,
                        error: null
                    });
                } else {
                    throw new Error(response.metadata?.error || 'No se pudo leer el catálogo de protocolos.');
                }
            } catch (err) {
                console.error('[Discovery] Error:', err);
                setDiscovery(prev => ({ ...prev, isLoading: false, error: err.message }));
            }
        };

        fetchProtocols();
    }, [bridge]);

    // Cache canónico de campos (opcional si el core no envía meta)
    const PROTOCOL_FIELDS_FALLBACK = {
        'ATOM_READ': ['atom_id'],
        'ATOM_UPDATE': ['atom_id', 'payload'],
        'SEND_EMAIL': ['to', 'subject', 'body_text'],
        'TABULAR_STREAM': ['query'],
        'ATOM_CREATE': ['payload'],
        'WEBHOOK_CALL': ['endpoint', 'data']
    };

    const getFieldsForProtocol = (protocolId) => {
        // Primero buscamos en el discovery dinámico
        for (const pid in discovery.protocolsByProvider) {
            const p = discovery.protocolsByProvider[pid].find(proto => proto.id === protocolId);
            if (p && p.fields && p.fields.length > 0) return p.fields;
        }
        // Fallback si el Core no declara campos (retrocompatibilidad)
        return PROTOCOL_FIELDS_FALLBACK[protocolId] || [];
    };

    return {
        ...discovery,
        getFieldsForProtocol
    };
}
