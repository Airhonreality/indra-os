/**
 * lexicon.js
 * AXIOMA DE NEUTRALIDAD LINGÜÍSTICA (ADR_002 §5)
 * Centraliza todas las etiquetas de la UI para permitir multilenguaje sin acoplamiento.
 */

const LEXICON = {
    es: {
        // Acciones Primarias
        action_activate: "ACTIVAR_INTERFAZ",
        action_generate_ws: "GENERAR_NUEVO_WS",
        action_manage_services: "ADMINISTRAR_SERVICIOS",
        action_refresh: "PULSO_RECARGA",
        action_connect: "INICIAR_VÍNCULO",

        // Etiquetas Técnicas (HUD)
        hud_nexus_control: "CONTROL_NEXUS",
        hud_service_fabric: "TEJIDO_DE_SERVICIOS",
        hud_active_workspaces: "ENTORNOS_ACTIVOS",
        hud_system_log: "REGISTRO_SISTÉMICO",
        hud_ws_identity: "IDENTIDAD_NODO",
        hud_pins: "ANCLAJES",
        hud_sync: "SINCRO",

        // Estados
        status_ready: "LISTO",
        status_setup: "CONFIGURAR",
        status_offline: "DESCONECTADO",
        status_online: "EN_LÍNEA",

        // Identidad
        id_core: "ID_NÚCLEO",
        id_vault: "ID_BÓVEDA"
    },
    en: {
        action_activate: "ACTIVATE_INTERFACE",
        action_generate_ws: "GENERATE_NEW_WS",
        action_manage_services: "MANAGE_SERVICES",
        action_refresh: "REFRESH_PULSE",
        action_connect: "INITIATE_LINK",
        hud_nexus_control: "NEXUS_CONTROL",
        hud_service_fabric: "SERVICE_FABRIC",
        hud_active_workspaces: "ACTIVE_WORKSPACES",
        hud_system_log: "SYSTEM_LOG",
        hud_ws_identity: "WS_IDENTITY",
        hud_pins: "PINS",
        hud_sync: "SYNC",
        status_ready: "READY",
        status_setup: "SETUP",
        status_offline: "OFFLINE",
        status_online: "ONLINE",
        id_core: "CORE_ID",
        id_vault: "VAULT_ID"
    }
};

/**
 * Hook simple para usar el léxico.
 * @param {string} lang - Código de lenguaje ('es', 'en').
 * @returns {Function} Función t(key) para traducir.
 */
export const useLexicon = (lang = 'es') => {
    return (key) => LEXICON[lang]?.[key] || key.toUpperCase();
};
