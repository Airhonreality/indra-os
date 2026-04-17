/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/ImageBlock.jsx
 * RESPONSABILIDAD: Nodo multimedia del sistema INDRA.
 * AXIOMA: Determinismo visual ante cambios de marca.
 * ADR-024: Agnóstico a provider — soporta MEDIA_RESOLVE universal
 * =============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';
import { IndraLoadingBar } from '../layout/IndraLoadingBar';
import { useIndraResource } from '../../../../hooks/useIndraResource';

const isUrlLike = (value) => typeof value === 'string' && /^(https?|indra):\/\//i.test(value.trim());

const resolveMediaViaResolver = async (bridge, provider, strategy, containerRef, assetName, assetId) => {
    if (!bridge?.request) return '';

    try {
        const uqo = {
            provider,
            protocol: 'MEDIA_RESOLVE',
            data: {
                strategy: strategy || 'BY_ID',
                container_ref: containerRef,
                asset_name: assetName,
                asset_id: assetId
            }
        };

        const result = await bridge.request(uqo);
        const media = result?.items?.[0]?.payload?.media;

        if (media?.canonical_url) {
            return media.canonical_url;
        }
        return '';
    } catch (err) {
        console.error('[ImageBlock] Error resolviendo media:', err);
        return '';
    }
};

