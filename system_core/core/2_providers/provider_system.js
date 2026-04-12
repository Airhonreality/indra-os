/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system.gs
 * RESPONSABILIDAD: Punto de entrada (ORQUESTADOR) del Provider Sistema.
 * DHARMA (MCA):
 *   - Fractalidad: Despacha a sub-handlers especializados.
 *   - Sinceridad: Centraliza el Manifiesto y las Capacidades.
 * =============================================================================
 */

/**
 * Manifestación del Silo System (Core Internals). Sigue ADR-002.
 */
function CONF_SYSTEM() {
  return Object.freeze({
    id: 'system',
    exposure: 'internal', // El Core no necesita ser "vinculado" manualmente por el usuario
    handle: { ns: 'com.indra.system.core', alias: 'system', label: 'Indra System', icon: 'VAULT' },
    class: 'FOLDER',
    version: '1.2 (Fractal)',
    version: '1.3 (Synthesis)',
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID', handler: 'handleSystem' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ATOM_EXISTS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ATOM_ALIAS_RENAME: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SCHEMA_FIELD_ALIAS_RENAME: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      ALIAS_COLLISION_SCAN: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_PIN: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_UNPIN: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_PINS_READ: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_WORKSPACE_REPAIR: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      GETMCEPMANIFEST: { sync: 'BLOCKING', exposure: 'public', handler: 'handleSystem' },
      INTELLIGENCE_CHAT: { sync: 'BLOCKING', exposure: 'public', handler: 'handleSystem' },
      FORMULA_EVAL: { sync: 'BLOCKING', purge: 'NONE', handler: 'SYSTEM_executeLogicBridge' },
      SCHEMA_SUBMIT: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SCHEMA_FIELD_OPTIONS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ACCOUNT_RESOLVE: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_AUDIT: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      REVISIONS_LIST: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      ATOM_ROLLBACK: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      INDUCTION_START: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      INDUCTION_INDUCE_FULL_STACK: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      INDUCTION_STATUS: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      INDUCTION_CANCEL: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      INDUCTION_DRIFT_CHECK: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_BLUEPRINT_SYNC: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      NATIVE_DOCUMENT_RENDER: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' },
      SYSTEM_SCHEMA_IGNITE: { sync: 'BLOCKING', purge: 'ALL', handler: 'handleSystem' },
      SYSTEM_CORE_DISCOVERY: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleSystem' }
    },

    protocol_meta: {
      SYSTEM_BLUEPRINT_SYNC: {
        desc: "Gestiona el Vault de Blueprints (Plantillas de automatización).",
        inputs: {
          action: { type: 'string', required: true, desc: 'SCAN, PUBLISH, o INSTALL' },
          context_id: { type: 'string', desc: 'ID del átomo (para PUBLISH) o ID del archivo (para INSTALL)' }
        }
      },
      SYSTEM_PINS_READ: {
        desc: "Obtiene la lista de todos los átomos anclados al workspace activo.",
        inputs: {
          workspace_id: { type: 'string', required: true, desc: 'ID del entorno activo.' }
        }
      },
      SYSTEM_PIN: {
        desc: "Ancla un nuevo átomo al espacio de trabajo activo.",
        inputs: {
          workspace_id: { type: 'string', required: true },
          data: { type: 'object', required: true, desc: '{ atom: ÁtomoUniversal }' }
        }
      },
      SYSTEM_UNPIN: {
        desc: "Desvincula un átomo del espacio de trabajo.",
        inputs: {
          workspace_id: { type: 'string', required: true },
          data: { type: 'object', required: true, desc: '{ atom_id, provider }' }
        }
      },
      SYSTEM_WORKSPACE_REPAIR: {
        desc: "Saneamiento proactivo: purga punteros a archivos inexistentes.",
        inputs: {
          workspace_id: { type: 'string', required: true }
        }
      },
      GETMCEPMANIFEST: {
        desc: "Realiza un sensado profundo de todas las capacidades y herramientas disponibles en Indra.",
        inputs: { mode: { type: 'string', desc: 'RAW_MAP para introspección técnica' } }
      },
      ATOM_READ: {
        desc: "Lee la metadata y contenido de un átomo/archivo específico del sistema.",
        inputs: { context_id: { type: 'string', required: true } }
      },
      ATOM_ALIAS_RENAME: {
        desc: "Renombra de forma canónica el handle.alias de un átomo y propaga a pins de workspaces.",
        inputs: {
          context_id: { type: 'string', required: true, desc: 'ID del átomo a renombrar.' },
          data: { type: 'object', required: true, desc: '{ old_alias?, new_alias, new_label?, dry_run? }' }
        }
      },
      SCHEMA_FIELD_ALIAS_RENAME: {
        desc: "Renombra alias de campo en DATA_SCHEMA y actualiza referencias tipadas en artefactos dependientes.",
        inputs: {
          context_id: { type: 'string', required: true, desc: 'ID del DATA_SCHEMA.' },
          data: { type: 'object', required: true, desc: '{ field_id?, old_alias?, new_alias, dry_run? }' }
        }
      },
      ALIAS_COLLISION_SCAN: {
        desc: "Escanea colisiones de alias (intra-schema, cross-schema o global de átomos) y clasifica severidad.",
        inputs: {
          context_id: { type: 'string', desc: 'ID del DATA_SCHEMA cuando target=FIELD_ALIAS.' },
          data: { type: 'object', required: true, desc: '{ target: FIELD_ALIAS|ATOM_ALIAS, alias, field_id?, atom_id? }' }
        }
      },
      INDUCTION_START: {
        desc: "Alias canónico para iniciar inducción industrial y devolver ticket.",
        inputs: {
          workspace_id: { type: 'string', required: false },
          data: { type: 'object', required: true, desc: '{ source_artifact, muted_fields, publish_immediately }' }
        }
      },
      INDUCTION_INDUCE_FULL_STACK: {
        desc: "Ejecuta la inducción industrial de schema+bridge desde un artefacto externo y devuelve ticket de trazabilidad.",
        inputs: {
          workspace_id: { type: 'string', required: false },
          data: { type: 'object', required: true, desc: '{ source_artifact, muted_fields, publish_immediately }' }
        }
      },
      INDUCTION_STATUS: {
        desc: "Consulta el estado actual de un ticket de inducción.",
        inputs: {
          query: { type: 'object', required: true, desc: '{ ticket_id }' }
        }
      },
      INDUCTION_CANCEL: {
        desc: "Cancela una inducción en seguimiento y marca su ticket como cancelado.",
        inputs: {
          data: { type: 'object', required: true, desc: '{ ticket_id }' }
        }
      },
      INDUCTION_DRIFT_CHECK: {
        desc: "Compara estructura actual del origen versus baseline guardada en DATA_SCHEMA inducido.",
        inputs: {
          context_id: { type: 'string', required: true, desc: 'ID del DATA_SCHEMA inducido' }
        }
      },
      NATIVE_DOCUMENT_RENDER: {
        desc: "Genera un PDF a partir de un Documento Indra (bloques) e inyecta variables.",
        inputs: {
          context_id: { type: 'string', required: true, desc: 'ID del Átomo DOCUMENT (Plantilla)' },
          variables: { type: 'object', desc: 'Mapa de variables para sustituir {{key}}' }
        }
      },
      SYSTEM_SCHEMA_IGNITE: {
        desc: "Manifiesta físicamente un esquema de datos (ADN) en un silo tabular (Físico) de forma agnóstica.",
        inputs: {
          context_id: { type: 'string', required: true, desc: 'ID del DATA_SCHEMA a ignitar.' },
          data: { type: 'object', required: true, desc: '{ target_provider: drive|notion|sql, target_folder_id? }' }
        }
      }
    }
  });
}

