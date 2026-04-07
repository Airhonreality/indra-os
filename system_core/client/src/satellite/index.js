/**
 * =============================================================================
 * SATÉLITE: index.js — Barrel de Exportaciones
 * Punto de entrada público del módulo para importaciones directas en React.
 * 
 * MODO 1 (React): import { IndraBridge, ForgePanel } from './satellite';
 * MODO 2 (Script): <script src="hud.js"> (via bundler / cdn)
 * =============================================================================
 */

export { ForgePanel } from './components/ForgePanel';
export { SchemaCard } from './components/SchemaCard';
export { useCoreAuth } from './hooks/useCoreAuth';
export { useForgeSync, SCHEMA_STATUS } from './hooks/useForgeSync';
export { executeUqo, discoverCore, syncSchemaToCor, updateSchemaInCore, igniteSchema, fetchCoreSchemas } from './services/core_bridge';

/**
 * IndraBridge — Component wrapper conveniente para el Architect.
 * Envuelve tu app y hace visible el ForgePanel (solo en dev).
 * 
 * Uso:
 * <IndraBridge>
 *   <TuAppSoberana />
 * </IndraBridge>
 */
export { IndraBridge } from './components/IndraBridge';
