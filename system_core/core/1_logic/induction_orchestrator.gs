/**
 * =============================================================================
 * ARTEFACTO: 1_logic/induction_orchestrator.gs
 * RESPONSABILIDAD: Orquestación Universal de Cristalización (Motor de Ignición v2.0)
 * AXIOMA: Big Bang Único + Soberanía de la Materia + Relacionalidad Micelar.
 * =============================================================================
 */

const INDUCTION_TICKET_TTL_SECONDS_ = 60 * 60 * 12; // 12 horas de vida para el ticket de génesis

// --- UTILIDADES DE TICKETS (MEMORIA DE GÉNESIS) ---

function _system_induction_cache_() {
  return CacheService.getScriptCache();
}

function _system_induction_ticketKey_(ticketId) {
  return `indra_induction_ticket_${ticketId}`;
}

function _system_induction_generateTicketId_() {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `ind_${Date.now()}_${nonce}`;
}

function _system_induction_readTicket_(ticketId) {
  if (!ticketId) return null;
  const raw = _system_induction_cache_().get(_system_induction_ticketKey_(ticketId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function _system_induction_writeTicket_(ticket) {
  if (!ticket || !ticket.ticket_id) return;
  ticket.updated_at = new Date().toISOString();
  _system_induction_cache_().put(
    _system_induction_ticketKey_(ticket.ticket_id),
    JSON.stringify(ticket),
    INDUCTION_TICKET_TTL_SECONDS_
  );
}

// --- MOTOR DE CRISTALIZACIÓN UNIVERSAL ---

/**
 * ALIAS: Entrada de compatibilidad para el Router Global.
 */
function _system_induction_start(uqo) {
  return induction_orchestrateCrystallization_(uqo);
}

/**
 * MOTOR DE CRISTALIZACIÓN UNIVERSAL (The Big Bang)
 * Toma un ADN (Blueprint) y lo expande en un mini-universo autocontenido.
 */
function induction_orchestrateCrystallization_(uqo) {
  const data = uqo.data || {};
  const dna = data.source_artifact || data.blueprint; // ADN / Blueprint
  const workspaceId = uqo.workspace_id || data.workspace_id;
  const targetProvider = data.target_provider || 'drive';
  const publishImmediately = !!data.publish_immediately;

  const ticket = {
    ticket_id: _system_induction_generateTicketId_(),
    status: 'IN_PROGRESS',
    step: 'GÉNESIS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workspace_id: workspaceId,
    dna_id: dna?.id || 'unknown',
    errors: []
  };
  _system_induction_writeTicket_(ticket);

  try {
    logInfo(`[induction:engine] ✨ Iniciando Cristalización Universal. DNA: ${dna?.id || 'protoplasm'}`);

    // --- FASE 1: INDUCCIÓN DE ESQUEMA (El Código Genético) ---
    ticket.step = 'INDUCING_SCHEMA';
    _system_induction_writeTicket_(ticket);
    
    let schemaFields = [];
    let schemaAtom = null;

    if (data.mode === 'IN_PLACE_IGNITION' && uqo.context_id) {
      // MODO: IN-PLACE. Usamos el esquema existente.
      logInfo(`[induction:engine] 💉 Modo IN_PLACE detectado. Usando esquema: ${uqo.context_id}`);
      const schemaRead = route({ provider: 'system', protocol: 'ATOM_READ', context_id: uqo.context_id });
      schemaAtom = schemaRead.items?.[0];
      if (!schemaAtom) throw createError('NOT_FOUND', 'Esquema original no encontrado para ignición in-situ.');
      schemaFields = schemaAtom.payload?.fields || [];
    } else if (dna?.class === 'DATA_SCHEMA') {
      schemaFields = dna.payload?.fields || [];
    } else {
      const stream = _system_induction_collectStream_(uqo, dna);
      _system_induction_validateInput_(dna, stream);
      schemaFields = _system_induction_buildSchemaFields_(dna, stream, data.muted_fields || []);
    }

    if (schemaFields.length === 0) throw createError('CONTRACT_VIOLATION', 'ADN estéril: No se encontraron campos para materializar.');

    if (!schemaAtom) {
      // Solo creamos si no estamos en modo IN_PLACE
      const schemaCreate = route({
        provider: 'system',
        protocol: 'ATOM_CREATE',
        data: {
          class: 'DATA_SCHEMA',
          handle: { label: `Schema for ${dna?.handle?.label || dna?.id || 'Materialization'}` },
          payload: { fields: schemaFields }
        }
      });
      schemaAtom = schemaCreate.items?.[0];
    }
    
    if (!schemaAtom) throw createError('SYSTEM_FAILURE', 'Error al cristalizar el ADN (Schema).');

    // --- FASE 2: MATERIALIZACIÓN FÍSICA (La Materia) ---
    ticket.step = `MATERIALIZING_IN_${targetProvider.toUpperCase()}`;
    _system_induction_writeTicket_(ticket);
    
    logInfo(`[induction:engine] 🧱 Solicitando materia física a ${targetProvider}...`);
    const physicalCreate = route({
      provider: targetProvider,
      protocol: 'ATOM_CREATE',
      data: {
        class: 'TABULAR',
        handle: { label: dna?.handle?.label || dna?.id || 'Indra Silo' },
        fields: schemaFields,
        intent: 'MATERIALIZE_SOVEREIGN'
      }
    });
    
    const physicalSilo = physicalCreate.items?.[0];
    if (!physicalSilo) throw createError('MATERIALIZATION_FAILED', `El provider ${targetProvider} denegó la materialización.`);

    // --- FASE 3: GENERACIÓN DE PUENTE (El Entrelazamiento Relacional) ---
    ticket.step = 'GENERATING_BRIDGE';
    _system_induction_writeTicket_(ticket);

    const uiPurpose = dna.payload?.ui_purpose || 'GENERIC_BOARD';
    const cognitiveClass = dna.payload?.cognitive_class || 'DATA_METER';
    logInfo(`[induction:engine] 🧬 Puente heredando semántica: ${cognitiveClass} (UI: ${uiPurpose})`);

    const bridgeCreate = route({
      provider: 'system',
      protocol: 'ATOM_CREATE',
      data: {
        class: 'BRIDGE',
        handle: { label: `Bridge for ${dna?.id || 'Induction'}` },
        payload: {
          dna_id: dna?.id,
          ui_purpose: uiPurpose,
          cognitive_class: cognitiveClass,
          targets: [physicalSilo.id],
          target_provider: targetProvider,
          mappings: {
            [physicalSilo.id]: schemaFields.reduce((acc, f) => {
              acc[f.id] = `source.${f.handle?.alias || f.id}`;
              return acc;
            }, {})
          }
        }
      }
    });

    const bridgeAtom = bridgeCreate.items?.[0];
    if (!bridgeAtom) throw createError('SYSTEM_FAILURE', 'Error al crear el Puente Relacional.');

    // --- FASE 4: ACOPLAMIENTO AL WORKSPACE (Anclaje Cuántico) ---
    if (workspaceId) {
      ticket.step = 'QUANTUM_PINNING';
      _system_induction_writeTicket_(ticket);
      logInfo(`[induction:engine] 🔗 Anclando mini-universo a Workspace: ${workspaceId}`);
      
      [schemaAtom, bridgeAtom, physicalSilo].forEach(atom => {
        if (atom && atom.id) {
          route({
            provider: 'system',
            protocol: 'SYSTEM_PIN',
            workspace_id: workspaceId,
            data: { atom }
          });
        }
      });
    }

    // --- FINALIZACIÓN Y ACTUALIZACIÓN DE METADATOS ---
    schemaAtom.payload = { 
      ...schemaAtom.payload, 
      bridge_id: bridgeAtom.id, 
      silo_id: physicalSilo.id,
      publish_immediately: publishImmediately 
    };
    route({ 
      provider: 'system', 
      protocol: 'ATOM_UPDATE', 
      context_id: schemaAtom.id, 
      data: { payload: schemaAtom.payload } 
    });

    ticket.status = 'COMPLETED';
    ticket.step = 'CRISTALIZADO';
    _system_induction_writeTicket_(ticket);

    logInfo(`[induction:engine] ✅ Cristalización completada con éxito. Universo listo.`);

    return {
      items: [schemaAtom],
      metadata: {
        status: 'OK',
        ticket_id: ticket.ticket_id,
        universe: {
          schema_id: schemaAtom.id,
          bridge_id: bridgeAtom.id,
          silo_id: physicalSilo.id
        }
      }
    };

  } catch (err) {
    logError(`[induction:engine] ❌ Colapso en cristalización.`, err);
    ticket.status = 'ERROR';
    ticket.errors.push(err.message);
    _system_induction_writeTicket_(ticket);
    return { 
      items: [], 
      metadata: { 
        status: 'ERROR', 
        error: err.message, 
        code: err.code || 'CRYSTALLIZATION_FAILED',
        ticket_id: ticket.ticket_id 
      } 
    };
  }
}

// --- FUNCIONES DE APOYO DEL MOTOR ---

function _system_induction_validateInput_(sourceArtifact, streamResult) {
  if (!sourceArtifact || typeof sourceArtifact !== 'object') throw createError('INPUT_CONTRACT_VIOLATION', 'INDUCTION requiere data.source_artifact.');
  if (!streamResult || streamResult.metadata?.status !== 'OK') throw createError('CONTRACT_VIOLATION', 'TABULAR_STREAM inválido para inducción.');
}

function _system_induction_collectStream_(uqo, sourceArtifact) {
  const providedStream = uqo.data?.tabular_stream;
  if (providedStream && providedStream.metadata?.schema?.fields) return providedStream;

  return route({
    provider: sourceArtifact.provider,
    protocol: 'TABULAR_STREAM',
    context_id: sourceArtifact.id,
    query: { limit: 5 }
  });
}

function _system_induction_buildSchemaFields_(sourceArtifact, streamResult, mutedFields) {
  const streamFields = streamResult.metadata?.schema?.fields || [];
  const mutedSet = {};
  (mutedFields || []).forEach(id => { mutedSet[id] = true; });

  return streamFields
    .filter(field => !mutedSet[field.id])
    .map(field => {
      const fieldAlias = _system_slugify_(field.handle?.label || field.label || field.id);
      return {
        id: fieldAlias,
        handle: {
          ns: 'com.indra.system.schema.field',
          alias: fieldAlias,
          label: field.handle?.label || field.label || field.id
        },
        type: _system_induction_mapType_(field.type),
        source_id: field.id,
        source_provider: sourceArtifact.provider,
        source_context_id: sourceArtifact.id
      };
    });
}

function _system_induction_mapType_(canonicalType) {
  const t = String(canonicalType || '').toUpperCase();
  if (['NUMBER', 'INTEGER', 'FLOAT', 'DECIMAL'].includes(t)) return 'NUMBER';
  if (['BOOLEAN', 'BOOL', 'CHECKBOX'].includes(t)) return 'BOOLEAN';
  if (['DATE', 'DATETIME', 'TIME'].includes(t)) return 'DATE';
  return 'STRING';
}

// --- PROTOCOLOS ADICIONALES (CONTROL DE GÉNESIS) ---

function _system_induction_status(uqo) {
  const ticketId = uqo.query?.ticket_id || uqo.data?.ticket_id || uqo.context_id;
  const ticket = _system_induction_readTicket_(ticketId);
  if (!ticket) return { items: [], metadata: { status: 'ERROR', error: 'Ticket no encontrado.' } };

  return {
    items: [],
    metadata: { status: 'OK', ticket: ticket, induction_status: ticket.status }
  };
}

function _system_induction_cancel(uqo) {
  const ticketId = uqo.data?.ticket_id || uqo.context_id;
  const ticket = _system_induction_readTicket_(ticketId);
  if (!ticket) return { items: [], metadata: { status: 'ERROR', error: 'Ticket no encontrado.' } };

  ticket.status = 'CANCELLED';
  _system_induction_writeTicket_(ticket);
  return { items: [], metadata: { status: 'OK', ticket: ticket } };
}

/**
 * _system_induction_drift_check: Sensor de Entropía Estructural.
 * Compara el Silo Físico contra el DNA (Schema) para detectar divergencias.
 */
function _system_induction_drift_check(uqo) {
  const bridgeId = uqo.context_id || uqo.data?.bridge_id;
  if (!bridgeId) throw createError('INVALID_INPUT', 'INDUCTION_DRIFT_CHECK requiere bridge_id.');

  const bridgeAtom = route({ provider: 'system', protocol: 'ATOM_READ', context_id: bridgeId }).items?.[0];
  if (!bridgeAtom || bridgeAtom.class !== 'BRIDGE') throw createError('NOT_FOUND', 'Puente no encontrado para chequeo de drift.');

  const dnaId = bridgeAtom.payload?.dna_id;
  const targetSiloId = bridgeAtom.payload?.targets?.[0];
  
  // 1. Leer el ADN (Esquema Ideal)
  const schemaAtom = route({ provider: 'system', protocol: 'ATOM_READ', context_id: dnaId }).items?.[0];
  
  // 2. Leer la Materia (Silo Físico)
  const siloStream = route({ 
    provider: bridgeAtom.payload?.target_provider || 'drive', 
    protocol: 'TABULAR_STREAM', 
    context_id: targetSiloId,
    query: { limit: 1 } 
  });

  const idealFields = schemaAtom?.payload?.fields || [];
  const physicalFields = siloStream.metadata?.schema?.fields || [];

  // 3. Comparación de Resonancia
  const missingInPhysical = idealFields.filter(f => !physicalFields.find(pf => pf.id === f.id));
  const driftDetected = missingInPhysical.length > 0;

  return {
    items: [],
    metadata: {
      status: 'OK',
      drift_detected: driftDetected,
      entropy_report: {
        missing_fields: missingInPhysical.map(f => f.id),
        ideal_count: idealFields.length,
        physical_count: physicalFields.length
      }
    }
  };
}
