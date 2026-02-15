/**
 * SchemaLexicon.gs
 * DHARMA: Traductor Decoplado de Versiones (L8)
 */
function createSchemaLexicon({ monitoringService }) {

  const adapters = {
    'v0.9': _adaptV09,
  };

  function translate(artifact, currentVersion) {
    if (!currentVersion || currentVersion === '1.0.0' || currentVersion === 'v1.0') return artifact;

    const adapter = adapters[currentVersion];
    
    if (adapter) {
      if (monitoringService) monitoringService.logInfo('SchemaLexicon', `🔄 Traduciendo de ${currentVersion} a v1.0`);
      return adapter(artifact);
    }

    if (monitoringService) monitoringService.logWarn('SchemaLexicon', `🛑 No existe adaptador para la versión: ${currentVersion}`);
    return artifact;
  }

  function _adaptV09(old) {
    const translated = { ...old };
    if (old.label && !old.identity) {
      translated.identity = {
        label: old.label,
        description: old.description || "Legacy artifact translated from v0.9"
      };
      delete translated.label;
    }
    translated.indx_schema_version = 'v1.0';
    return translated;
  }

  return Object.freeze({
    id: 'schema_lexicon',
    translate
  });
}





