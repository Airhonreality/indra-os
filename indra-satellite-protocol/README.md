# 🛰️ INDRA SATELLITE PROTOCOL (v5.0_RESONANCE - Live DNA)

![Indra](https://img.shields.io/badge/Status-Live_Resonant-purple)
![Architecture](https://img.shields.io/badge/Architecture-Direct_Nexus-blue)
![DNA](https://img.shields.io/badge/DNA-Logic_Native_JS-emerald)

## 🧬 El Paradigma de "Resonancia en Vivo"
En la versión 5.0, Indra abandona definitivamente la necesidad de procesos de construcción intermedios para el desarrollo. El ADN del satélite es **Código Vivo** que el navegador orquesta directamente con el Core.

### ⚡ Beneficios Clave
1.  **Latencia Cero**: Los cambios en tus esquemas se reflejan al instante gracias al cargador dinámico.
2.  **Lógica en ADN**: Puedes incluir funciones de transformación y validación directamente en tus objetos de esquema JS.
3.  **Sincronización Core-Direct**: El satélite puede comunicarse directamente con el Core de Indra para obtener la verdad global sin pasar por scripts de Node.

---

## 🏗️ Arquitectura Modular (El Nexus v5.0)
El corazón del sistema (`IndraBridge.js`) coordina varias capas autónomas:

*   **`IdentityNode.js`**: Gestión de Handshake y Ciudadanía Soberana.
*   **`ContractCortex.js`**: El cerebro que decide qué ADN cargar (Local vs Global) en tiempo real.
*   **`ResonanceSync.js`**: Orquestación de la Cristalización y cálculo de Drift.

---

## ⚡ Flujo de Desarrollo "Fricción Cero"

1.  **Ignición**: Conecta tu satélite al Core desde el HUD.
2.  **Edición en Vivo**: Modifica tus esquemas en `src/score/schemas/*.js`. 
3.  **Resonancia**: Pulsa **ACTUALIZAR** en el HUD. El `ContractCortex` detectará tus cambios y el motor de resonancia aplicará los deltas en la materia física (Drive/Notion) sin necesidad de reiniciar nada.

> [!NOTE]
> El script `sync_core.js` sigue disponible como una herramienta de **Empaquetado de Producción** para consolidar el contrato en un solo archivo antes del despliegue final.

---

## 🌀 Invocación de Herramientas (Portales)
Tu satélite puede invocar la potencia bruta de las UIs de Indra como funciones locales:

```javascript
const bridge = new IndraBridge();
const result = await bridge.invokeUI('MEDIA_EXPLORER', { persist: false });
```

---

## 🛂 Archivos de Ciudadanía
*   `_INDRA_PROTOCOL_/indra_config.js`: Tu identidad soberana persistente.
*   `_INDRA_PROTOCOL_/indra_contract.js`: Opcional en desarrollo, obligatorio para despliegues estáticos ("Snapshot").

---
**Axioma de Indra**: *"El ADN no es un dato guardado, es una instrucción latiendo."* 🛰️💎🔥

