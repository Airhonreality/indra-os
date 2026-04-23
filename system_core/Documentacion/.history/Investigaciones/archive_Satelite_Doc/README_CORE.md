# ☢️ INDRA OS SYSTEM CORE

**ESTA CARPETA CONTIENE EL CABLEADO DE ALTA TENSIÓN DE INDRA.**

Si estás viendo esto, estás dentro de la maquinaria del SmartBridge. Para mantener la escalabilidad de tus proyectos y poder recibir actualizaciones de seguridad y performance, sigue estas reglas:

## 1. 🚫 NO EDITAR LOS ARCHIVOS DE ESTA CARPETA
Cualquier cambio manual en `_INDRA_PROTOCOL_` provocará conflictos en Git cuando intentes actualizar el núcleo. Si necesitas cambiar algo, solicítalo al equipo central o usa los Hooks de configuración.

## 2. ⚙️ USA `indra_config.js`
Si quieres cambiar el comportamiento del Hub, la ruta de tu aplicación o el modo de debug, crea o edita el archivo `indra_config.js` en la **raíz del proyecto**.

## 3. 🧩 TU PROYECTO VIVE EN `/src`
Toda tu lógica de negocio, schemas de datos y UI personalizada de tu satélite debe vivir en la carpeta `/src/`. El sistema está diseñado para que tu código y el nuestro nunca se toquen.

---
*Indra Satellite Protocol - Built for Industrial Sovereignty*
