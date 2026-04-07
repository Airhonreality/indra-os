/**
 * =============================================================================
 * SATÉLITE: useForgeSync.js
 * Motor de Detección de Deriva (Drift Detection).
 * Compara window.INDRA_SCHEMAS con los átomos del Core.
 * DHARMA: Solo observa y diagnostica. No actúa sola.
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCoreSchemas, syncSchemaToCor, updateSchemaInCore, igniteSchema } from '../services/core_bridge';

/**
 * Estados de un esquema. Cada uno implica una acción posible.
 */
export const SCHEMA_STATUS = {
  LOCAL_ONLY: 'LOCAL_ONLY',   // En código, no en Core → [SINCRONIZAR ADN]
  IN_SYNC:    'IN_SYNC',      // Idénticos → ninguna acción
  DRIFTED:    'DRIFTED',      // Alias igual, campos distintos → [ACTUALIZAR ADN]
  ORPHAN:     'ORPHAN',       // En Core, sin silo físico → [IGNITAR MATERIA]
  LIVE:       'LIVE',         // En Core, con silo vinculado → ✅
  REMOTE_ONLY:'REMOTE_ONLY',  // En Core pero no en código local → warning
};

/**
 * Normaliza un array de campos para comparación (ordena por id, baja a minúsculas).
 */
function normalizeFields(fields = []) {
  return [...fields]
    .sort((a, b) => (a.id || '').localeCompare(b.id || ''))
    .map(f => ({ id: f.id, type: (f.type || 'TEXT').toUpperCase() }));
}

function fieldsAreEqual(localFields, remoteFields) {
  const local = JSON.stringify(normalizeFields(localFields));
  const remote = JSON.stringify(normalizeFields(remoteFields));
  return local === remote;
}

/**
 * Hook principal de sincronización.
 * @param {Object|null} session - Sesión del satélite { core_url, session_secret }
 */
export function useForgeSync(session) {
  const [schemas, setSchemas] = useState([]); // Array de SchemaDiff objects
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Ejecuta el diff completo: local vs Core.
   */
  const refresh = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);

    try {
      const localSchemas = window.INDRA_SCHEMAS || {};
      const coreAtoms = await fetchCoreSchemas(session.core_url, session.session_secret);

      // Indexar átomos del Core por alias
      const coreByAlias = {};
      coreAtoms.forEach(atom => {
        const alias = atom.handle?.alias;
        if (alias) coreByAlias[alias] = atom;
      });

      const result = [];

      // 1. Escanear locales
      Object.entries(localSchemas).forEach(([alias, localSchema]) => {
        const coreAtom = coreByAlias[alias];
        if (!coreAtom) {
          result.push({ alias, localSchema, coreAtom: null, status: SCHEMA_STATUS.LOCAL_ONLY });
          return;
        }

        const hasSilo = !!coreAtom.payload?.target_silo_id;
        const inSync = fieldsAreEqual(localSchema.fields, coreAtom.payload?.fields);

        if (hasSilo) {
          result.push({ alias, localSchema, coreAtom, status: SCHEMA_STATUS.LIVE });
        } else if (!inSync) {
          result.push({ alias, localSchema, coreAtom, status: SCHEMA_STATUS.DRIFTED });
        } else {
          result.push({ alias, localSchema, coreAtom, status: SCHEMA_STATUS.ORPHAN });
        }
      });

      // 2. Detectar remotos huérfanos (en Core pero no en código local)
      Object.keys(coreByAlias).forEach(alias => {
        if (!localSchemas[alias]) {
          result.push({
            alias,
            localSchema: null,
            coreAtom: coreByAlias[alias],
            status: SCHEMA_STATUS.REMOTE_ONLY
          });
        }
      });

      setSchemas(result);
    } catch (err) {
      setError(`Error al sincronizar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Auto-refresh al montar y cuando cambia la sesión
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Acción: Crear el DATA_SCHEMA en el Core (LOCAL_ONLY → ORPHAN)
   */
  const syncSchema = useCallback(async (alias) => {
    const entry = schemas.find(s => s.alias === alias);
    if (!entry) return;
    setIsLoading(true);
    try {
      await syncSchemaToCor(entry.localSchema, alias, session.core_url, session.session_secret);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [schemas, session, refresh]);

  /**
   * Acción: Actualizar el DATA_SCHEMA en el Core con los campos locales (DRIFTED → ORPHAN)
   */
  const updateSchema = useCallback(async (alias) => {
    const entry = schemas.find(s => s.alias === alias);
    if (!entry?.coreAtom) return;
    setIsLoading(true);
    try {
      await updateSchemaInCore(entry.coreAtom.id, entry.localSchema, session.core_url, session.session_secret);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [schemas, session, refresh]);

  /**
   * Acción: Ignitar la materia física del esquema (ORPHAN → LIVE)
   */
  const ignite = useCallback(async (alias, targetProvider = 'drive') => {
    const entry = schemas.find(s => s.alias === alias);
    if (!entry?.coreAtom) return;
    setIsLoading(true);
    try {
      await igniteSchema(entry.coreAtom.id, targetProvider, session.core_url, session.session_secret);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [schemas, session, refresh]);

  return { schemas, isLoading, error, refresh, syncSchema, updateSchema, ignite };
}
