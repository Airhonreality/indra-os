/**
 * MockFactory.js (SKIN)
 * 🧪 Esqueleto de Emergencia Indra v8.0
 * 
 * DHARMA: Este archivo solo contiene datos para cuando el Core es inaccesible.
 * En condiciones normales, el sistema cosecha las semillas del MockFactory real del Core.
 */

export const MOCK_GENOTYPE = {
    "VERSION": "CORE_UNREACHABLE",
    "COMPONENT_REGISTRY": {
        "DRIVE": {
            "LABEL": "Google Drive",
            "ARCHETYPE": "VAULT",
            "DOMAIN": "SYSTEM_CORE",
            "CAPABILITIES": {
                "search": { "io": "READ", "type": "DATAFRAME", "desc": "Global semantic search" },
                "upload": { "io": "WRITE", "type": "BLOB", "desc": "Blob storage ingestion" },
                "sync": { "io": "REFRESH", "type": "SIGNAL", "desc": "Force state consistency" },
                "move": { "io": "WRITE", "type": "SIGNAL", "desc": "Relocate atomic unit" }
            },
            "VITAL_SIGNS": {
                "LATENCY": { "criticality": "NOMINAL", "value": "45ms", "trend": "stable" },
                "STORAGE": { "criticality": "WARNING", "value": "85%", "trend": "rising" },
                "API_QUOTA": { "criticality": "NOMINAL", "value": "1200/min", "trend": "stable" }
            },
            "UI_LAYOUT": {
                "SIDE_PANEL": "ENABLED",
                "TERMINAL_STREAM": "ENABLED"
            }
        },
        "NOTION": {
            "LABEL": "Notion",
            "ARCHETYPE": "VAULT",
            "DOMAIN": "KNOWLEDGE_GRAPH",
            "CAPABILITIES": {
                "listContents": { "io": "READ", "type": "DATAFRAME", "desc": "Explora estructura del grafo" },
                "search": { "io": "READ", "type": "DATAFRAME", "desc": "Búsqueda semántica global" },
                "query_db": { "io": "READ", "type": "DATAFRAME", "desc": "Consulta tablas y bases de datos" },
                "read_content": { "io": "READ", "type": "DATAFRAME", "desc": "Lectura de bloques como Markdown" }
            },
            "VITAL_SIGNS": {
                "API_RATE": { "criticality": "NOMINAL", "value": "3/sec", "trend": "flat" },
                "TOKEN_STATUS": { "criticality": "NOMINAL", "value": "VALID", "trend": "stable" }
            }
        },
        "EMAIL": {
            "LABEL": "Terminal Mail",
            "ARCHETYPE": "ADAPTER",
            "DOMAIN": "COMMUNICATION",
            "CAPABILITIES": {
                "send": {
                    "io": "WRITE",
                    "type": "SIGNAL",
                    "desc": "Dispatch secure courier",
                    "inputs": {
                        "to": { "type": "string" },
                        "subject": { "type": "string" },
                        "body": { "type": "DATAFRAME" },
                        "attachment": { "type": "BLOB" },
                        "accountId": { "type": "string" }
                    }
                },
                "scan": { "io": "READ", "type": "DATAFRAME", "desc": "Inbox telemetry search" }
            },
            "VITAL_SIGNS": {
                "SCAN": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "stable" },
                "QUOTA_USED": { "criticality": "NOMINAL", "value": "12%", "trend": "flat" }
            }
        },

        "SLOT_MANAGER": {
            "LABEL": "Reality Slot",
            "ARCHETYPE": "SLOT_NODE",
            "DOMAIN": "ORCHESTRATION",
            "CAPABILITIES": {
                "RENDER_VIEW": { "io": "READ", "type": "SIGNAL", "desc": "Proyectar vista hacia el dashboard" },
                "EXPORT_PDF": { "io": "WRITE", "type": "BLOB", "desc": "Materializar documento estático" },
                "STYLE_SYNC": { "io": "INPUT", "type": "DATAFRAME", "desc": "Sincronizar ADN visual" }
            },
            "views": [
                { "id": "v1", "label": "Tablero de Control", "type": "CANVAS_INFINITE" },
                { "id": "v2", "label": "Factura Impresa", "type": "DOCUMENT_PAGINATED" }
            ]
        },
        "LLM": {
            "LABEL": "Cognitive Engine",
            "ARCHETYPE": "SERVICE",
            "DOMAIN": "INTELLIGENCE",
            "CAPABILITIES": {
                "generate": { "io": "WRITE", "type": "SIGNAL", "desc": "Generar texto creativo", "inputs": { "prompt": { "type": "string" } } },
                "analyze": { "io": "READ", "type": "DATAFRAME", "desc": "Analizar sentimiento/entidades" },
                "chat": { "io": "STREAM", "type": "SIGNAL", "desc": "Conversación continua" }
            },
            "VITAL_SIGNS": {
                "TOKENS_PM": { "criticality": "NOMINAL", "value": "450", "trend": "stable" },
                "LATENCY": { "criticality": "WARNING", "value": "1.2s", "trend": "rising" }
            }
        },
        "NODE": {
            "LABEL": "Generic Processor",
            "ARCHETYPE": "NODE",
            "DOMAIN": "LOGIC",
            "CAPABILITIES": {
                "process": { "io": "TRIGGER", "type": "SIGNAL", "desc": "Execute logic" },
                "result": { "io": "READ", "type": "DATAFRAME", "desc": "Output data" }
            },
            "VITAL_SIGNS": {
                "CPU": { "criticality": "NOMINAL", "value": "12%", "trend": "stable" }
            }
        },
        "DATABASE": {
            "LABEL": "Generic DB",
            "ARCHETYPE": "DATABASE",
            "DOMAIN": "DATA_L1",
            "CAPABILITIES": {
                "query": { "io": "READ", "type": "DATAFRAME", "desc": "Ejecutar SQL/NoSQL" },
                "persist": { "io": "WRITE", "type": "SIGNAL", "desc": "Guardar registro" },
                "schema": { "io": "READ", "type": "DATAFRAME", "desc": "Obtener esquema" }
            },
            "VITAL_SIGNS": {
                "CONNECTIONS": { "criticality": "NOMINAL", "value": "4/10", "trend": "flat" }
            },
            "data": {
                "type": "DATABASE",
                "columns": [
                    { id: "id", label: "ID", type: "number" },
                    { id: "nombre", label: "Nombre", type: "string" },
                    { id: "contacto", label: "Contacto", type: "string" },
                    { id: "estado", label: "Estado", type: "tag" },
                    { id: "prioridad", label: "Prioridad", type: "number" }
                ],
                "rows": [
                    { id: 1, nombre: 'Empresa Alpha', contacto: 'Juan Perez', estado: 'ACTIVO', prioridad: 5 },
                    { id: 2, nombre: 'Beta Dynamics', contacto: 'Maria Garcia', estado: 'PENDIENTE', prioridad: 3 },
                    { id: 3, nombre: 'Gamma Solutions', contacto: 'Luis Rodriguez', estado: 'INACTIVO', prioridad: 1 },
                    { id: 4, nombre: 'Delta Systems', contacto: 'Ana Martinez', estado: 'ACTIVO', prioridad: 4 },
                    { id: 5, nombre: 'Epsilon Tech', contacto: 'Carlos Sanchez', estado: 'ACTIVO', prioridad: 2 }
                ]
            }
        }
    },
    "ARTIFACT_SCHEMAS": {
        "COSMOS_V1": {
            "identity": {
                "type": "object", "validation": { "required": true }, "structure": {
                    "label": { "type": "string", "validation": { "required": true } },
                    "description": { "type": "string" }
                }
            },
            "namespace": {
                "type": "object", "validation": { "required": true }, "structure": {
                    "ui": { "type": "string" },
                    "logic": { "type": "string" },
                    "data": { "type": "string" },
                    "media": { "type": "string" }
                }
            }
        }
    }
};

