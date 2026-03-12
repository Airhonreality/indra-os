/**
 * lexicon.js
 * Centraliza solo verbos de interfaz. Las entidades son soberanía del Core.
 */

const LEXICON = {
    es: {
        action_sync: "SINCRO_RESONANCIA",
        action_back: "SALIR_ESPACIO",
        action_generate: "NUEVO_ARTEFACTO",
        DOCUMENT_DESIGNER: "PLANTILLA_DOC",
        status_unnamed: "SIN_NOMBRE",
        status_loading: "PULSANDO_CORE...",
        hold_to_delete: "MANTENER_PARA_BORRAR",
        hud_service_fabric: "TEJIDO_DE_SERVICIOS",
        action_manage_services: "GESTIONAR_INFRA",
        hud_nexus_control: "CENTRO_NEXUS"
    },
    en: {
        action_sync: "SYNC_RESONANCE",
        action_back: "EXIT_SPACE",
        action_generate: "NEW_ARTIFACT",
        DOCUMENT_DESIGNER: "DOC_TEMPLATE",
        status_unnamed: "UNNAMED",
        status_loading: "PULSING_CORE...",
        hold_to_delete: "HOLD_TO_DELETE",
        hud_service_fabric: "SERVICE_FABRIC",
        action_manage_services: "MANAGE_INFRA",
        hud_nexus_control: "NEXUS_CONTROL"
    }
};

export const useLexicon = (lang = 'es') => {
    return (key) => LEXICON[lang]?.[key] || key.toUpperCase();
};
