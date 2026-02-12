/**
 * DiscoverySonda.gs
 * DHARMA: Sensor de Inventario (L8)
 */
function createDiscoverySonda({ driveAdapter, configurator, monitoringService }) {

  const schemas = {
    scanHorizon: {
      description: "Scans the specified folder for artifacts without deep reading, identifying raw vs indexed matter.",
      semantic_intent: "PROBE",
      exposure: "public",
      io: { inputs: { folderId: { type: "string", optional: true } }, outputs: { artifacts: { type: "array" } } }
    }
  };

  function scanHorizon(args) {
    const { folderId } = args || {};
    const targetFolderId = folderId || configurator.retrieveParameter({ key: 'ORBITAL_FOLDER_FLOWS_ID' });
    if (!targetFolderId) return { artifacts: [] };

    try {
      const result = driveAdapter.listContents({ folderId: targetFolderId });
      const items = (result.items || []).filter(item => item.type === 'FILE');

      const artifacts = items.map(item => {
        const isJson = item.name.endsWith('.json') || item.mimeType === 'application/json';
        const isRaw = !item.raw || !item.raw.description;

        return {
          id: item.id,
          name: item.name,
          type: item.type,
          last_modified: item.lastUpdated,
          discovery: {
             status: isRaw ? 'ARTIFACT_RAW' : 'ARTIFACT_INDEXED',
             is_json: isJson
          },
          identity: _parseDescription(item.raw?.description, item.name),
          indx_schema: _parseDescription(item.raw?.description, item.name).schema || 'UNDEFINED'
        };
      });

      return { artifacts };

    } catch (e) {
      if (monitoringService) monitoringService.logError('DiscoverySonda', `❌ Fallo en escaneo: ${e.message}`);
      return { artifacts: [], error: e.message };
    }
  }

  function _parseDescription(desc, fallbackName) {
    if (!desc) return { label: fallbackName.replace('.json', ''), description: 'Materia oscura detectada.' };
    try {
      const meta = JSON.parse(desc);
      return {
        label: meta.label || fallbackName.replace('.json', ''),
        description: meta.desc || 'Artefacto indexado vía Surface Reading.',
        schema: meta.schema || 'UNDEFINED'
      };
    } catch (e) {
      return { label: fallbackName, description: 'Error en firma de metadatos.' };
    }
  }

  return Object.freeze({
    id: 'sonda',
    label: 'Discovery Sonda',
    archetype: 'SENSOR',
    domain: 'SYSTEM_INFRA',
    semantic_intent: 'PROBE',
    schemas,
    scanHorizon
  });
}
