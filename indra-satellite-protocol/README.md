# 🛰️ INDRA SATELLITE PROTOCOL (v3.2 - JS Native)

![Indra](https://img.shields.io/badge/Status-Resonant-purple)
![Architecture](https://img.shields.io/badge/Architecture-Modular_Nexus-blue)
![DNA](https://img.shields.io/badge/DNA-Agnostic_JS-emerald)

## 🧬 El Paradigma de "ADN como Código"
A partir de la versión 3.1, el protocolo ha abandonado el uso de JSON estáticos para la configuración y el contrato maestro. Ahora, toda la espina dorsal del satélite reside en **Módulos ES nativos (`.js`)**.

### ¿Por qué?
1. **Latencia Cero**: Los esquemas se cargan vía `import`, sin peticiones de red (`fetch`).
2. **HMR Real**: Al editar el código del satélite, el ADN se actualiza en vivo sin recargar la página.
3. **Poder Declarativo**: Los esquemas siguen siendo agnósticos, pero ahora disfrutan de la seguridad y el autocompletado de JavaScript.

---

## 🏗️ Arquitectura Modular (El Nexus)
El corazón del sistema (`IndraBridge.js`) ha sido desacoplado para ser mantenible y robusto:

*   **`bridge_modules/IdentityNode.js`**: Gestión de Handshake y Ciudadanía.
*   **`bridge_modules/TransportLayer.js`**: Comunicación ferrosa con colas de red y timeouts de 30s.
*   **`bridge_modules/ContractCortex.js`**: El cerebro que carga y valida el ADN en JS.
*   **`bridge_modules/ResonanceSync.js`**: Orquestador de la persistencia atómica.

---

## ⚡ Flujo de Desarrollo "Cero Fricción"

1.  **Ignición**: Pulsa el botón del HUD para conectar con el Core.
2.  **Soberanía Local**: Edita tus esquemas en `src/score/schemas/*.js` o `.json`.
3.  **Tejido (Sync)**: Ejecuta `npm run sync`. Este comando lanza el `sync_core.js` (v3.2), el cual:
    *   Cosecha tus esquemas JS y JSON.
    *   Funde la realidad del Core con tu intención local.
    *   Genera el archivo consolidado `_INDRA_PROTOCOL_/indra_contract.js`.
4.  **Resonancia**: Pulsa el botón púrpura del HUD para cristalizar los cambios en el Core.

---

## 🛂 Archivos de Ciudadanía
*   `_INDRA_PROTOCOL_/indra_config.js`: Contiene tu identidad soberana (nombre, ID de ciudadanía). Es persistido automáticamente por el HUD.
*   `_INDRA_PROTOCOL_/indra_contract.js`: El cerebro consolidado de tu satélite. Generado por el script de tejido.

---
**Axioma de Indra**: *"El ADN no es un dato guardado, es una instrucción latiendo."* 🛰️💎🔥
