/**
 * =============================================================================
 * SATÉLITE: IndraBridge.jsx
 * Wrapper React para proyectos que prefieren importar el módulo 
 * directamente en lugar de inyectar el script externo.
 * =============================================================================
 */

import { ForgePanel } from './ForgePanel';

const isDevEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  !!localStorage.getItem('INDRA_SOVEREIGN_TOKEN')
);

/**
 * IndraBridge: Wrapper que monta el HUD de Indra en un portal flotante.
 * Solo activo en entorno dev o con SovereignToken.
 * 
 * @example
 * <IndraBridge>
 *   <App />
 * </IndraBridge>
 */
export function IndraBridge({ children }) {
  return (
    <>
      {children}
      {isDevEnv && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 2147483647
        }}>
          <ForgePanel />
        </div>
      )}
    </>
  );
}
