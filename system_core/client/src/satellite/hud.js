/**
 * =============================================================================
 * SATÉLITE: hud.js
 * Entry Point Inyectable. Se adjunta al body del proyecto anfitrión.
 * Usa Shadow DOM para aislamiento total de estilos.
 * 
 * USO: <script src="https://tu-indra.io/satellite/v1/hud.js"></script>
 * =============================================================================
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ForgePanel } from './components/ForgePanel';

// ─── GUARD DE ENTORNO ──────────────────────────────────────────────────────────
// El HUD solo se activa en:
// 1. localhost (modo dev)
// 2. Si el Arquitecto tiene un token soberano en localStorage
const isDevEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const hasSovereignToken = !!localStorage.getItem('INDRA_SOVEREIGN_TOKEN');

if (!isDevEnv && !hasSovereignToken) {
  // En producción sin token: el script no hace NADA. Invisible al mundo.
  console.debug('[IndraForge] HUD desactivado en entorno de producción.');
  // eslint-disable-next-line no-undef
  process.exit && process.exit(0); // No-op en browser, para silenciar lint
} else {
  initHud();
}

function initHud() {
  // Esperar a que el DOM esté listo
  const mount = () => {
    // 1. Crear el host del Shadow DOM
    const hostEl = document.createElement('div');
    hostEl.id = 'indra-forge-hud';
    hostEl.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
    `;
    document.body.appendChild(hostEl);

    // 2. Adjuntar Shadow DOM (aislamiento total de estilos)
    const shadow = hostEl.attachShadow({ mode: 'closed' });

    // 3. Inyectar font de Google (dentro del shadow para aislamiento)
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap';
    shadow.appendChild(fontLink);

    // 4. Crear el container de React dentro del Shadow DOM
    const container = document.createElement('div');
    shadow.appendChild(container);

    // 5. Montar el componente React
    const root = createRoot(container);
    const handleClose = () => {
      root.unmount();
      hostEl.remove();
    };

    root.render(
      React.createElement(ForgePanel, { onClose: handleClose })
    );

    console.info('[IndraForge] 🛰️ Satellite HUD activo. ¡Bienvenido, Arquitecto!');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
}
