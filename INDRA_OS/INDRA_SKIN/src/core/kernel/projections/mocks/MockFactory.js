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
            "ARCHETYPE": "SLOT",
            "DOMAIN": "ORCHESTRATION",
            "CAPABILITIES": {
                "RENDER_VIEW": { "label": "Proyectar Vista", "icon": "📺", "status": "CONNECTED", "value": "ACTIVE", "desc": "Proyectar vista hacia el dashboard" },
                "EXPORT_PDF": { "label": "Exportar PDF", "icon": "📄", "status": "DEFAULT", "value": "READY", "desc": "Materializar documento estático" },
                "STYLE_SYNC": { "label": "Sincronía ADN", "icon": "🧬", "status": "CONNECTED", "value": "v1.2", "desc": "Sincronizar ADN visual" },
                "DATA_BRIDGE": { "label": "Puente de Datos", "icon": "🌉", "status": "BROKEN", "value": "OFFLINE", "desc": "Enlace físico con el Core" }
            },
            "views": [
                { "id": "v1", "label": "Tablero de Control", "type": "DASHBOARD" },
                { "id": "v2", "label": "Factura Impresa", "type": "DOCUMENT_PAGINATED" }
            ]
        },
        "COSMOS": {
            "LABEL": "Cosmos Reality",
            "ARCHETYPE": "REALITY",
            "DOMAIN": "SPATIAL",
            "CAPABILITIES": {
                "GRAVITY": { "label": "Gravedad", "icon": "🌌", "status": "CONNECTED", "value": "9.8m/s²" },
                "ENTROPY": { "label": "Entropía", "icon": "⏳", "status": "DEFAULT", "value": "LOW" },
                "DIMENSIONS": { "label": "Dimensiones", "icon": "📐", "status": "CONNECTED", "value": "3D + TIME" }
            }
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
                "PROCESS": { "label": "Procesador", "icon": "⚡", "status": "CONNECTED", "value": "8 Cores" },
                "MEMORY": { "label": "Memoria RAM", "icon": "🧠", "status": "CONNECTED", "value": "16GB" },
                "UPTIME": { "label": "Tiempo Activo", "icon": "⏱️", "status": "DEFAULT", "value": "12d 4h" }
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
                "QUERY": { "label": "Consultas", "icon": "🔍", "status": "CONNECTED", "value": "SQL_INIT" },
                "PERSISTENCE": { "label": "Persistencia", "icon": "💾", "status": "CONNECTED", "value": "NOMINAL" },
                "SCHEMA_VOL": { "label": "Volumen", "icon": "📊", "status": "DEFAULT", "value": "1.2 TB" }
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

    "GARAGE_PROTOTYPES": {
        "VAULT": {
            "id": "garage_vault", "LABEL": "PROTOTYPE_VAULT", "ARCHETYPE": "VAULT", "DOMAIN": "SYSTEM",
            "items": [
                { id: 'g1', name: 'Prototype Folder A', type: 'DIRECTORY' },
                { id: 'g2', name: 'Prototype Folder B', type: 'DIRECTORY' },
                { id: 'g3', name: 'Mock_Database.db', type: 'DATABASE' },
                { id: 'g4', name: 'Design_System.pdf', type: 'FILE', mimeType: 'application/pdf' }
            ]
        },
        "DATABASE": {
            "id": "garage_db", "LABEL": "PROTOTYPE_DB", "ARCHETYPE": "DATABASE", "DOMAIN": "DATA_L1",
            "data": {
                "columns": [
                    { id: 'id', label: 'ID', type: 'string' },
                    { id: 'status', label: 'Status', type: 'tag' },
                    { id: 'value', label: 'Value', type: 'number' }
                ],
                "rows": [
                    { id: 'row_1', status: 'ACTIVE', value: 100 },
                    { id: 'row_2', status: 'PENDING', value: 50 },
                    { id: 'row_3', status: 'CLOSED', value: 75 }
                ]
            }
        },
        "SLOT": {
            "id": "garage_slot", "LABEL": "PROTOTYPE_SLOT", "ARCHETYPE": "SLOT", "DOMAIN": "ORCHESTRATION",
            "CAPABILITIES": {
                "RENDER_VIEW": { "label": "Proyectar Vista", "icon": "TV_SCREEN", "status": "CONNECTED", "value": "ACTIVE", "desc": "Proyectar vista hacia el dashboard" },
                "EXPORT_PDF": { "label": "Exportar PDF", "icon": "PDF", "status": "DEFAULT", "value": "READY", "desc": "Materializar documento estático" },
                "STYLE_SYNC": { "label": "Sincronía ADN", "icon": "SYNC", "status": "CONNECTED", "value": "v1.2", "desc": "Sincronizar ADN visual" },
                "DATA_BRIDGE": { "label": "Puente de Datos", "icon": "BRIDGE", "status": "BROKEN", "value": "OFFLINE", "desc": "Enlace físico con el Core" }
            },
            "views": [
                { "id": "v1", "label": "Tablero de Control", "type": "DASHBOARD" },
                { "id": "v2", "label": "Factura Impresa", "type": "DOCUMENT_PAGINATED" }
            ]
        },
        "COMMUNICATION": {
            "id": "garage_comm", "LABEL": "PROTOTYPE_COMM", "ARCHETYPE": "COMMUNICATION", "DOMAIN": "COMMUNICATION",
            "CAPABILITIES": {
                "INBOX": { "label": "Bandeja de Entrada", "icon": "CHAT", "status": "CONNECTED", "value": "12 New" },
                "SYNC_MAIL": { "label": "Sincronizar", "icon": "SYNC", "status": "DEFAULT", "value": "LIVE" }
            }
        },
        "LLM": {
            "id": "garage_llm", "LABEL": "PROTOTYPE_LLM", "ARCHETYPE": "SERVICE", "DOMAIN": "INTELLIGENCE",
            "CAPABILITIES": {
                "GENERATE": { "label": "Generar", "icon": "SYNC", "status": "CONNECTED", "value": "NOMINAL" },
                "ANALYZE": { "label": "Analizar", "icon": "SYNC", "status": "DEFAULT", "value": "IDLE" }
            }
        },
        "REALITY": {
            "id": "garage_cosmos", "LABEL": "PROTOTYPE_REALITY", "ARCHETYPE": "REALITY", "DOMAIN": "SPATIAL",
            "CAPABILITIES": {
                "GRAVITY": { "label": "Gravedad", "icon": "GRAVITY", "status": "CONNECTED", "value": "9.8m/s²" },
                "ENTROPY": { "label": "Entropía", "icon": "ENTROPY", "status": "DEFAULT", "value": "LOW" },
                "DIMENSIONS": { "label": "Dimensiones", "icon": "DIMENSIONS", "status": "CONNECTED", "value": "3D + TIME" }
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



