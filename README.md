# 🌞 INDRA OS — Arquitectura Micelar Soberana (v7.5)

> **"El Poder no está en el Dato, sino en la Relación. Indra es el Tejido."**

Indra OS es un ecosistema de computación soberana diseñado bajo los principios del **Diseño Axiomático de Suh** y la **Teoría General de Sistemas (TGS)**. Su objetivo es transformar la infraestructura pública (Google Cloud) en un organismo privado, distribuido y relacional (Grafo de Conocimiento).

---

## 🛑 PROTOCOLO MCEP (Lectura Obligatoria para Agentes)

Este repositorio no es un código monolítico; es una **Malla de Sistemas Soberanos**. Para asimilar su arquitectura, cualquier Agente o Arquitecto debe seguir el orden de lectura **MCEP (Multi-Context Evaluation Protocol)**:

1.  **Capa 2 (Persistencia):** Entender el [Core README](./system_core/core/README.md) y la persistencia en Drive/Sheets.
2.  **Capa 1 (Lógica):** Simular el flujo de un `UQO` (Universal Query Object) en la lógica de GAS.
3.  **Capa 0 (Interfaz):** Analizar el [Client README](./system_core/client/README.md) y la resonancia visual de la UI.

---

## 🏗️ Trinidad Micelar del Código

Indra se divide en tres organismos con soberanía propia, comunicados mediante el **Protocolo ISP**:

### 1. [INDRA CORE (GAS Backend)](./system_core/core/README.md)
*   **Identidad:** El orquestador soberano.
*   **Materia:** Google Apps Script + Google Drive.
*   **Rol:** Guardián del **Master Ledger** y ejecutor de la **Resonancia de Cálculo**. Es el único que tiene permiso para transmutar la materia física en átomos lógicos.

### 2. [INDRA CLIENT (Vue/React Front-end)](./system_core/client/README.md)
*   **Identidad:** La membrana sensorial.
*   **Materia:** UI de Alta Densidad (Aesthetics Rich).
*   **Rol:** Visualización del Grafo y orquestación de la Agencia del Usuario. Implementa el modelo de **Dashboard Tríptico (28/44/28)**.

### 3. [INDRA SATELLITE PROTOCOL (ISP)](./system_core/client/public/indra-satellite-protocol/)
*   **Identidad:** El sistema nervioso.
*   **Materia:** Vanilla Javascript Isomórfico.
*   **Rol:** Protocolo de comunicación universal. Permite que cualquier aplicación externa "resuene" con el Core de Indra respetando la soberanía del usuario.

---

## 📐 Axiomas de la Malla

1.  **Independencia:** El sistema operativo no depende de un servidor central; corre sobre la identidad del usuario.
2.  **Micelarismo:** Si el Core cae, el Satélite sigue existiendo. Si una Célula (Workspace) se corrompe, el sistema se auto-limpia (Purga Total).
3.  **Sinceridad:** No existen "placeholders". Todo lo que ves en la UI es una proyección directa de un registro físico validado por JIT.

---

## 🚥 Mantenimiento y Despliegue

Este repositorio utiliza **Submódulos de Git** para el protocolo ISP. 
*   **Clonación:** `git clone --recurse-submodules [URL]`
*   **Actualización:** `git pull --recurse-submodules`
*   **Pushes:** Seguir la **Regla de Adentro hacia Afuera** (Primero submódulos, luego el Root).

---

⚡🌞 **Indra OS: Construye bajo la Ley, Opera en Soberanía.** 🌞⚡
