/**
 * KeyGenerator.gs - Generador Centralizado de Identificadores Únicos
 * 
 * Este módulo encapsula la llamada al servicio nativo Utilities.getUuid,
 * asegurando que el Core permanezca agnóstico a la implementación específica
 * del entorno para la generación de UUIDs.
 * 
 * De acuerdo con el Axioma de Aislamiento (DI-1), este es el único artefacto
 * en el proyecto que puede contener la referencia a Utilities.getUuid.
 */

/**
 * Fábrica para crear una instancia del generador de claves
 * 
 * @return {Object} Instancia congelada del generador de claves
 */
function createKeyGenerator() {
  /**
   * Genera un identificador único universal (UUID)
   * 
   * @return {string} UUID generado por el entorno de GAS
   */
  function generateUUID() {
    return Utilities.getUuid();
  }

  const schemas = {
    generateUUID: {
      description: "Generates a cryptographically strong Version 4 Universal Unique Identifier.",
      semantic_intent: "PROBE",
      io_interface: { 
        outputs: {
          uuid: { type: "string", role: "PROBE", description: "Generated UUID string." }
        } 
      }
    }
  };

  // Retornamos un objeto congelado con el método público
  return Object.freeze({
    id: "service_key_generator",
    label: "Cryptographic Master",
    description: "System-wide utility for industrial generation of unique technical identifiers.",
    semantic_intent: "SENSOR",
    archetype: "SERVICE",
    domain: "SYSTEM_INFRA",
    schemas: schemas,
    generateUUID
  });
}





