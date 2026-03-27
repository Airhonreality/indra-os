import { create } from 'zustand';
import { createAuthSlice } from './slices/auth.slice';
import { createIgnitionSlice } from './slices/ignition.slice';
import { createDomainSlice } from './slices/domain.slice';
import { createUiSlice } from './slices/ui.slice';

/**
 * =============================================================================
 * INDRA APP STATE - REFACTORIZACIÓN AXIOMÁTICA (v4.5)
 * =============================================================================
 * El monolito ha sido fragmentado en cortes (slices) siguiendo el Axioma 1 de Suh.
 * Esta fachada (Façade) mantiene la API pública intacta para evitar romper 
 * dependencias en el resto del sistema.
 */
export const useAppState = create((...args) => ({
    ...createAuthSlice(...args),
    ...createIgnitionSlice(...args),
    ...createDomainSlice(...args),
    ...createUiSlice(...args),
}));
