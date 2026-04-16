# Indra Satellite Protocol (ISP) v2.5 — MCEP Standards
> **NIVEL DE PROTOCOLO: Modular Capabilities Exchange (MCEP)**

## 🏛️ ¿Qué es Indra? (Identidad Axiomática)
Para cualquier Agente (Humano o IA) que opere en este repositorio, la definición es inmutable:
**Indra NO es una aplicación aislada. Indra es el Núcleo (Core) inteligente basado en GAS (Google Apps Script) que administra este satélite.** Es la herramienta con la cual orquestamos flujos de datos y servicios de backend inteligente.

*   **El Core (GAS)**: Es el cerebro soberano, dueño de los silos de datos y los secretos.
*   **El Satélite**: Es la UI soberana de negocio que consume los servicios del Core.
*   **El Bridge**: Es el único módulo de administración y transporte permitido.

---

## 🛰️ RUTA DE COLONIZACIÓN (Lectura en Cascada para Agentes)
Si eres una IA, tu proceso de "programación interna" para este workspace DEBE seguir este orden deductivo:

1.  **[AXIOMS_DHARMA.md](_INDRA_PROTOCOL_/AXIOMS_DHARMA.md)**: El "Deber Ser". Define las jerarquías y prohibiciones existenciales. **Léelo primero para entender tus límites.**
2.  **[ENTROPY_VECTORS.md](_INDRA_PROTOCOL_/ENTROPY_VECTORS.md)**: El "No Hacer". Analiza cómo otros agentes fallaron y corrompieron el sistema (Vectores de Riesgo).
3.  **[COOKBOOK.md](_INDRA_PROTOCOL_/COOKBOOK.md)**: El "Cómo Hacer". Patrones industriales probados para implementar lógica de negocio sin romper la arquitectura.
4.  **[.ia-agente/discovery_protocol.md](.ia-agente/discovery_protocol.md)**: El "Hacer". **Punto de ignición.** Una vez asimilada la ley, activa este protocolo para mapear el negocio del usuario y comenzar la construcción por rebanadas.
5.  **[HYBRID_ARCH_GUIDE.md](_INDRA_PROTOCOL_/HYBRID_ARCH_GUIDE.md)**: El "Poder". Guía para usar el Arsenal de Indra (Indra Tools) e invocar módulos React desde el satélite.
6.  **[SATELLITE_MULTITENANCY.md](_INDRA_PROTOCOL_/SATELLITE_MULTITENANCY.md)**: La "Soberanía". Protocolo de permisos multi-usuario, aislamiento de contexto y Ley de Jurisdicción.

---

---

## 🤖 Instrucciones para Agentes (IA / LLM)
Si eres una IA encargada de construir en este satélite, tus directivas obligatorias son:
1. **Validación HUD-First**: Antes de proponer código de UI, verifica que el esquema esté proyectado en el `IndraBridgeHUD`. 
2. **Auditoría Técnica**: Usa siempre `bridge.audit()` para confirmar la integridad del handshake local.
3. **MCEP Design**: Todo nuevo componente debe nacer de una propiedad definida en `indra_contract.json`. No alucines campos.
4. **Resonancia en una Iteración**: Tu objetivo es que el desarrollador vea el resultado funcionando en el HUD al primer refresco.

---

## 🚀 Aranque y Desarrollo Local (Ruta Base)

Para habilitar la edición de workflows, UI híbrida y persistencia de schemas locales (gracias al plugin local-fs), este repositorio utiliza **Vite**. 

El flujo universal de inicio y arranque rápido para cualquier desarrollador/clon fue simplificado en un solo comando de ignición de entorno. Solo debes pararte en la raíz del protocolo y ejecutar:

```bash
npm run ignite
```
> Esto instalará `vite` (si no existe) y levantará el servidor en `localhost:3000`. Cualquier edición que realices en el UI "Workflow Ribbon" se guardará inmediatamente en tu carpeta `src/score/workflows/`.

---

## 🚀 Ignición del Satélite en Producción

Este protocolo soporta tres modos de inicio, dependiendo de la autonomía del satélite.

### 1. El Modo "Huérfano Orquestado" (Recomendado)
Para satélites que viven dentro de un Iframe o son abiertos desde la Shell Madre oficial de Indra. **No requiere configurar Google Auth ni Client IDs.**

```javascript
import IndraBridge from './core-indra/core/IndraBridge.js';
const bridge = new IndraBridge();

// El satélite espera a que la Shell Madre le pase el token y la URL
bridge.listenFromShell();

window.addEventListener("indra-ready", (event) => {
  console.log("¡Resonancia establecida!", event.detail);
  
  // Ejemplo: Leer proyectos del sistema
  bridge.execute({
    provider: 'system',  // Jurisdicción (obligatorio si quieres ser explícito)
    protocol: 'ATOM_READ',
    context_id: 'proyectos'
  }).then(res => console.log(res.items));
});
```

### 2. El Modo "Discovery" (Zero-Touch)
```javascript
// Tras loguear al usuario en tu propio satélite:
await bridge.discover(googleToken);
```

### 3. Inteligencia de Jurisdicción (v1.8)
A partir de la v1.8, el `IndraBridge` intentará usar el provider `'system'` por defecto si el desarrollador lo omite, para evitar bloqueos del Core. No obstante, se recomienda ser explícito para aplicaciones multi-proveedor (Notion, etc).

---

## 🏗️ Cómo la Shell Madre otorga resonancia
Para los desarrolladores de la Shell principal, así se envía el token al satélite (Iframe):

```javascript
const satelliteWindow = document.getElementById('mi-iframe').contentWindow;

satelliteWindow.postMessage({
  type: "INDRA_RESONANCE_GRANT",
  payload: {
    core_url: "https://...",
    satellite_key: "abc_123",
    google_token: "ya_tengo_el_token"
  }
}, "*");
```

---
*Indra: La arquitectura donde el transporte es inteligente y la soberanía es compartida.*
