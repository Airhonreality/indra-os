/**
 * =============================================================================
 * INDRA RESONANCE ENGINE (Industrial Drift Detection v1.0)
 * =============================================================================
 * AXIOMA: El motor no conoce proveedores, solo conoce Deltas y Mapeos.
 * Es el cerebro que decide qué debe cambiar en la materia física para
 * que coincida con la intención del átomo.
 * AXIOMA: Soberanía de Lógica + Transformación Dinámica + Análisis Puro.
 * =============================================================================
 */

function RESONANCE_ANALYZE(uqo) { return _resonance_analyze(uqo); }

/**
 * PROTOCOLO: RESONANCE_ANALYZE
 * Realiza un cálculo de diferencias (Drift Check) y aplica transformaciones
 * sin ejecutar ninguna acción física. Lógica Pura.
 */
function _resonance_analyze(uqo) {
  const data = uqo.data || {};
  const bridgeId = uqo.context_id || data.bridge_id;
  const satPayload = data.sat_payload || { items: [] };
  const siloPayload = data.silo_payload || { items: [] };

  logInfo(`[resonance:brain] 🧠 Iniciando Análisis de Resonancia para Bridge: ${bridgeId}`);

  // 1. Obtener contrato del Bridge (Soporta Inyección para laboratorios)
  let bridge = data.bridge_atom;
  if (!bridge) {
    const bridgeRead = route({ provider: 'system', protocol: 'ATOM_READ', context_id: bridgeId });
    bridge = bridgeRead.items?.[0];
  }
  
  if (!bridge) throw createError('NOT_FOUND', `Bridge ${bridgeId} no encontrado para análisis.`);

  // 2. Calcular Deriva e Inteligencia (Cero Efectos Secundarios)
  const report = _resonance_calculateDrift(bridge, satPayload, siloPayload);

  return {
    items: [],
    metadata: {
      status: 'OK',
      resonance: report,
      analysis_timestamp: new Date().toISOString()
    }
  };
}

/**
 * Calcula el 'Drift' (Desviación) entre el Satélite y el Silo.
 * @param {Object} bridge Átomo de clase BRIDGE.
 * @param {Object} satPayload Datos enviados por el Satélite.
 * @param {Object} siloPayload Datos actuales leídos del Silo físico.
 * @return {Object} Reporte de resonancia con lista de acciones (Upsert/Delete).
 */
function _resonance_calculateDrift(bridge, satPayload, siloPayload) {
  logInfo(`[resonance:engine] Iniciando Drift Check para Bridge: ${bridge.id}`);
  
  const policy = bridge.payload.policy || { conflict_strategy: 'SATELLITE_WINS' };
  const mapping = bridge.payload.mappings[bridge.payload.targets[0]]; 
  
  const results = {
    actions: [],
    stats: { created: 0, updated: 0, deleted: 0 },
    trace_id: 'R_' + Math.random().toString(36).substring(2, 11),
    status: 'ALIGNED'
  };

  // --- AXIOMA DE RESILIENCIA: Detector de Silo Fósil ---
  if (siloPayload === null || siloPayload === undefined) {
    logWarn(`[resonance:engine] El Silo destino no responde. Detectado estado FOSSIL.`);
    results.status = 'SILO_MISSING';
    return results; // Colapso controlado para que el orquestador decida re-ignición
  }

  if (!satPayload || !Array.isArray(satPayload.items)) {
    throw createError('CONTRACT_VIOLATION', 'El payload del satélite debe contener un array de ítems.');
  }

  const satItems = satPayload.items;
  const siloItems = siloPayload.items || [];
  
  const siloMap = new Map();
  siloItems.forEach(item => siloMap.set(String(item.id), item));

  satItems.forEach(satItem => {
    const siloItem = siloMap.get(String(satItem.id));
    const physicalData = _resonance_mapToPhysical(satItem, mapping, bridge.id);
    
    if (!siloItem) {
      // 🟢 CASO: NUEVA MATERIA
      results.actions.push({
        type: 'CREATE',
        id: satItem.id,
        data: physicalData
      });
      results.stats.created++;
    } else {
      // 🟡 CASO: RESONANCIA (Update si hay cambio)
      if (_resonance_hasChanges(physicalData, siloItem)) {
        // Aquí aplicamos la política de Soberanía
        if (policy.conflict_strategy === 'SATELLITE_WINS' || policy.conflict_strategy === 'MERGE') {
           results.actions.push({
            type: 'UPDATE',
            id: satItem.id,
            data: physicalData
          });
          results.stats.updated++;
        }
      }
    }
  });

  if (results.actions.length > 0) results.status = 'DRIFT_DETECTED';

  logInfo(`[resonance:engine] Drift Check completado. Estado: ${results.status}. Acciones: ${results.actions.length}`);
  return results;
}

