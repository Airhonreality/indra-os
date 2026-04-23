# 🔥 INDRA IGNITION FLOW (Ciclo de Vida)

Este documento describe cómo se despierta Indra desde que abres el navegador hasta que tu satélite toma el control.

## 1. Fase T=0: El Hub (Bootloader)
El archivo `index.html` carga exclusivamente `indra_hub.js`. 
*   El Hub despierta el **Bridge** y el **Kernel**.
*   Inyecta el **HUD** en un Shadow DOM (Blindaje visual).
*   Busca el archivo `indra_config.js`.

## 2. Fase T=1: Sincronía Axial
El **Bridge** intenta la ignición local:
*   Carga el ADN del contrato (schemas).
*   Si hay token, intenta resonancia con el Core (Google Apps Script).
*   Valida la integridad de la versión del Core.

## 3. Fase T=2: Entrega de Mando (Ignite)
Una vez que el puente está `READY`, el Hub realiza un `import()` dinámico de tu archivo principal (ej. `/src/app.js`).
*   El Hub busca la función `ignite(bridge, kernel)`.
*   Le entrega las llaves del sistema (los objetos bridge y kernel) a tu lógica.

## 4. Fase T=3: Órbita Estable
Tu satélite ahora está vivo. Puede:
*   Solicitar datos (`bridge.execute`).
*   Hydratar esquemas (`kernel.hydrateSchema`).
*   Interactuar con el usuario.

---
**¿Por qué este orden?**
Porque garantiza que cuando tu código empiece a correr, **ya existe una conexión real con los datos**. No tienes que esperar a que el sistema cargue; el sistema te llama a ti cuando esté todo listo.
