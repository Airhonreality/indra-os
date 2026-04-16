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
## 🔐 Filosofía: Soberanía de la Llave (Keychain Engine)

A diferencia de las aplicaciones tradicionales que "te piden permiso", los satélites de Indra operan mediante el **Protocolo de Soberanía de Llaves (ADR-041)**. 

### El Llavero Sincero
La Nave Nodriza (Core) mantiene un registro de identidades llamado `keychain_service.js`. Este archivo es el corazón de la seguridad y determina quién tiene derecho a operar sobre la materia (tus datos).

1.  **Identidad Delegada (Sesión)**: Es efímera. Se basa en que estás logueado en Google. Es cómoda pero dependiente de la interfaz de Indra OS.
2.  **Identidad Soberana (Tokens)**: Es persistente y agnóstica. El Core utiliza el **Keychain Engine (ADR-041)** para emitir llaves con dos niveles de jerarquía:
    -   **Nivel MASTER**: Acceso total a todos los Workspaces y servicios del Core (ej: `indra_satellite_omega`).
    -   **Nivel SCOPED**: Acceso restringido a un único Workspace o recurso. El API Gateway bloqueará cualquier intento de saltar a otro contexto (Error 403).

---

## 🚀 Inicio Rápido: El Pacto de Resonancia

Para conectar este satélite a tu Core, puedes usar el **Panel de Enlace Crítico** en la interfaz:

1.  **URL_DE_LA_NAVE_NODRIZA**: La dirección de tu script de Google Apps Script (GAS).
2.  **TOKEN_DE_SINCERIDAD**: Por defecto es `indra_satellite_omega` (la llave maestra de bootstrap).
3.  **IGNICIÓN**: Al pulsar "FIRMAR PACTO", el satélite se anclará a tu Core mediante `localStorage`.

> [!IMPORTANT]
> Si cambias el token en el archivo `3_services/keychain_service.js` de tu Core, asegúrate de actualizarlo también en tus satélites. La soberanía requiere vigilancia.

---

## 🛠️ Desarrollo Local

1. Clona este repositorio.
2. Ejecuta `npm install` y `npm run dev`.
3. Abre `localhost:3001` (o el puerto asignado).
4. El Satélite buscará automáticamente esquemas en `/src/score/schemas`.

---

## 💎 Axioma de Soberanía
Este satélite no almacena datos en servidores externos. La comunicación es directa entre tu navegador y tu cuenta de Google Drive. La seguridad reside en tu **Pacto de Resonancia**. 🚀🛰️

---

## 🚀 Desarrollo Local Soberano (Vite Daemon)

Para una experiencia de desarrollo profesional y 100% automatizada, el entorno utiliza un **Sovereign Local Daemon** integrado en Vite. Esto permite que el satélite guarde su propia identidad y flujos directamente en tu disco duro sin necesidad de servidores externos.

### 1. Instrucciones de Arranque
```bash
npm install
npm run dev
```

### 2. El Flujo de Configuración (HUD Workflow) 🛰️
Una vez que el servidor esté corriendo en `localhost:3000`:
1.  Abre el **Indra Bridge HUD** (el panel flotante en la esquina).
2.  Configura el `satellite_name` y tu `core_id`.
3.  **Botón "Guardar en Daemon (Auto)" [RECOMENDADO]**: Al pulsarlo, el servidor Vite (gracias al middleware inyectado en `vite.config.js`) interceptará la petición y escribirá directamente el archivo `_INDRA_PROTOCOL_/indra_satellite.meta.json`. 
4.  **Sincronización**: Ejecuta `npm run sync` en tu terminal para compilar la metadata con los esquemas del Core y generar el contrato final (`indra_contract.json`).

> [!TIP]
> Si el guardado automático falla (ej. permisos de OS), usa el botón de **Descarga Manual** y coloca el archivo en la ruta indicada. El sistema detectará el cambio al instante.

---

## 🏗️ Rutas de Ignición y Sincronización
- **`npm run dev`**: Levanta la UI y el Daemon de persistencia local.
- **`npm run sync`**: Ejecuta `sync_core.js`. Lee tu metadata local, consulta al Core y compila el ADN del satélite.
- **`npm run build`**: Genera el bundle de producción optimizado.

---

## 🚀 Ignición Rápida (Template)

1. **Clonar**: `git clone --recursive https://github.com/Airhonreality/indra-satellite-protocol.git`
2. **Integración en Indra OS**: Si este repositorio se usa como submódulo en `indra-os`, su ubicación oficial para despliegue es: `/system_core/client/public/indra-satellite-protocol/`.
3. **Desarrollar**: Edita los esquemas en `src/score/schemas` y el Satélite se auto-sincronizará mediante el Bridge.

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