export const MOCK_VAULT_DATA = [
    { id: 'root_1', name: 'Mi Unidad', type: 'FOLDER', mimeType: 'folder', parent: 'ROOT' },
    { id: 'root_2', name: 'Compartidos con migo', type: 'FOLDER', mimeType: 'folder', parent: 'ROOT' },
    { id: 'root_3', name: 'Recientes', type: 'FOLDER', mimeType: 'folder', parent: 'ROOT' },
    { id: 'f1', name: 'PROYECTOS_2024', type: 'FOLDER', mimeType: 'folder', parent: 'root_1' },
    { id: 'f2', name: 'LEGAL_DOCS', type: 'FOLDER', mimeType: 'folder', parent: 'root_1' },
    { id: 'db_notion_1', name: 'Tabla de Clientes (Notion)', type: 'DATABASE', mimeType: 'application/vnd.indra.notion-db', parent: 'f1' },
    { id: 'd1', name: 'blueprint_v8.pdf', type: 'FILE', mimeType: 'application/pdf', size: '2.4MB', parent: 'f1' },
    { id: 'd2', name: 'budget_draft.xlsx', type: 'FILE', mimeType: 'application/vnd.ms-excel', size: '156KB', parent: 'f1' },
    { id: 'd3', name: 'emergency_contact.txt', type: 'FILE', mimeType: 'text/plain', size: '1KB', parent: 'root_1' },
];

export const MOCK_DATABASE_ROWS = {
    'db_notion_1': [
        { id: 1, nombre: 'Empresa Alpha', contacto: 'Juan Perez', estado: 'ACTIVO', prioridad: 5 },
        { id: 2, nombre: 'Beta Dynamics', contacto: 'Maria Garcia', estado: 'PENDIENTE', prioridad: 3 },
        { id: 3, nombre: 'Gamma Solutions', contacto: 'Luis Rodriguez', estado: 'INACTIVO', prioridad: 1 },
        { id: 4, nombre: 'Delta Systems', contacto: 'Ana Martinez', estado: 'ACTIVO', prioridad: 4 },
        { id: 5, nombre: 'Epsilon Tech', contacto: 'Carlos Sanchez', estado: 'ACTIVO', prioridad: 2 }
    ]
};

export const getMockDataByQuery = (query, parentId = 'ROOT') => {
    if (!query) return MOCK_VAULT_DATA.filter(item => item.parent === parentId);

    // Si hay query, buscamos en todo el vault (Global Search)
    return MOCK_VAULT_DATA.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );
};
