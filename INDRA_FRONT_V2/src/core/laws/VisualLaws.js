/**
 * 0_Laws/VisualLaws.js
 * DHARMA: Agnosticismo Estético y Mapeo Semántico.
 */

export const VISUAL_LAWS = {
    ARCHETYPES: {
        VAULT: { class: 'stark-vault', icon: 'lock' },
        BRIDGE: { class: 'stark-bridge', icon: 'zap' },
        SENSOR: { class: 'stark-sensor', icon: 'eye' },
        ADAPTER: { class: 'stark-adapter', icon: 'plug' },
        SCHEMA: { class: 'stark-schema', icon: 'code' },
        TRIGGER: { class: 'stark-trigger', icon: 'play' }
    },

    INTENTS: {
        TRIGGER: { color: 'var(--accent-primary)', anim: 'pulse' },
        PROBE: { color: 'var(--accent-secondary)', anim: 'fade' },
        STREAM: { color: 'var(--status-success)', anim: 'flow' },
        GATE: { color: 'var(--status-warning)', anim: 'blink' }
    },

    SHELL_SLOTS: [
        'm01-auth-gate',
        'm02-vault-hub',
        'm03-canvas',
        'm04-copilot',
        'm05-inspector',
        'm06-monitor',
        'm07-archivist',
        'm08-armory',
        'm09-designer',
        'm10-matrix'
    ]
};