/**
 * Punto de entrada principal (Router de Segundo Nivel).
 */
function handleSystem(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[provider_system] Fractal Routing: ${protocol}`);

  // ─── HANDLER DE INFRAESTRUCTURA (provider_system_infrastructure.gs)
  if (protocol === 'ATOM_READ') return _system_handleRead(uqo);
  if (protocol === 'ATOM_CREATE') return _system_handleCreate(uqo);
  if (protocol === 'ATOM_DELETE') return _system_handleDelete(uqo);
  if (protocol === 'ATOM_UPDATE') return _system_handleUpdate(uqo);
  if (protocol === 'ATOM_EXISTS') return _system_handleExists(uqo);
  if (protocol === 'ATOM_ALIAS_RENAME') return _system_handleAliasRename(uqo);
  if (protocol === 'SCHEMA_FIELD_ALIAS_RENAME') return _system_handleSchemaFieldAliasRename(uqo);
  if (protocol === 'ALIAS_COLLISION_SCAN') return _system_handleAliasCollisionScan(uqo);

  // ─── HANDLER DE WORKSPACE (provider_system_workspace.gs)
  if (protocol === 'SYSTEM_PIN') return _system_handlePin(uqo);
  if (protocol === 'SYSTEM_UNPIN') return _system_handleUnpin(uqo);
  if (protocol === 'SYSTEM_PINS_READ') return _system_handlePinsRead(uqo);

  // ─── HANDLER DE LÓGICA (provider_system_logic.gs)
  if (protocol === 'FORMULA_EVAL') return system_evaluateFormula(uqo);
  if (protocol === 'SCHEMA_SUBMIT') return _system_handleSchemaSubmit(uqo);
  if (protocol === 'SCHEMA_FIELD_OPTIONS') return _system_handleSchemaFieldOptions(uqo);
  if (protocol === 'TABULAR_STREAM') return _system_handleTabularStream(uqo);
  if (protocol === 'NATIVE_DOCUMENT_RENDER') return _system_handleNativeDocumentRender(uqo);

  // ─── HANDLER DE DIAGNÓSTICOS (provider_system_diagnostics.gs)
  if (protocol === 'SYSTEM_WORKSPACE_REPAIR') return _system_handleWorkspaceRepair(uqo);
  if (protocol === 'ACCOUNT_RESOLVE') return _system_handleAccountResolve(uqo);
  if (protocol === 'SYSTEM_AUDIT') return _system_handleAudit(uqo);
  if (protocol === 'REVISIONS_LIST') return _system_handleRevisionsList(uqo);
  if (protocol === 'ATOM_ROLLBACK') return _system_handleRollback(uqo);
  
  // ─── HANDLER DE INTELIGENCIA / MCEP (provider_intelligence.js)
  if (protocol === 'GETMCEPMANIFEST') return _ai_handleDiscovery(uqo);
  if (protocol === 'INTELLIGENCE_CHAT') return _ai_handleChat(uqo);

  // ─── HANDLER DE INDUCCIÓN INDUSTRIAL (induction_orchestrator.gs)
  if (protocol === 'INDUCTION_START') return _system_induction_start(uqo);
  if (protocol === 'INDUCTION_INDUCE_FULL_STACK') return _system_induction_start(uqo);
  if (protocol === 'INDUCTION_STATUS') return _system_induction_status(uqo);
  if (protocol === 'INDUCTION_CANCEL') return _system_induction_cancel(uqo);
  if (protocol === 'INDUCTION_DRIFT_CHECK') return _system_induction_driftCheck(uqo);

  // ─── HANDLER DE BLUEPRINTS (blueprint_manager.gs)
  if (protocol === 'SYSTEM_BLUEPRINT_SYNC') return system_blueprint_sync(uqo);
  if (protocol === 'SYSTEM_SCHEMA_IGNITE') return _system_handleSchemaIgnite(uqo);
  if (protocol === 'SYSTEM_CORE_DISCOVERY') return _system_handleCoreDiscovery(uqo);

  const err = createError('PROTOCOL_NOT_FOUND', `System no soporta: ${protocol}`);
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}

/**
 * ACCOUNT_RESOLVE: Identidad del Core (Indra Cloud).
 * Permanece aquí por ser la identidad del Provider mismo.
 */
function _system_handleAccountResolve(uqo) {
  const user = Session.getActiveUser().getEmail();
  return {
    items: [{
      id: 'internal',
      handle: { ns: 'com.indra.system.core', alias: 'indra_cloud', label: `Indra Cloud (${user.split('@')[0]})` },
      class: 'ACCOUNT_IDENTITY',
      protocols: ['ATOM_READ']
    }],
    metadata: { status: 'OK' }
  };
}
