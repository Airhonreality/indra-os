// ======================================================================
// ARTEFACTO: 0_Laws/System_Constitution.spec.js
// PROPÓSITO: Suite de tests unitarios COMPLETA y NATIVA para System_Constitution.gs.
// ESTRATEGIA: Verificación directa de la estructura STARK (UPPER_CASE).
// ======================================================================

function testSystemConstitution_Estructura_debeExistirYSerInmutable() {
  assert.isNotNull(SYSTEM_CONSTITUTION, "SYSTEM_CONSTITUTION no debe ser nulo.");
  assert.isType(SYSTEM_CONSTITUTION, 'object', "SYSTEM_CONSTITUTION debe ser un objeto.");
  assert.isTrue(Object.isFrozen(SYSTEM_CONSTITUTION), "SYSTEM_CONSTITUTION debe estar congelado.");

  const originalVersion = SYSTEM_CONSTITUTION.VERSION;
  try { SYSTEM_CONSTITUTION.VERSION = "9.9.9"; } catch (e) { }
  assert.areEqual(originalVersion, SYSTEM_CONSTITUTION.VERSION, "No se debe permitir modificación.");
  return true;
}

function testSystemConstitution_Estructura_debeContenerTodasLasClavesSTARK() {
  assert.hasProperty(SYSTEM_CONSTITUTION, 'VERSION');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'ANCHOR_PROPERTY');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'DRIVE_SCHEMA');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'SHEETS_SCHEMA');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'COMPONENT_REGISTRY');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'CONNECTIONS');
  assert.hasProperty(SYSTEM_CONSTITUTION, 'LIMITS');
  return true;
}

function testSystemConstitution_DriveSchema_debeTenerEstructuraSTARK() {
  const schema = SYSTEM_CONSTITUTION.DRIVE_SCHEMA;
  assert.isNotNull(schema.ROOT, "Debe tener ROOT.");
  assert.isType(schema.ROOT.NAME, 'string');
  assert.isType(schema.ROOT.PATH, 'string');
  assert.isNotNull(schema.FLOWS, "Debe tener FLOWS.");
  return true;
}

function testSystemConstitution_SheetsSchema_debeTenerHeadersValidos() {
  const schema = SYSTEM_CONSTITUTION.SHEETS_SCHEMA;
  assert.isNotNull(schema.JOB_QUEUE);
  assert.isTrue(Array.isArray(schema.JOB_QUEUE.HEADER));
  assert.isTrue(schema.JOB_QUEUE.HEADER.includes('jobId'));

  assert.isNotNull(schema.AUDIT_LOG);
  assert.isTrue(Array.isArray(schema.AUDIT_LOG.HEADER));
  assert.isTrue(schema.AUDIT_LOG.HEADER.includes('timestamp'));
  return true;
}

function testSystemConstitution_ComponentRegistry_debeTenerComponentesCriticos() {
  const registry = SYSTEM_CONSTITUTION.COMPONENT_REGISTRY;
  // AXIOMA v8.0: Componentes Soberanos (Ya no están centralizados en el manifiesto)
  // Verificamos solo los componentes abstractos/UI
  assert.isNotNull(registry.CORE_PORTAL, "CORE_PORTAL debe estar registrado.");
  assert.areEqual(registry.CORE_PORTAL.ARCHETYPE, 'BRIDGE');
  return true;
}
