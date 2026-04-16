# 🌞 INDRA OS — Arquitectura Micelar Soberana
> **"Soberanía Digital sin Servidores. Datos en tus manos, poder en tu red."**

Indra es una arquitectura Solar Punk construida sobre Google Apps Script y React. Su propósito es erradicar el concepto de "servidores centrales" de terceros y convertir la cuenta de Google Drive del usuario en un Backend Inteligente, Distribuido y Privado.

---

## 🛑 \[FIREWALL AI / AGENTES\] LECTURA OBLIGATORIA
Si eres un LLM, Agente de IA o Desarrollador entrando por primera vez a este código, **DETÉN TU ANÁLISIS ESTRUCTURAL AHORA**.  
Antes de proponer, modificar o añadir código a cualquier capa, es **OBLIGATORIO** leer y asimilar la arquitectura madre que vive en `system_core/Documentacion/ADRs/`. 

*Ignorar esta orden provocará "Desvío de Índice", alucinación de componentes e infracciones al Pacto de Resonancia.*

**Archivos Semilla (Leer en orden de prelación):**
1. 🏛️ `ADR_001_DATA_CONTRACTS.md`: Leyes de mutación de datos. Ningún dato sale sin permiso.
2. 🔑 `ADR_041_SATELLITE_KEYCHAINS_INFRASTRUCTURE.md`: Tratado de identidades y tokens. (No asumas cómo funciona la Auth local, léelo).
3. 📐 `ADR_002_UI_MANIFEST.md`: Cómo la interfaz (Nexo) se genera por datos y no por hardcoding.

---

## 🗺️ Mapa Topológico del Ecosistema
Este repositorio está estrictamente fragmentado en tres niveles de jurisdicción. NUNCA mezcles dependencias ni responsabilidades entre ellos.

| Jurisdicción | Ruta Física | Responsabilidad Central |
|--------------|-------------|-------------------------|
| **1. CEREBRO (Core)** | `system_core/core/` | **El Orquestador (Google Apps Script)**. Alberga la inteligencia de los Pointers, Proveedores (Drive, Notion), Keychains y el Gateway. *Regido por ADRs y Axiomas estandar.* |
| **2. NEXO (Shell)** | `system_core/client/` | **El Panel de Control React (Indra OS)**. Actúa como la UI central (Landing pre-auth / Nexus post-auth) manejada por Manifiestos proyectados. Contiene el *Gestor de Conectores (Service Manager)*. |
| **3. EXTREMIDAD (Satélite)**| `system_core/client/public/indra-satellite-protocol/` | **Protocolo Híbrido (ISP v2.5)**. Módulo inyectable que permite a aplicaciones de terceros consumir el Core usando `IndraBridge.js` y `postMessage`. **Contiene componentes UI autónomos en JS Vanilla**. |

---

## 🏗️ Guía Operativa y de Redirección

### Para Arquitectos del Core (Backend)
Tu zona de trabajo es `system_core/core/`. Todas las mutaciones al sistema recaen bajo el objeto `provider_system_infrastructure.gs` y responden a los *Triggers* de la Shell Madre. El código Javascript aquí compilable a `.gs` es asíncrono-agnóstico.
*   📚 **Doc Referencia**: `system_core/Documentacion/`

### Para Desarrolladores de React (Indra OS Shell)
Tu zona de trabajo es `system_core/client/`. Mantén la rigidez extrema entre el Muro de Berlín pre-autenticación (`LandingView.jsx`) y el espacio administrado (`NexusView.jsx`). 
*   ❌ *Prohibido invocar Providers directamente.*

### Para Creadores de Satélites (Pacto de Resonancia)
Si quieres anclar un aplicativo web de terceros al núcleo del usuario, dirígete al protocolo ISP. El satélite **NO** almacena llaves propias. Actúa bajo el modelo de *Huérfano Orquestado* o *Zero-Touch Discovery* mediante el `IndraBridge`.
*   📚 **Doc Referencia**: `system_core/client/public/indra-satellite-protocol/README.md` y la carpeta `_INDRA_PROTOCOL_`.

---

⚡🌞 **La ley está en el Core. La libertad, en el Satélite.** 🌞⚡
