/**
 * VisualHydrator.js
 * DHARMA: Membrana de Hidratación Fenotípica (L3).
 * AXIOMA: "El dato es un símbolo, la UI es su significado."
 */

import React from 'react';
import { Icons } from '../../../4_Atoms/IndraIcons';

const ICON_MAP = {
    // Arquitecturas
    'VAULT': Icons.Vault,
    'DATABASE': Icons.Database,
    'SLOT': Icons.Transform,
    'REALITY': Icons.Cosmos,
    'ADAPTER': Icons.Settings,
    'SERVICE': Icons.Activity,
    'NODE': Icons.System,
    'TERMINAL': Icons.Terminal,
    'COMMUNICATION': Icons.Inbox,
    'EMAIL': Icons.Inbox,
    'CHAT': Icons.Inbox,
    'LLM': Icons.Settings,
    'INTELLIGENCE': Icons.Settings,

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

/**
 * Resuelve un icono desde un string o emoji.
 */
export const resolveIcon = (key) => {
    if (!key) return Icons.Help;

    // 1. Emoji Directo
    if (typeof key === 'string' && key.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/)) {
        return (props) => React.createElement('span', {
            style: { fontSize: props.size || '16px' }
        }, key);
    }

    // 2. Mapeo de Registro
    const upperKey = typeof key === 'string' ? key.toUpperCase() : '';
    return ICON_MAP[key] || ICON_MAP[upperKey] || Icons[upperKey] || Icons.Help;
};

/**
 * Resuelve un ID de artefacto a su LABEL elegante usando el estado fenotípico.
 */
export const resolveArtifactLabel = (id, artifacts = []) => {
    if (!id) return 'UNKNOWN';
    const artifact = artifacts.find(a => a.id === id);
    return artifact?.LABEL || artifact?.label || id.toUpperCase();
};

export default {
    resolveIcon,
    resolveArtifactLabel
};



