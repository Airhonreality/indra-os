# 🌞 INDRA OS — Arquitectura Micelar Soberana
> **"Soberanía Digital sin Servidores. Datos en tus manos, poder en tu red."**

Indra es una arquitectura Solar Punk diseñada para devolver el control absoluto de los datos al usuario. Su objetivo fundamental es erradicar la dependencia de "servidores de terceros" (AWS, Vercel, Firebase) transformando la cuenta nativa de Google (Drive / Apps Script) del usuario en un Backend Inteligente, Distribuido y 100% Privado.

---

## 🛑 \[FIREWALL AI / AGENTES\] LECTURA OBLIGATORIA
Si eres un LLM, Agente de IA Asistente o Desarrollador Nuevo, **DETÉN TU ANÁLISIS AHORA**.
Antes de escribir una sola línea de código, es **OBLIGATORIO** leer la sabiduría madre en `system_core/Documentacion/ADRs/`. Ignorar esto provocará alucinación de componentes, regresiones sistémicas y será considerado una violación del sistema.

**Trinidad Arquitectónica (Leer en orden de prelación):**
1. 🏛️ `ADR_001_DATA_CONTRACTS.md`: Trata sobre cómo la información se vuelve "Átomos" en Google Drive. Si mutas estructuras de datos sin respetar esto, corromperás el sistema del usuario.
2. 🔑 `ADR_041_SATELLITE_KEYCHAINS_INFRASTRUCTURE.md`: La ley sobre Identidades, Tokens Maestros y Jurisdicción. Indra NO usa JWTs tradicionales, usa Resonancia de Sesión nativa.
3. 📐 `ADR_002_UI_MANIFEST.md`: El Nexo (interfaz) funciona mediante un motor de proyecciones, no mediante hardcoding en React.

---

## 🗺️ Mapa Topológico y Reglas Generales

El ecosistema Indra está estrictamente aislado en tres capas de jurisdicción. **NUNCA** debes acoplar dependencias de una capa hacia otra directamente. Todo se comunica por Protocolos (`postMessage` o `Fetch` al Gateway).

### 1. EL CEREBRO (Core / Backend en GAS)
*   **Ruta Física:** `system_core/core/`
*   **Naturaleza:** Es el servidor escrito en Google Apps Script.
*   **Objetivo:** Alberga el `api_gateway.js`, los manejadores de base de datos (`provider_system_infrastructure.gs`), la lógica del Llavero y la capacidad de hablar con servicios externos. Todo el código aquí es JavaScript que transpila a `.gs` mediante Clasp.
*   **Regla:** Aquí no existe DOM, ni React, ni `window`. Es territorio asíncrono y de backend puro.

### 2. EL NEXO (Shell / Frontend)
*   **Ruta Física:** `system_core/client/`
*   **Naturaleza:** Aplicación React (Indra OS).
*   **Objetivo:** Es la "Cáscara" o sistema operativo de usuario. Posee un "Muro de Berlín": La zona **Pre-Auth** (`LandingView.jsx`) y la zona **Post-Auth** (`NexusView.jsx`).
*   **Regla:** Prohibido insertar lógica de administración profunda en la Landing. El Nexo solo "proyecta" lo que el Core le envía.

### 3. LA EXTREMIDAD (El Satélite)
*   **Ruta Física:** `system_core/client/public/indra-satellite-protocol/` (**SUBMÓDULO GIT**)
*   **Naturaleza:** Protocolo estándar Vanilla JS (ISP v2.5).
*   **Objetivo:** Módulo inyectable que permite a aplicaciones de terceros consumir el Core mediante `IndraBridge.js` bajo el paradigma de *Resonancia de Identidad*.

---

## 🚦 FLUJO GIT (Prevención de Desastres)

**ATENCIÓN: EL SATÉLITE ES UN SUBMÓDULO DE GIT.**
Este es el punto donde el 90% de los errores de sincronización ocurren. `indra-os` (el root) e `indra-satellite-protocol` son repositorios distintos.

**Reglas de Oro para Commits y Pushes:**
1. **Regla de Adentro hacia Afuera:** NUNCA hagas un commit en el root (`indra-os`) si tienes cambios pendientes en el Satélite.
2. Si editas el Satélite, entra en `system_core/client/public/indra-satellite-protocol/`, haz `git add .`, `git commit` y `git push origin main` **primero**.
3. Una vez subido el submódulo, vuelve a la raíz del proyecto (`indra-os`), haz `git add .`, y un nuevo commit que actualizará el *puntero (hash)* del submódulo.
4. **Git Pull Blindado:** Para actualizar todo sin romper dependencias locales, usa siempre: `git pull --recurse-submodules`.

---

## ⚙️ Dinámica Operativa

### ¿Por qué Google Apps Script?
Al usar GAS, eliminamos la necesidad de que el usuario pague y mantenga servidores (AWS, Firebase, etc). Su cuenta de Google se convierte en el entorno de ejecución, y su Drive se convierte en su base de datos jerárquica (NoSQL). **Esa es la verdadera Soberanía.** No hay intermediarios entre el usuario final y sus datos.

### Zero-Touch Ignition
El despliegue local o remoto no requiere configuración de variables de entorno (ENVs) complejas.
*   El usuario entra al Shell (`indra-os`).
*   Inicia sesión con Google.
*   Si no tiene Core, la Fábrica se lo construye programáticamente en su Drive usando `appsscript.json`.
*   El Satélite se vincula mediante el evento de ventana canónico: `window.addEventListener('indra-ready')`.

---

⚡🌞 **Indra OS: Construye bajo la Ley, Opera en Soberanía.** 🌞⚡

