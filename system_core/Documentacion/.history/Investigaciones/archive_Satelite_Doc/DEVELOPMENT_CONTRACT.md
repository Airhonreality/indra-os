# 🛠️ DEVELOPMENT CONTRACT: Manual de Ingeniería de Satélites

Este documento define la interacción técnica entre tu código (el Satélite) y el sistema nervioso central (el Kernel).

## 🧠 1. Interacción con el Núcleo (Kernel)
El kernel es cargado automáticamente por el Hub. No intentes importarlo manualmente.

### Acceso a Capacidades
```javascript
// La única forma legal de acceder a la UI industrial
const UI = await kernel.UI.getFormGenerator();
const Tree = await kernel.UI.getFractalTree();
```

## 🛰️ 2. El Ciclo de Vida del Satélite
1.  **Ignición (Boot):** Carga del `indra_hub.js`.
2.  **Handshake:** Sincronización con el Core vía `indra_config.js`.
3.  **Resonancia:** Escucha de eventos `indra-ready`.

## 📂 3. Gestión de Esquemas (ADN)
*   Los esquemas locales viven en `src/scores/`.
*   Usa el botón **PULL** en el HUD para materializar esquemas del Core en tu disco local físicamente.
*   **Axioma:** El código es efímero, el esquema es eterno. Diseña tus funciones pensando en recibir un Objeto Schema, no datos aislados.

## ⚙️ 4. Sincronía Física (Vite Sync)
... (anterior contenido) ...

## 🆘 5. Resolución de Conflictos (Troubleshooting)
*   **Caché Zombi**: Si tras actualizar el motor sigues viendo versiones viejas (negro, 3 columnas), el puerto 3000 está secuestrado por un Service Worker. **Cambia el puerto en vite.config.js o usa una pestaña de invitado.**
*   **Drift de ADN**: Si los esquemas no aparecen, verifica que el `AgnosticVault.js` está presente en la carpeta `logic`.

---
*Construye para la eternidad, despliega para el momento.* 🛰️💎🔥
