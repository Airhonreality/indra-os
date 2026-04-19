/**
 * =============================================================================
 * INDRA SCHEMA: Auditoría de Ejemplo (JS-Native v5.0)
 * =============================================================================
 * Este esquema demuestra el poder del ADN Vivo.
 * Incluye lógica de transformación que el motor de resonancia puede ejecutar.
 * =============================================================================
 */

export default {
    id: "SCHEMA_AUDIT_JS_NATIVE",
    class: "DATA_SCHEMA",
    handle: {
        alias: "audit_js",
        label: "Auditoría JS Nativa",
        ns: "indra.v5"
    },
    payload: {
        fields: [
            { 
                id: "f1", 
                label: "Nombre del Agente", 
                type: "STRING",
                // AXIOMA: Lógica incrustada en el ADN
                transform: (val) => val ? val.toUpperCase() : "ANONYMOUS" 
            },
            { 
                id: "f2", 
                label: "Nivel de Resonancia", 
                type: "NUMBER",
                validate: (val) => val >= 0 && val <= 100
            }
        ],
        mappings: {
            drive: {
                "COL_AGENTE": "source.f1",
                "COL_NIVEL": "source.f2"
            }
        }
    }
};
