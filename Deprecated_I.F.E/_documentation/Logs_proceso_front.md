{
  "errorHandler": {
    "methods": [
      "createError",
      "isRecoverable",
      "requiresImmediateAttention"
    ],
    "schemas": {
      "createError": {
        "description": "Crea un error estructurado con código, mensaje y detalles.",
        "params": {
          "code": {
            "type": "string",
            "required": true,
            "description": "Código único de error."
          },
          "message": {
            "type": "string",
            "required": true,
            "description": "Mensaje legible para humanos."
          },
          "details": {
            "type": "object",
            "required": false,
            "description": "Metadatos adicionales del error."
          }
        }
      },
      "isRecoverable": {
        "description": "Determina si un error puede ser reintentado automáticamente.",
        "params": {
          "error": {
            "type": "object",
            "required": true,
            "description": "Objeto de error a evaluar."
          }
        }
      },
      "requiresImmediateAttention": {
        "description": "Determina si un error es crítico y requiere intervención manual.",
        "params": {
          "error": {
            "type": "object",
            "required": true,
            "description": "Objeto de error a evaluar."
          }
        }
      }
    }
  },
  "configurator": {
    "methods": [
      "storeParameter",
      "retrieveParameter",
      "getConfigurationStatus",
      "getAllParameters",
      "deleteParameter",
      "setTokenManager"
    ],
    "schemas": {
      "storeParameter": {
        "description": "Almacena un parámetro de configuración en ScriptProperties.",
        "params": {
          "key": {
            "type": "string",
            "required": true,
            "description": "Clave del parámetro."
          },
          "value": {
            "type": "string",
            "required": true,
            "description": "Valor del parámetro (debe ser string)."
          }
        }
      },
      "retrieveParameter": {
        "description": "Recupera un parámetro de configuración. Incluye capa de compatibilidad para API Keys.",
        "params": {
          "key": {
            "type": "string",
            "required": true,
            "description": "Clave del parámetro."
          }
        }
      },
      "deleteParameter": {
        "description": "Elimina un parámetro de configuración.",
        "params": {
          "key": {
            "type": "string",
            "required": true,
            "description": "Clave del parámetro."
          }
        }
      },
      "getConfigurationStatus": {
        "description": "Verifica si un conjunto de claves obligatorias está configurado.",
        "params": {
          "requiredKeys": {
            "type": "array",
            "required": true,
            "description": "Lista de claves a verificar."
          }
        }
      },
      "getAllParameters": {
        "description": "Obtiene todos los parámetros configurados en el sistema.",
        "params": {}
      }
    }
  },
  "keyGenerator": {
    "methods": [
      "generateUUID"
    ],
    "schemas": {
      "generateUUID": {
        "description": "Genera un identificador único universal (UUID) de versión 4.",
        "params": {}
      }
    }
  },
  "connectionTester": {
    "methods": [
      "test"
    ],
    "schemas": {
      "test": {
        "description": "Ejecuta una prueba de conexión para un proveedor específico.",
        "params": {
          "connectionType": {
            "type": "string",
            "required": true,
            "description": "Tipo de conexión (ej: NOTION_API_KEY, DEPLOYMENT_URL)."
          },
          "credentials": {
            "type": "object",
            "required": true,
            "description": "Objeto con las credenciales necesarias (apiToken, url, etc.)."
          }
        }
      }
    }
  },
  "sheetAdapter": {
    "methods": [
      "createSheet",
      "verifyHeader",
      "appendRow",
      "findRowByValue",
      "updateCell",
      "updateRow",
      "getRows",
      "insertRowsBatch"
    ],
    "schemas": {
      "createSheet": {
        "description": "Crea un nuevo Spreadsheet de Google Sheets.",
        "params": {
          "name": {
            "type": "string",
            "required": true,
            "description": "Nombre del archivo."
          },
          "header": {
            "type": "array",
            "required": false,
            "description": "Array de strings para la primera fila."
          }
        }
      },
      "verifyHeader": {
        "description": "Asegura que una hoja tenga la cabecera esperada, actualizándola si es necesario.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "expectedHeader": {
            "type": "array",
            "required": true,
            "description": "Cabecera deseada."
          }
        }
      },
      "appendRow": {
        "description": "Añade una fila al final de una hoja.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          },
          "rowData": {
            "type": "array",
            "required": true,
            "description": "Datos de la fila."
          }
        }
      },
      "findRowByValue": {
        "description": "Busca una fila que contenga un valor específico en una columna dada.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          },
          "columnIndex": {
            "type": "number",
            "required": true,
            "description": "Índice de la columna (1-based)."
          },
          "value": {
            "type": "any",
            "required": true,
            "description": "Valor a buscar."
          }
        }
      },
      "updateCell": {
        "description": "Actualiza el valor de una celda específica.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          },
          "rowNumber": {
            "type": "number",
            "required": true,
            "description": "Número de fila (1-based)."
          },
          "columnIndex": {
            "type": "number",
            "required": true,
            "description": "Número de columna (1-based)."
          },
          "value": {
            "type": "any",
            "required": true,
            "description": "Nuevo valor."
          }
        }
      },
      "updateRow": {
        "description": "Sobrescribe una fila completa.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          },
          "rowNumber": {
            "type": "number",
            "required": true,
            "description": "Número de fila a actualizar."
          },
          "rowData": {
            "type": "array",
            "required": true,
            "description": "Nuevos datos de la fila."
          }
        }
      },
      "getRows": {
        "description": "Lee todas las filas de una hoja y las mapea como objetos usando la primera fila como cabecera.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          }
        }
      },
      "insertRowsBatch": {
        "description": "Inserta múltiples filas de objetos en una sola operación optimizada.",
        "params": {
          "sheetId": {
            "type": "string",
            "required": true,
            "description": "ID del spreadsheet."
          },
          "sheetName": {
            "type": "string",
            "required": false,
            "description": "Nombre de la hoja."
          },
          "rows": {
            "type": "array",
            "required": true,
            "description": "Array de objetos coincidiendo con los headers de la hoja."
          }
        }
      }
    }
  },
  "driveAdapter": {
    "methods": [
      "find",
      "resolvePath",
      "store",
      "createFolder",
      "retrieve",
      "share",
      "move",
      "retrieveAsBlob"
    ],
    "schemas": {
      "find": {
        "description": "Busca o navega archivos y carpetas en Drive.",
        "params": {
          "query": {
            "type": "string",
            "required": true,
            "description": "Consulta (ROOT, ID in parents, o texto de búsqueda)."
          }
        }
      },
      "resolvePath": {
        "description": "Resuelve una ruta de carpetas (ej: 'A/B/C') desde un nodo raíz.",
        "params": {
          "rootFolderId": {
            "type": "string",
            "required": true,
            "description": "ID de la carpeta inicial."
          },
          "path": {
            "type": "string",
            "required": true,
            "description": "Ruta semántica separada por '/'."
          },
          "createIfNotExists": {
            "type": "boolean",
            "required": false,
            "description": "Si es true, crea las carpetas faltantes."
          }
        }
      },
      "store": {
        "description": "Guarda o actualiza un archivo en Drive.",
        "params": {
          "fileId": {
            "type": "string",
            "required": false,
            "description": "ID del archivo a actualizar."
          },
          "folderId": {
            "type": "string",
            "required": false,
            "description": "ID de la carpeta destino (si se crea nuevo)."
          },
          "fileName": {
            "type": "string",
            "required": false,
            "description": "Nombre del archivo (si se crea nuevo)."
          },
          "content": {
            "type": "string|Blob",
            "required": true,
            "description": "Contenido del archivo."
          },
          "mimeType": {
            "type": "string",
            "required": false,
            "description": "Tipo MIME del archivo."
          }
        }
      },
      "createFolder": {
        "description": "Crea una nueva carpeta dentro de otra.",
        "params": {
          "parentFolderId": {
            "type": "string",
            "required": true,
            "description": "ID de la carpeta padre."
          },
          "folderName": {
            "type": "string",
            "required": true,
            "description": "Nombre de la nueva carpeta."
          }
        }
      },
      "retrieve": {
        "description": "Recupera los metadatos y el contenido de un archivo JSON.",
        "params": {
          "fileId": {
            "type": "string",
            "required": false,
            "description": "ID del archivo."
          },
          "folderId": {
            "type": "string",
            "required": false,
            "description": "ID de la carpeta (si se busca por nombre)."
          },
          "fileName": {
            "type": "string",
            "required": false,
            "description": "Nombre del archivo (si se busca por nombre)."
          }
        }
      },
      "share": {
        "description": "Gestiona permisos de lectura o escritura para un correo.",
        "params": {
          "fileId": {
            "type": "string",
            "required": true,
            "description": "ID del archivo o carpeta."
          },
          "email": {
            "type": "string",
            "required": true,
            "description": "Correo del destinatario."
          },
          "role": {
            "type": "string",
            "required": true,
            "description": "Rol ('viewer' o 'writer')."
          }
        }
      },
      "move": {
        "description": "Mueve un archivo o carpeta a una nueva ubicación.",
        "params": {
          "targetId": {
            "type": "string",
            "required": true,
            "description": "ID del elemento a mover."
          },
          "destinationFolderId": {
            "type": "string",
            "required": true,
            "description": "ID de la carpeta destino."
          }
        }
      },
      "retrieveAsBlob": {
        "description": "Recupera un archivo de Drive como un objeto Blob nativo.",
        "params": {
          "fileId": {
            "type": "string",
            "required": true,
            "description": "ID del archivo."
          }
        }
      }
    }
  },
  "tokenManager": {
    "methods": [
      "loadTokens",
      "saveTokens",
      "getToken",
      "setToken",
      "listAccounts"
    ],
    "schemas": {
      "getToken": {
        "description": "Recupera los datos de una cuenta (token, isDefault) para un proveedor.",
        "params": {
          "provider": {
            "type": "string",
            "required": true,
            "description": "Nombre del proveedor (notion, llm, whatsapp, etc.)."
          },
          "accountId": {
            "type": "string",
            "required": false,
            "description": "ID de la cuenta. Si se omite, busca la cuenta por defecto."
          }
        }
      },
      "setToken": {
        "description": "Crea o actualiza una cuenta de token para un proveedor.",
        "params": {
          "provider": {
            "type": "string",
            "required": true,
            "description": "Nombre del proveedor."
          },
          "accountId": {
            "type": "string",
            "required": true,
            "description": "ID único para esta cuenta."
          },
          "tokenData": {
            "type": "object",
            "required": true,
            "description": "Datos del token { apiKey, label, isDefault, ... }."
          }
        }
      },
      "listAccounts": {
        "description": "Lista todas las cuentas configuradas para un proveedor.",
        "params": {
          "provider": {
            "type": "string",
            "required": true,
            "description": "Nombre del proveedor."
          }
        }
      },
      "loadTokens": {
        "description": "Carga y desencripta el archivo completo de tokens.",
        "params": {}
      }
    }
  },
  "renderEngine": {
    "methods": [
      "render"
    ],
    "schemas": {
      "render": {
        "description": "Renderiza una plantilla interpolando placeholders {{path}} con múltiples contextos.",
        "params": {
          "template": {
            "type": "any",
            "required": true,
            "description": "String, Objeto o Array con placeholders."
          }
        }
      }
    }
  },
  "calendarAdapter": {
    "methods": [
      "listCalendars",
      "listEvents",
      "createEvent",
      "updateEvent",
      "deleteEvent"
    ],
    "schemas": {
      "listCalendars": {
        "description": "Lista todos los calendarios accesibles para el usuario.",
        "params": {}
      },
      "listEvents": {
        "description": "Lista eventos de un calendario con soporte para sincronización incremental.",
        "params": {
          "calendarId": {
            "type": "string",
            "required": false,
            "description": "ID del calendario (default: 'primary')."
          },
          "syncToken": {
            "type": "string",
            "required": false,
            "description": "Token para cambios incrementales."
          },
          "timeMin": {
            "type": "string",
            "required": false,
            "description": "Límite inferior de tiempo (ISO 8601)."
          },
          "timeMax": {
            "type": "string",
            "required": false,
            "description": "Límite superior de tiempo (ISO 8601)."
          },
          "maxResults": {
            "type": "number",
            "required": false,
            "description": "Máximo de resultados (default: 250)."
          }
        }
      },
      "createEvent": {
        "description": "Crea un nuevo evento en Google Calendar.",
        "params": {
          "calendarId": {
            "type": "string",
            "required": false,
            "description": "ID del calendario destino."
          },
          "eventPayload": {
            "type": "object",
            "required": true,
            "description": "Recurso Event según Google Calendar API v3."
          }
        }
      },
      "updateEvent": {
        "description": "Actualiza parcialmente un evento usando la estrategia PATCH.",
        "params": {
          "calendarId": {
            "type": "string",
            "required": false,
            "description": "ID del calendario."
          },
          "eventId": {
            "type": "string",
            "required": true,
            "description": "ID del evento a modificar."
          },
          "eventPayload": {
            "type": "object",
            "required": true,
            "description": "Campos a actualizar."
          }
        }
      },
      "deleteEvent": {
        "description": "Elimina un evento de forma permanente.",
        "params": {
          "calendarId": {
            "type": "string",
            "required": false,
            "description": "ID del calendario."
          },
          "eventId": {
            "type": "string",
            "required": true,
            "description": "ID del evento."
          }
        }
      }
    }
  },
  "jobQueueService": {
    "methods": [
      "enqueue",
      "claimNextJob",
      "claimSpecificJob",
      "updateJobStatus",
      "admin_updateJobPayload"
    ],
    "schemas": {
      "enqueue": {
        "description": "Añade un nuevo trabajo (job) a la cola.",
        "params": {
          "flowId": {
            "type": "string",
            "required": true,
            "description": "ID del flujo a ejecutar."
          },
          "initialPayload": {
            "type": "object",
            "required": false,
            "description": "Datos iniciales para el flujo."
          },
          "triggerSource": {
            "type": "string",
            "required": false,
            "description": "Origen del disparo."
          }
        }
      },
      "claimNextJob": {
        "description": "Reclama el siguiente trabajo pendiente de la cola (atómico).",
        "params": {}
      },
      "claimSpecificJob": {
        "description": "Reclama un trabajo específico por su ID si está pendiente.",
        "params": {
          "jobId": {
            "type": "string",
            "required": true,
            "description": "ID del job."
          }
        }
      },
      "updateJobStatus": {
        "description": "Actualiza el estado y los resultados de un trabajo.",
        "params": {
          "jobId": {
            "type": "string",
            "required": true,
            "description": "ID del job."
          },
          "status": {
            "type": "string",
            "required": true,
            "description": "Nuevo estado (completed, failed...)."
          },
          "details": {
            "type": "object",
            "required": false,
            "description": "Resultado ({result}) o error ({error})."
          }
        }
      }
    }
  },
  "flowRegistry": {
    "methods": [
      "getFlow",
      "saveFlow",
      "listFlows"
    ],
    "schemas": {
      "getFlow": {
        "description": "Obtiene un flujo JSON por su ID (desde Drive o caché).",
        "params": {
          "flowId": {
            "type": "string",
            "required": true,
            "description": "ID del flujo (sin .json)."
          }
        }
      },
      "saveFlow": {
        "description": "Guarda un objeto de flujo en Drive.",
        "params": {
          "flowId": {
            "type": "string",
            "required": true,
            "description": "ID del flujo."
          },
          "flowObject": {
            "type": "object",
            "required": true,
            "description": "Contenido del flujo."
          }
        }
      },
      "listFlows": {
        "description": "Lista todos los IDs de flujos disponibles en la carpeta del registro.",
        "params": {}
      }
    }
  },
  "publicApi": {
    "methods": [
      "invoke",
      "processNextJobInQueue",
      "processSpecificJob",
      "listTokenProviders",
      "listTokenAccounts",
      "upsertToken",
      "deleteToken"
    ]
  },
  "coreOrchestrator": {
    "methods": [
      "executeFlow"
    ],
    "schemas": {
      "executeFlow": {
        "description": "Punto de entrada para la ejecución de flujos lógicos (H7).",
        "params": {
          "flow": {
            "type": "object",
            "required": true,
            "description": "Configuración del flujo (steps, connections)."
          },
          "initialContext": {
            "type": "object",
            "required": false,
            "description": "Variables iniciales del contexto."
          }
        }
      }
    }
  },
  "monitoringService": {
    "methods": [
      "logEvent",
      "sendCriticalAlert"
    ],
    "schemas": {
      "logEvent": {
        "description": "Registra un evento en la hoja de auditoría.",
        "params": {
          "eventData": {
            "type": "object",
            "required": true,
            "description": "Datos del evento según AuditLog Schema."
          }
        }
      },
      "sendCriticalAlert": {
        "description": "Envía una alerta inmediata por email si el error es crítico.",
        "params": {
          "error": {
            "type": "object",
            "required": true,
            "description": "Error estructurado."
          },
          "context": {
            "type": "object",
            "required": false,
            "description": "Metadatos adicionales."
          }
        }
      }
    }
  },
  "adminTools": {
    "methods": [
      "listAllJobs",
      "getQueueStats",
      "clearAllJobs",
      "resetJob",
      "clearAllFlowsCache",
      "rollbackToLegacyTokens"
    ],
    "schemas": {
      "listAllJobs": {
        "description": "Obtiene un snapshot de todos los trabajos en la cola con estadísticas.",
        "params": {}
      },
      "getQueueStats": {
        "description": "Retorna estadísticas agregadas de la cola (total, pending, processed...).",
        "params": {}
      },
      "clearAllJobs": {
        "description": "⚠️ ELIMINA todos los trabajos de la cola (destructivo).",
        "params": {}
      },
      "resetJob": {
        "description": "Vuelve a poner un trabajo en estado 'pending'.",
        "params": {
          "jobId": {
            "type": "string",
            "required": true,
            "description": "ID del trabajo a resetear."
          }
        }
      },
      "clearAllFlowsCache": {
        "description": "Limpia el caché de ScriptCache para todos los flujos.",
        "params": {}
      },
      "rollbackToLegacyTokens": {
        "description": "Copia tokens desde TokenManager de vuelta a ScriptProperties (legacy).",
        "params": {}
      }
    }
  },
  "lowFiPdfAdapter": {
    "methods": [
      "generate"
    ],
    "schemas": {
      "generate": {
        "description": "Genera un PDF de baja fidelidad a partir de un string HTML.",
        "params": {
          "htmlContent": {
            "type": "string",
            "required": true,
            "description": "Contenido HTML del reporte."
          }
        }
      }
    }
  },
  "notionAdapter": {
    "methods": [
      "search",
      "retrieveDatabase",
      "queryDatabase",
      "queryDatabaseContent",
      "retrievePage",
      "createPage",
      "updatePageProperties",
      "retrieveBlockChildren",
      "retrievePageWithContent",
      "appendBlockChildren",
      "updateBlock",
      "deleteBlock",
      "startFileUpload",
      "uploadFileContent",
      "uploadAndAttachFile",
      "retrieveComments",
      "createComment",
      "createDatabase",
      "createRelationProperty",
      "createRollupProperty",
      "deleteProperty",
      "updateProperty"
    ],
    "schemas": {
      "createPage": {
        "description": "Crea una nueva página en una base de datos o como hija de otra página.",
        "params": {
          "parent": {
            "type": "object",
            "required": true,
            "description": "Referencia al padre { database_id: '...' } o { page_id: '...' }"
          },
          "properties": {
            "type": "object",
            "required": true,
            "description": "Propiedades de la página según el esquema de la base de datos."
          },
          "accountId": {
            "type": "string",
            "required": false,
            "description": "ID de la cuenta de Notion a usar."
          }
        }
      },
      "queryDatabase": {
        "description": "Consulta una base de datos de Notion con filtros y ordenamiento.",
        "params": {
          "databaseId": {
            "type": "string",
            "required": true,
            "description": "ID de la base de datos de Notion."
          },
          "filter": {
            "type": "object",
            "required": false,
            "description": "Filtros de la API de Notion."
          },
          "sorts": {
            "type": "array",
            "required": false,
            "description": "Ordenamientos de la API de Notion."
          },
          "pageSize": {
            "type": "number",
            "required": false,
            "description": "Tamaño de página (máx 100)."
          }
        }
      },
      "search": {
        "description": "Busca objetos (páginas o BDs) en el espacio de trabajo de Notion.",
        "params": {
          "query": {
            "type": "string",
            "required": false,
            "description": "Texto a buscar."
          },
          "filter": {
            "type": "object",
            "required": false,
            "description": "Filtro por tipo de objeto { property: 'object', value: 'page' | 'database' }."
          }
        }
      }
    }
  },
  "emailAdapter": {
    "methods": [
      "send"
    ],
    "schemas": {
      "send": {
        "description": "Envía un correo electrónico. Soporta adjuntos y multi-cuenta.",
        "params": {
          "to": {
            "type": "string",
            "required": true,
            "description": "Destinatario(s) separados por coma."
          },
          "subject": {
            "type": "string",
            "required": true,
            "description": "Asunto del mensaje."
          },
          "body": {
            "type": "string",
            "required": true,
            "description": "Cuerpo del mensaje en texto plano."
          },
          "options": {
            "type": "object",
            "required": false,
            "description": "Opciones adicionales { htmlBody, cc, bcc, name, replyTo, attachments: Array<string|Blob> }"
          },
          "accountId": {
            "type": "string",
            "required": false,
            "description": "ID de la cuenta de Google a usar."
          }
        }
      }
    }
  },
  "llmAdapter": {
    "methods": [
      "chat",
      "chatGemini"
    ],
    "schemas": {
      "chatGemini": {
        "description": "Envía una solicitud de IA a Google Gemini.",
        "params": {
          "prompt": {
            "type": "string",
            "required": true,
            "description": "El mensaje del usuario."
          },
          "systemInstruction": {
            "type": "string",
            "required": false,
            "description": "Instrucciones de comportamiento."
          },
          "model": {
            "type": "string",
            "required": false,
            "description": "Modelo (default: gemini-1.5-flash)."
          },
          "temperature": {
            "type": "number",
            "required": false,
            "description": "Creatividad (0.0 a 1.0)."
          },
          "accountId": {
            "type": "string",
            "required": false,
            "description": "ID de la cuenta en TokenManager."
          }
        }
      },
      "chat": {
        "description": "Interfaz universal de chat (actualmente apunta a Gemini).",
        "params": {
          "prompt": {
            "type": "string",
            "required": true
          }
        }
      }
    }
  },
  "whatsappAdapter": {
    "methods": [
      "sendMessage"
    ],
    "schemas": {
      "sendMessage": {
        "description": "Envía un mensaje de WhatsApp (texto o plantilla) vía Meta Graph API.",
        "params": {
          "to": {
            "type": "string",
            "required": true,
            "description": "Número de destino con código de país (ej: +34...)."
          },
          "message": {
            "type": "string",
            "required": false,
            "description": "Cuerpo del mensaje de texto."
          },
          "template": {
            "type": "object",
            "required": false,
            "description": "Configuración de plantilla { name, language, components }."
          },
          "phoneNumberId": {
            "type": "string",
            "required": false,
            "description": "ID del número de teléfono remitente."
          },
          "accountId": {
            "type": "string",
            "required": false,
            "description": "ID de la cuenta de WhatsApp en TokenManager."
          }
        }
      }
    }
  },
  "flowUtilsService": {
    "methods": [
      "getTimestamp",
      "formatDate",
      "formatCurrency",
      "stringify",
      "createTextBlocks",
      "evaluateCondition",
      "transformText",
      "buildText",
      "calculate",
      "pluck",
      "mergeObjects",
      "findInCollection",
      "get",
      "set",
      "mapObject",
      "join",
      "wait",
      "lookupValue",
      "checkSyncLoop",
      "mapObjects"
    ],
    "schemas": {
      "getTimestamp": {
        "description": "Obtiene el timestamp ISO 8601 actual.",
        "params": {}
      },
      "formatDate": {
        "description": "Formatea una fecha según el patrón indicado.",
        "params": {
          "date": {
            "type": "string|number",
            "required": true,
            "description": "Fecha a formatear."
          },
          "format": {
            "type": "string",
            "required": false,
            "description": "Formato (ej: yyyy-MM-dd)."
          }
        }
      },
      "formatCurrency": {
        "description": "Formatea un número como moneda (USD por defecto).",
        "params": {
          "value": {
            "type": "number",
            "required": true,
            "description": "Valor numérico."
          },
          "currencyCode": {
            "type": "string",
            "required": false,
            "description": "Código ISO (USD, EUR...)."
          }
        }
      },
      "evaluateCondition": {
        "description": "Evalúa una condición lógica (equals, not_equals, greater_than, contains...).",
        "params": {
          "value1": {
            "type": "any",
            "required": true
          },
          "operator": {
            "type": "string",
            "required": true
          },
          "value2": {
            "type": "any",
            "required": false
          }
        }
      },
      "transformText": {
        "description": "Aplica transformaciones de texto (trim, uppercase, capitalize...).",
        "params": {
          "text": {
            "type": "string",
            "required": true
          },
          "operations": {
            "type": "array",
            "required": true,
            "description": "Lista de operaciones."
          }
        }
      },
      "buildText": {
        "description": "Renderiza una plantilla usando el contexto de datos (delega en RenderEngine).",
        "params": {
          "template": {
            "type": "string",
            "required": true
          },
          "data": {
            "type": "object",
            "required": false,
            "description": "Contexto local para la plantilla."
          }
        }
      },
      "calculate": {
        "description": "Realiza cálculos matemáticos simples (add, subtract, percentage_of...).",
        "params": {
          "value1": {
            "type": "number",
            "required": true
          },
          "operator": {
            "type": "string",
            "required": true
          },
          "value2": {
            "type": "number",
            "required": true
          }
        }
      },
      "pluck": {
        "description": "Extrae un subconjunto de propiedades de cada objeto en una colección.",
        "params": {
          "collection": {
            "type": "array",
            "required": true
          },
          "paths": {
            "type": "object",
            "required": true,
            "description": "Mapeo { nuevoNombre: 'ruta.anidada' }."
          }
        }
      },
      "get": {
        "description": "Acceso seguro (lodash.get) a propiedades anidadas.",
        "params": {
          "object": {
            "type": "object",
            "required": true
          },
          "path": {
            "type": "string",
            "required": true
          },
          "defaultValue": {
            "type": "any",
            "required": false
          }
        }
      },
      "set": {
        "description": "Establece (lodash.set) un valor en una ruta anidada, creando la estructura necesaria.",
        "params": {
          "object": {
            "type": "object",
            "required": true
          },
          "path": {
            "type": "string",
            "required": true
          },
          "value": {
            "type": "any",
            "required": true
          }
        }
      },
      "wait": {
        "description": "Pausa la ejecución (Utilities.sleep).",
        "params": {
          "milliseconds": {
            "type": "number",
            "required": true
          }
        }
      },
      "lookupValue": {
        "description": "Busca en una colección y retorna una propiedad específica del elemento encontrado.",
        "params": {
          "collection": {
            "type": "array",
            "required": true
          },
          "searchKey": {
            "type": "string",
            "required": true
          },
          "searchValue": {
            "type": "any",
            "required": true
          },
          "returnKey": {
            "type": "string",
            "required": true
          }
        }
      }
    }
  },
  "systemInitializer": {
    "methods": [
      "runBootstrap"
    ],
    "schemas": {
      "runBootstrap": {
        "description": "Ejecuta la inicialización idempotente del sistema (Carpetas, Sheets, Tokens).",
        "params": {}
      }
    }
  }
}