/**
 * 🛰️ INDRA NODAL IDENTITY (L0)
 * Dharma: Identificación inmutable de la Infraestructura (Nodo/Satélite).
 * 
 * Este archivo representa al "Hardware/App" frente al Core. 
 * NO contiene datos de sujetos humanos, roles de usuario ni sesiones temporales.
 */
export const INDRA_NODAL_CONFIG = {
  "core_url": "",      // URL del Gateway del Core
  "core_token": "",    // Token de resonancia del Satélite (App Token)
  "satellite_id": "",  // ID único del manifiesto
  "workspace_id": "",  // Célula de destino por defecto
  "version": "1.0.0",
  "timestamp": new Date().toISOString()
};