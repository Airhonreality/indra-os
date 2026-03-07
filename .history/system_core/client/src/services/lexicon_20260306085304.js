/**
 * lexicon.js
 * Centraliza solo verbos de interfaz. Las entidades son soberanía del Core.
 */

const LEXICON = {
    es: {
        action_sync: "SINCRO_RESONANCIA",
        action_back: "SALIR_ESPACIO",
        action_generate: "NUEVO_ARTEFACTO",
        status_unnamed: "SIN_NOMBRE",
        status_loading: "PULSANDO_CORE...",
        hold_to_delete: "MANTENER_PARA_BORRAR"
    },
    en: {
        action_sync: "SYNC_RESONANCE",
        action_back: "EXIT_SPACE",
        action_generate: "NEW_ARTIFACT",
        status_unnamed: "UNNAMED",
        status_loading: "PULSING_CORE...",
        hold_to_delete: "HOLD_TO_DELETE"
    }
};

export const useLexicon = (lang = 'es') => {
    return (key) => LEXICON[lang]?.[key] || key.toUpperCase();
};