/**
 * Traduce un AtomoIndra a un objeto físico basado en el mapeo del Bridge.
 * Soporta Mapeos Agnósticos y Transformaciones Dinámicas.
 */
function _resonance_mapToPhysical(atom, mapping, bridge_id) {
  const physical = {};
  const dataContainer = atom.payload || atom; // Flexibilidad para proveedores que aplanan (Sheets/Notion)
  
  Object.entries(mapping).forEach(([fieldId, mapConfig]) => {
    let value = null;
    let config = mapConfig;

    // AXIOMA DE COMPATIBILIDAD: Soportar tanto mapeo simple (string) como complejo (object)
    if (typeof mapConfig === 'string') {
      const fieldAlias = mapConfig.replace('source.', '');
      value = dataContainer[fieldAlias] !== undefined ? dataContainer[fieldAlias] : dataContainer[fieldId];
      config = { sat: fieldAlias };
    } else {
      value = dataContainer[config.sat] !== undefined ? dataContainer[config.sat] : dataContainer[fieldId];
    }

    // 🎭 APLICAR TRANSFORMACIONES (Si existen)
    if (value !== undefined) {
      value = _resonance_applyTransformations(value, config, bridge_id);
      physical[fieldId] = value;
    }
  });
  
  return physical;
}

/**
 * Motor de Transformación Atómica.
 * @private
 */
function _resonance_applyTransformations(value, config, bridge_id) {
  let transformedValue = value;
  logInfo(`[resonance:metamorphosis] Valor original: "${value}" (Mapping sat: "${config.sat}")`);

  // 1. Transformaciones Built-in (Eficiencia Industrial)
  if (config.transform) {
    const transformType = config.transform.toUpperCase();
    switch (transformType) {
      case 'UPPERCASE': transformedValue = String(transformedValue).toUpperCase(); break;
      case 'LOWERCASE': transformedValue = String(transformedValue).toLowerCase(); break;
      case 'TRIM':      transformedValue = String(transformedValue).trim(); break;
      case 'DATE_NOW':  transformedValue = new Date().toISOString(); break;
    }
    logInfo(`[resonance:metamorphosis] Aplicando transform "${transformType}" -> Nuevo valor: "${transformedValue}"`);
  }

  // 2. Lógica delegada (Célula COMPUTE)
  if (config.logic_id) {
    try {
      logInfo(`[resonance:logic] Delegando a COMPUTE: ${config.logic_id}`);
      const computeRes = route({
        provider: 'compute',
        protocol: 'FORMULA_EVAL',
        data: { 
          formula_id: config.logic_id, 
          input: transformedValue, 
          context: { bridge_id } 
        }
      });
      if (computeRes.metadata.status === 'OK') {
        transformedValue = computeRes.items[0].result;
        logInfo(`[resonance:metamorphosis] Éxito COMPUTE -> Resultado: "${transformedValue}"`);
      }
    } catch (e) {
      logWarn(`[resonance:logic] Fallo en transformación externa: ${e.message}`);
    }
  }

  return transformedValue;
}

/**
 * Compara dos estados para detectar si es necesaria la resonancia.
 */
function _resonance_hasChanges(newData, oldData) {
  return JSON.stringify(newData) !== JSON.stringify(oldData);
}
