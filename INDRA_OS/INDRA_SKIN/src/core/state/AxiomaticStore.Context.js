/**
 * AxiomaticStore.Context.js
 * DHARMA: Autoridad Singleton de Contexto.
 * Misión: Asegurar que TODAS las capas de la realidad compartan el mismo punto de verdad,
 * evitando duplicaciones de contexto por importación divergente.
 */
import { createContext } from 'react';

const AxiomaticContext = createContext(null);
AxiomaticContext.displayName = 'AxiomaticContext';

export default AxiomaticContext;



