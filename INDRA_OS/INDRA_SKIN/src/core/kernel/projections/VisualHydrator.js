/**
 * VisualHydrator.js
 * DHARMA: Membrana de Hidratación Fenotípica (L3).
 * AXIOMA: "El dato es un símbolo, la UI es su significado."
 */

import React from 'react';
import { Icons } from '../../../4_Atoms/AxiomIcons.jsx';

const ICON_MAP = {
    // Arquitecturas Estructurales
    'VAULT': Icons.Vault,
    'DATABASE': Icons.Database,
    'SLOT': Icons.Transform,
    'REALITY': Icons.Cosmos,
    'ADAPTER': Icons.Settings,
    'SERVICE': Icons.Activity,
    'NODE': Icons.System,
    'TERMINAL': Icons.Terminal,
    'ORCHESTRATOR': Icons.Activity,

    // Semántica de Capacidades (Orquestación)
    'TV_SCREEN': Icons.TV_SCREEN,
    'PDF': Icons.PDF,
    'DOCUMENT': Icons.List, // Keep existing DOCUMENT
    'BRIDGE': Icons.BRIDGE,
    'SYNC': Icons.Sync,
    'LOCK': Icons.Lock,
    'CLOCK': Icons.Clock,
    'PROCESSOR': Icons.Cpu, // Keep existing PROCESSOR
    'MEMORY': Icons.Database, // Keep existing MEMORY
    'UPTIME': Icons.Clock, // Keep existing UPTIME
    'QUERY': Icons.Search, // Keep existing QUERY
    'PERSISTENCE': Icons.Lock, // Keep existing PERSISTENCE
    'SCHEMA': Icons.List, // Keep existing SCHEMA

    // Físicos / Espaciales
    'GRAVITY': Icons.GRAVITY,
    'ENTROPY': Icons.ENTROPY,
    'DIMENSIONS': Icons.DIMENSIONS,

    // Fallbacks
    'DEFAULT': Icons.Help
};

export const resolveIcon = (key, nodeData = null) => {
    if (!key && !nodeData) return Icons.Help;

    // 1. Emoji Directo (Soberanía Visual)
    if (typeof key === 'string' && key.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/)) {
        return (props) => React.createElement('span', {
            style: { fontSize: props.size || '16px' }
        }, key);
    }

    // 2. AXIOMA: Sniffing de Capacidades y Rasgos (Prioridad sobre Nombre)
    const data = nodeData || {};
    const caps = (data.CAPABILITIES || data.capabilities || {});
    const traits = (data.traits || data.TRAITS || []).map(t => String(t).toUpperCase());
    const arch = String(data.ARCHETYPE || data.archetype || key || '').toUpperCase();

    const capIds = Object.values(caps).map(c => typeof c === 'object' ? c.id : c);

    if (capIds.includes('RECEIVE') || capIds.includes('PROJECTION') || traits.includes('SLOT') || traits.includes('TRANSFORM') || arch === 'SLOT') return Icons.Transform;
    if (capIds.includes('DATA_STREAM') || capIds.includes('QUERY_FILTER') || traits.includes('DATABASE') || traits.includes('GRID') || arch === 'DATABASE') return Icons.Database;
    if (capIds.includes('SEND_REPLY') || capIds.includes('SEND_MESSAGE') || traits.includes('COMMUNICATION') || traits.includes('MAIL')) return Icons.Inbox;
    if (capIds.includes('LIST_FILES') || capIds.includes('BROWSE') || traits.includes('VAULT') || traits.includes('STORAGE') || arch === 'VAULT') return Icons.Vault;
    if (capIds.includes('READ_PAGE') || capIds.includes('PDF') || traits.includes('DOC')) return Icons.PDF;
    if (capIds.includes('EXECUTE_CODE') || capIds.includes('COMPUTE') || traits.includes('AGENT') || traits.includes('ENGINE') || arch === 'AGENT') return Icons.Cpu;
    if (traits.includes('REALITY') || arch === 'REALITY') return Icons.Cosmos;

    // 3. Fallback a Mapeo de Registro Directo
    const upperKey = typeof key === 'string' ? key.toUpperCase() : arch;
    if (ICON_MAP[upperKey]) return ICON_MAP[upperKey];
    if (Icons[upperKey]) return Icons[upperKey];

    return ICON_MAP.DEFAULT;
};

/**
 * Resuelve un ID de artefacto a su LABEL elegante usando el estado fenotípico.
 */
export const resolveArtifactLabel = (id, artifacts = []) => {
    if (!id) return 'UNKNOWN';
    // Soportar tanto Mapa (v14.0) como Array (fallback/legacy)
    const artifact = Array.isArray(artifacts)
        ? artifacts.find(a => a.id === id)
        : artifacts[id];

    return artifact?.LABEL || artifact?.label || id.toUpperCase();
};

export default {
    resolveIcon,
    resolveArtifactLabel
};