export function ImageBlock({ block, bridge }) {
    // Fallo ruidoso inmediato si la identidad del bloque no es válida.
    assertBlockContract('ImageBlock', block);

    // HIDRATACIÓN SINCERA (The Figma Model)
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const p = propsHidratadas;
    const [resolvedSrc, setResolvedSrc] = useState('');
    const [resolutionState, setResolutionState] = useState('IDLE');
    const [resolutionError, setResolutionError] = useState('');

    const strategy = useMemo(() => {
        return p.strategy || 'DIRECT_URL';  // Por defecto: URL directo si se proporciona
    }, [p.strategy]);

    const indraRes = useIndraResource(p.src);

    useEffect(() => {
        let cancelled = false;

        const resolve = async () => {
            setResolutionError('');
            setResolutionState('LOADING');

            // CASE 1: URL directo (no requiere bridge)
            if (strategy === 'DIRECT_URL') {
                if (!p.src || !isUrlLike(p.src)) {
                    if (!cancelled) {
                        setResolvedSrc('');
                        setResolutionState('INCOMPATIBLE');
                        setResolutionError('DIRECT_URL_INVALIDO');
                    }
                    return;
                }

                if (!cancelled) {
                    if (indraRes.isLoading) {
                        setResolutionState('LOADING');
                    } else if (indraRes.url !== p.src || !p.src.startsWith('indra://')) {
                        // Si se resolvió correctamente (o era una URL normal desde el inicio)
                        setResolvedSrc(indraRes.url || p.src);
                        setResolutionState('RESOLVED');
                    } else if (p.src.startsWith('indra://')) {
                         // Falló la resolución del indra://
                        setResolvedSrc('');
                        setResolutionState('INCOMPATIBLE');
                        setResolutionError('ARP_RESOURCE_NOT_FOUND');
                    }
                }
                return;
            }

            // CASE 2 & 3: Requieren bridge + MEDIA_RESOLVE (agnóstico)
            if (!bridge?.request || !p.provider) {
                if (!cancelled) {
                    setResolvedSrc('');
                    setResolutionState('INCOMPATIBLE');
                    setResolutionError('MEDIA_RESOLVE_NO_DISPONIBLE');
                }
                return;
            }

            try {
                let url = '';

                if (strategy === 'BY_NAME_IN_CONTAINER') {
                    if (!p.container_ref || !p.asset_name) {
                        if (!cancelled) {
                            setResolvedSrc('');
                            setResolutionState('INCOMPATIBLE');
                            setResolutionError('PARAMETROS_INSUFICIENTES_BY_NAME');
                        }
                        return;
                    }
                    url = await resolveMediaViaResolver(
                        bridge,
                        p.provider,
                        'BY_NAME_IN_CONTAINER',
                        p.container_ref,
                        p.asset_name,
                        null
                    );
                } else if (strategy === 'BY_ID') {
                    if (!p.asset_id && !p.src) {
                        if (!cancelled) {
                            setResolvedSrc('');
                            setResolutionState('INCOMPATIBLE');
                            setResolutionError('PARAMETROS_INSUFICIENTES_BY_ID');
                        }
                        return;
                    }
                    url = await resolveMediaViaResolver(
                        bridge,
                        p.provider,
                        'BY_ID',
                        null,
                        null,
                        p.asset_id || p.src
                    );
                }

                if (!cancelled) {
                    if (url) {
                        setResolvedSrc(url);
                        setResolutionState('RESOLVED');
                    } else {
                        setResolvedSrc('');
                        setResolutionState('INCOMPATIBLE');
                        setResolutionError('MEDIA_NO_RESUELTA');
                    }
                }
            } catch (_) {
                if (!cancelled) {
                    setResolvedSrc('');
                    setResolutionState('INCOMPATIBLE');
                    setResolutionError('ERROR_MEDIA_RESOLVE');
                }
            }
        };

        resolve();

        return () => {
            cancelled = true;
        };
    }, [bridge, p.src, p.provider, p.strategy, p.container_ref, p.asset_name, p.asset_id, strategy, indraRes.url, indraRes.isLoading]);

    const estiloFinal = {
        width: p.width === 'fill' ? '100%' : p.width,
        height: p.height === 'fill' ? '100%' : p.height,
        objectFit: p.objectFit || 'cover',
        borderRadius: p.borderRadius || 'var(--radius-sm)',
        display: 'block',
        position: 'relative'
    };

    if (!resolvedSrc) {
        return (
            <div style={{ ...estiloFinal, background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {resolutionState === 'LOADING' ? (
                    <IndraLoadingBar width="80px" height="3px" />
                ) : (
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                        {resolutionState === 'INCOMPATIBLE' ? `INCOMPATIBLE: ${resolutionError || 'MEDIA_RESOLVE'}` : 'SIN_IMAGEN_DEFINIDA'}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: estiloFinal.width }}>
            {/* HUD de Deriva para multimedia */}
            {tieneDeriva && (
                <div 
                    title="DERIVA_DE_REALIDAD: Esta imagen usa estilos desactualizados."
                    style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', border: '2px solid white', zIndex: 10 }} 
                />
            )}
            <img src={resolvedSrc} alt="indra-node" style={estiloFinal} />
        </div>
    );
}

ImageBlock.manifest = {
    displayName: 'MEDIA_ENGINE',
    sections: [
        {
            name: 'ORIGEN_MULTIMEDIA',
            description: 'ADR-024: Agnóstico a provider (drive, notion, opfs, url)',
            fields: [
                {
                    id: 'strategy',
                    label: 'ESTRATEGIA_RESOLUCIÓN',
                    type: 'select',
                    options: ['DIRECT_URL', 'BY_ID', 'BY_NAME_IN_CONTAINER'],
                    default: 'DIRECT_URL'
                },
                {
                    id: 'provider',
                    label: 'PROVEEDOR',
                    type: 'select',
                    options: ['drive', 'notion', 'opfs', 'url'],
                    default: 'drive'
                },
                { id: 'src', label: 'FUENTE', type: 'vault_artifact' },
                { id: 'container_ref', label: 'CONTENEDOR', type: 'text' },
                { id: 'asset_name', label: 'NOMBRE', type: 'text' },
                { id: 'asset_id', label: 'ID_ACTIVO', type: 'text' }
            ]
        },
        {
            name: 'DIMENSIONES',
            fields: [
                { id: 'width', label: 'ANCHO', type: 'unit' },
                { id: 'height', label: 'ALTO', type: 'unit' },
                { id: 'objectFit', label: 'AJUSTE', type: 'select', options: ['cover', 'contain', 'fill'] }
            ]
        },
        {
            name: 'ESTILO',
            fields: [
                { id: 'borderRadius', label: 'RADIO_BORDE', type: 'unit' }
            ]
        }
    ]
};
export default ImageBlock;
