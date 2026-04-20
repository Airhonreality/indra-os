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
*   **`CapabilitiesResolver.js` (NUEVO)**: El Oráculo que resuelve proveedores y protocolos dinámicamente.

---

## 🛠️ Guía de Desarrollo Agnóstico (Buenas Prácticas)

Para que un Satélite sea verdaderamente soberano, **no debe asumir nada** sobre la infraestructura física y debe ser **Reactivo** ante el estado del motor.

1.  **Chasis Primero**: Renderiza tu UI inmediatamente. No esperes al Bridge para mostrar el Chasis.
2.  **Consulta al Oráculo**: Usa `bridge.capabilitiesOracle.getPreferredProvider('CLASE_ATOMA')`.
3.  **Ignición en 2 Pasos**: Sigue el flujo `ATOM_CREATE` -> `SYSTEM_SCHEMA_IGNITE`.
4.  **Estados de Carga**: Observa `bridge.status` para mostrar Skeletons mientras el motor está en `IGNITING`.

---

## 🏗️ Cómo usar el Bridge en tu App (Patrón onReady)

```javascript
import IndraBridge from './_INDRA_PROTOCOL_/core/IndraBridge.js';

// 1. Instanciar (Se auto-ignicia si hay sesión previa)
const bridge = new IndraBridge();

// 2. Renderizar Chasis Inmediatamente
renderChasis(); 

// 3. Suscribirse a la Gasolina
bridge.onReady((b) => {
    console.log("🚀 Motor listo. Hidratando datos...");
    const inventory = await b.execute({ protocol: 'TABULAR_STREAM', ... });
    renderContent(inventory);
});

// 4. (Opcional) Reaccionar a cambios de estado
bridge.onStateChange = (b, event, data) => {
    console.log(`Estado: ${b.status}`); // GHOST, IGNITING, READY, ERROR
};
```

---

## 🏗️ Cómo usar el Oráculo

```javascript
// Dentro de un onReady:
const provider = bridge.capabilitiesOracle.getPreferredProvider('DATA_SCHEMA');
```

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

