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
    handle: { ns: 'com.indra.system.core', alias: 'system', label: 'Indra System' },
    class: 'FOLDER',
    version: '1.2 (Fractal)',
    protocols: [
      'ATOM_READ', 'ATOM_CREATE', 'ATOM_DELETE', 'ATOM_UPDATE', 'ATOM_EXISTS',
      'SYSTEM_PIN', 'SYSTEM_UNPIN', 'SYSTEM_PINS_READ', 'SYSTEM_WORKSPACE_REPAIR',
      'TABULAR_STREAM', 'FORMULA_EVAL', 'SCHEMA_SUBMIT', 'SCHEMA_FIELD_OPTIONS',
      'ACCOUNT_RESOLVE', 'SYSTEM_AUDIT', 'REVISIONS_LIST', 'ATOM_ROLLBACK',
      'GETMCEPMANIFEST', 'INTELLIGENCE_CHAT'
    ],
    implements: {
      ATOM_READ: 'handleSystem',
      ATOM_CREATE: 'handleSystem',
      ATOM_DELETE: 'handleSystem',
      ATOM_UPDATE: 'handleSystem',
      ATOM_EXISTS: 'handleSystem',
      SYSTEM_PIN: 'handleSystem',
      SYSTEM_UNPIN: 'handleSystem',
      SYSTEM_PINS_READ: 'handleSystem',
      SYSTEM_WORKSPACE_REPAIR: 'handleSystem',
      TABULAR_STREAM: 'handleSystem',
      FORMULA_EVAL: 'SYSTEM_executeLogicBridge',
      SCHEMA_SUBMIT: 'handleSystem',
      SCHEMA_FIELD_OPTIONS: 'handleSystem',
      ACCOUNT_RESOLVE: 'handleSystem',
      SYSTEM_AUDIT: 'handleSystem',
      REVISIONS_LIST: 'handleSystem',
      ATOM_ROLLBACK: 'handleSystem',
      GETMCEPMANIFEST: 'handleSystem',
      INTELLIGENCE_CHAT: 'handleSystem',
    },

    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_EXISTS: { sync: 'BLOCKING', purge: 'NONE' },
      SYSTEM_PIN: { sync: 'BLOCKING', purge: 'ALL' },
      SYSTEM_UNPIN: { sync: 'BLOCKING', purge: 'ALL' },
      SYSTEM_PINS_READ: { sync: 'BLOCKING', purge: 'NONE' },
      SYSTEM_WORKSPACE_REPAIR: { sync: 'BLOCKING', purge: 'ALL' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE' },
      GETMCEPMANIFEST: { sync: 'BLOCKING', exposure: 'public' },
      INTELLIGENCE_CHAT: { sync: 'BLOCKING', exposure: 'public' }
    },

    protocol_meta: {
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

  // ─── HANDLER DE WORKSPACE (provider_system_workspace.gs)
  if (protocol === 'SYSTEM_PIN') return _system_handlePin(uqo);
  if (protocol === 'SYSTEM_UNPIN') return _system_handleUnpin(uqo);
  if (protocol === 'SYSTEM_PINS_READ') return _system_handlePinsRead(uqo);

  // ─── HANDLER DE LÓGICA (provider_system_logic.gs)
  if (protocol === 'FORMULA_EVAL') return system_evaluateFormula(uqo);
  if (protocol === 'SCHEMA_SUBMIT') return _system_handleSchemaSubmit(uqo);
  if (protocol === 'SCHEMA_FIELD_OPTIONS') return _system_handleSchemaFieldOptions(uqo);
  if (protocol === 'TABULAR_STREAM') return _system_handleTabularStream(uqo);

  // ─── HANDLER DE DIAGNÓSTICOS (provider_system_diagnostics.gs)
  if (protocol === 'SYSTEM_WORKSPACE_REPAIR') return _system_handleWorkspaceRepair(uqo);
  if (protocol === 'ACCOUNT_RESOLVE') return _system_handleAccountResolve(uqo);
  if (protocol === 'SYSTEM_AUDIT') return _system_handleAudit(uqo);
  if (protocol === 'REVISIONS_LIST') return _system_handleRevisionsList(uqo);
  if (protocol === 'ATOM_ROLLBACK') return _system_handleRollback(uqo);
  
  // ─── HANDLER DE INTELIGENCIA / MCEP (provider_intelligence.js)
  if (protocol === 'GETMCEPMANIFEST') return _ai_handleDiscovery(uqo);
  if (protocol === 'INTELLIGENCE_CHAT') return _ai_handleChat(uqo);


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
