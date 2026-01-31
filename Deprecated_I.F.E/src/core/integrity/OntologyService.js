import {
    Shield, Cpu, Database, Cable, DoorOpen, Scroll, HelpCircle,
    Activity, Zap, Search, Contact, File, Key, Unlock, Send, Radar, MessageSquare, Clock,
    Hash, Globe, Lock, AlertCircle, Terminal, Inbox, Settings,
    Plus, Play, RefreshCw, Eye, Save, Wrench, Heart, Settings2
} from 'lucide-react';
import { useCoreStore } from '../state/CoreStore';

/**
 * 🏛️ ONTOLOGY SERVICE (core/integrity/OntologyService.js)
 * Architecture: Layered Reification (V7.0)
 * Status: PURIFIED (No marki-branding in logic)
 */

const ICON_REGISTRY = {
    Shield, Cpu, Database, Cable, DoorOpen, Scroll, HelpCircle,
    Activity, Zap, Search, Contact, File, Key, Unlock, Send, Radar, MessageSquare, Clock,
    Hash, Globe, Lock, AlertCircle, Terminal, Inbox, Settings,
    Plus, Play, RefreshCw, Eye, Save, Wrench, Heart, Settings2,
    SEARCH_EYE: Search, // Agnostic mapping
    SPATIAL_INFRA: Globe
};

const resolveIcon = (iconName) => ICON_REGISTRY[iconName] || HelpCircle;

export const OntologyService = {
    /**
     * Get system-wide layout constants.
     * Merges PHENOTYPE (Sidebars) and SPATIAL (Nodes).
     */
    getLayoutTokens() {
        const laws = useCoreStore.getState().laws || {};
        const pt = laws.PHENOTYPE?.visual_grammar?.LAYOUT_DYNAMICS || {};
        const sp = laws.SPATIAL?.geometry || {};

        return {
            NODE_WIDTH: sp.NODE_WIDTH || 220,
            HEADER_HEIGHT: sp.HEADER_HEIGHT || 40,
            ROW_HEIGHT: sp.ROW_HEIGHT || 30,
            SNAP_GRID: laws.SPATIAL?.physics?.interaction?.axiomatic_snap || 20,
            SIDEBAR_LEFT_WIDTH: pt.SIDEBAR_LEFT_WIDTH || 256,
            SIDEBAR_RIGHT_WIDTH: pt.SIDEBAR_RIGHT_WIDTH || 320,
            FOOTER_HEIGHT: pt.FOOTER_HEIGHT || 40
        };
    },

    /**
     * Get physics laws (Thorne Metric) from Core SPATIAL layer.
     */
    getPhysicsTokens() {
        const laws = useCoreStore.getState().laws || {};
        return laws.SPATIAL?.physics?.thorne_metric || {
            cable_tension: 0.5,
            cable_width: 2,
            cable_opacity: 0.6,
            forward_tension_min: 80
        };
    },

    /**
     * Get optic/viewport laws from Core SPATIAL layer.
     */
    getOpticTokens() {
        const laws = useCoreStore.getState().laws || {};
        return laws.SPATIAL?.renderer_tuning?.viewport || {
            zoom_min: 0.2,
            zoom_max: 3.0,
            initial_zoom: 1.0,
            culling_margin: 100
        };
    },

    /**
     * Get complete metadata for an archetype.
     * Reads from GENETIC (Whitelist) and PHENOTYPE (Styling).
     */
    getArchetype(archetype) {
        const laws = useCoreStore.getState().laws || {};
        const genetic = laws.GENETIC?.ARCHETYPES || [];
        const phenotypeDomain = laws.PHENOTYPE || {};

        // 🔥 L4_RECOVERY: Normalización interna de Ontología (Resiliencia Fenotípica)
        const visualGrammar = phenotypeDomain.visual_grammar || phenotypeDomain.visualGrammar || {
            ARCHETYPES: phenotypeDomain.semantic_mappings || {}
        };

        const phenotype = visualGrammar.ARCHETYPES?.[archetype] || {};

        return {
            id: archetype,
            isValid: genetic.includes(archetype),
            label: archetype.toLowerCase(),
            icon: resolveIcon(phenotype.header_icon || phenotype.visual_token),
            // Axioma: Si el arquetipo existe pero no tiene color en la gramática, asignamos el estándar cian para evitar "ceguera"
            color: phenotype.border_color || phenotype.color || (genetic.includes(archetype) ? '#00ffaa' : 'var(--text-dim)'),
            motion: phenotype.motion?.type || phenotype.motion || 'static'
        };
    },

    /**
     * Get metadata for a semantic role.
     */
    getRoleMeta(role) {
        const laws = useCoreStore.getState().laws || {};
        const roleConfig = laws.PHENOTYPE?.visual_grammar?.ROLES?.[role] || {};

        return {
            icon: resolveIcon(roleConfig.icon),
            widget: roleConfig.widget || 'text'
        };
    },

    /**
     * Get thematic metaphysics for an intent (L2).
     */
    getIntentTheme(intent) {
        const laws = useCoreStore.getState().laws || {};
        const theme = laws.PHENOTYPE?.visual_grammar?.INTENTS?.[intent] || {};

        return {
            color: theme.token || 'var(--text-dim)',
            icon: resolveIcon(theme.icon),
            className: theme.signifier || 'default-intent',
            cableConfig: theme.cable_style || {}
        };
    },

    /**
     * Get all active archetypes from GENETIC layer.
     */
    getActiveArchetypes() {
        const laws = useCoreStore.getState().laws || {};
        const names = laws.GENETIC?.ARCHETYPES || [];
        const registry = {};
        names.forEach(n => { registry[n] = this.getArchetype(n); });
        return registry;
    },

    /**
     * Semantic affinity calculation (Pure Logic).
     */
    getAffinity(sourceSchema, targetSchema) {
        if (!sourceSchema || !targetSchema) return { score: 0, compatible: false };
        const sourceRole = sourceSchema.role || 'unknown';
        const targetRole = targetSchema.role || 'unknown';

        let score = (sourceRole === targetRole) ? 1.0 : 0.1;
        if (score < 1.0) {
            const sParts = sourceRole.split('/');
            const tParts = targetRole.split('/');
            if (sParts[0] === tParts[0]) score = 0.75;
        }

        const typeMatch = sourceSchema.type === targetSchema.type;
        return {
            score,
            compatible: typeMatch && score >= 0.5,
            typeMatch,
            suggestion: score === 1.0 ? 'PERFECT_MATCH' : (score > 0.5 ? 'SEMANTIC_AFFINITY' : 'REPULSE')
        };
    }
};

export default OntologyService;
