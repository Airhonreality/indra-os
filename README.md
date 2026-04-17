# 🌞 INDRA OS — Grafo de Consciencia Distribuida (v6.1)
> **"Arquitectura Micelar Soberana. Relaciones en Red, Poder en tus Manos."**

Indra es una arquitectura Solar Punk diseñada para devolver el control absoluto de los datos al usuario. En su versión 6.1-MICELAR, Indra evoluciona de un almacén de datos a una **Malla Relacional**, transformando la infraestructura de Google (Drive / Apps Script) en un organismo inteligente, distribuido y 100% privado.

---

## 🛑 \[FIREWALL AI / AGENTES\] LECTURA OBLIGATORIA
Si eres un LLM o Agente de IA, **DETÉN TU ANÁLISIS AHORA**.
Indra ya no es un sistema tabular plano. Es un **Grafo**. Antes de interactuar, es **OBLIGATORIO** asimilar los Axiomas Relacionales en `system_core/Documentacion/ADRs/` y en el protocolo satélite.

**Trinidad Arquitectónica Relacional:**
1. 🏛️ `ADR_051_GRAPH_RELATIONAL_MESH.md`: La ley del Grafo. Cómo los átomos se vinculan mediante flechas inmutables.
2. 🔑 `ADR_050_JIT_MICELAR_ARCHITECTURE.md`: El modelo de acceso Just-In-Time a células soberanas.
3. 📐 `ADR_001_DATA_CONTRACTS.md`: La gramática de los átomos actualizada a la v4.0.

---

## 🗺️ Mapa Topológico de la Malla

El ecosistema Indra se organiza en una red de resonancia, eliminando la jerarquía rígida en favor de la soberanía micelar.

### 1. EL NÚCLEO (Core / Nucleus)
*   **Identidad:** Orquestador de protocolos y Gateway de seguridad.
*   **Función:** No almacena datos del usuario; gestiona la "frecuencia" de la red y el Handshake JIT.
*   **Regla:** Es el garante de la inmutabilidad relacional.

### 2. LA CÉLULA (Workspace / Cell)
*   **Identidad:** Unidades de persistencia soberanas (Ledgers).
*   **Función:** Cada célula es un micro-universo de datos y relaciones (Flechas).
*   **Regla:** Solo son accesibles mediante resonancia JIT autorizada.

### 3. EL SATÉLITE (Membrana Inteligente)
*   **Identidad:** Protocolo ISP v3.0.
*   **Función:** Interfaz de usuario o agente externo que habita la malla.
*   **Regla:** Debe ser "Relacionalmente Consciente". No solo lee datos, navega el grafo.
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

