# INDRA CORE — El Núcleo de Consciencia GAS (v7.5)

Este directorio constituye el **Cerebro Operativo** de Indra OS, desarrollado íntegramente en Google Apps Script (GAS). Su diseño no es accidental; es el resultado de la aplicación rigurosa del **Diseño Axiomático (Suh)** y la **Teoría General de Sistemas (TGS)** para crear un entorno de soberanía de datos sobre infraestructura cloud pública.

---

## 1. Justificación Sistémica (TGS)
Desde la perspectiva de la **TGS**, el Core de Indra se define como un **Sistema Abierto con Membrana Semipermeable**. 

*   **Identidad Micelar:** El sistema no es un monolito; es un organismo que se fractaliza. El Core central actúa como el "Silo Madre", pero tiene la capacidad de engendrar **Celdas (Workspaces)** que replican su propia estructura de datos y lógica, garantizando la supervivencia del sistema incluso si se fragmenta la infraestructura física.
*   **Homeostasis y Entropía:** El Core combate la entropía de los servicios cloud mediante protocolos de **Resiliencia Natural** (JIT checks) y un **Reloj de Pulso** que garantiza la coherencia entre el estado físico (Drive) y el estado lógico (Ledger).

---

## 2. Diseño Axiomático (Axiomatic Design)

Siguiendo los principios de **Nam Pyo Suh**, el Core se divide en dominios funcionales desacoplados para cumplir con el **Axioma de Independencia**.

### Matriz de Requerimientos Funcionales (FR) y Parámetros de Diseño (DP)

| Req. Funcional (FR) | Parámetro de Diseño (DP) | Capa |
| :--- | :--- | :--- |
| **FR1: Regulación de Entrada** (Filtrado de vectores y validación de seguridad). | **DP1: Protocol Firewall** (`0_gateway`) | Capa 0 |
| **FR2: Procesamiento Semántico** (Transformación y resonancia de átomos). | **DP2: Logic Engine/Orchestrator** (`1_logic`) | Capa 1 |
| **FR3: Persistencia de Materia** (Interacción con APIs físicas de Drive/Sheets). | **DP3: Infrastructure Providers** (`2_providers`) | Capa 2 |

### Axioma 1: Independencia Funcional
Las capas están diseñadas para que un cambio en la persistencia física (sustituir Drive por SQL, por ejemplo) no afecte a la lógica de negocio ni a las reglas de seguridad del firewall.

### Axioma 2: Minimización de Información
Indra no genera datos sintéticos. El Core es un **transductor puro**. La complejidad de la infraestructura se oculta tras el **Contrato Universal de Átomos**, minimizando la carga cognitiva para el Satélite (Frontend).

---

## 3. Restricciones Axiomáticas Críticas (Constitución)

1.  **AX-01 (Sinceridad de ID):** Un ID en la lógica debe ser SIEMPRE el mismo ID de la infraestructura física. No se permiten IDs internos o mapeos artificiales fuera del Ledger.
2.  **AX-02 (Ley de Retorno):** Ningún componente puede retornar `null` o `undefined`. Toda interacción debe culminar en un sobre de respuesta `{ items: Array, metadata: Object }`.
3.  **AX-03 (Soberanía Celular):** Un Workspace debe ser capaz de operar con su propio Ledger local. El Core central solo actúa como un "Punto de Montaje" transitorio.
4.  **AX-04 (Fallo Ruidoso):** Ante una violación de contrato, el sistema debe loguear el error de forma explícita y ejecutar un rollback físico (Ej. Purga total de la carpeta en creación fallida).

---

## 4. El Protocolo MCEP (Multi-Context Evaluation Protocol)

Este repositorio está estructurado para ser leído por agentes humanos e IAs siguiendo el protocolo **MCEP**:
1.  **Lectura de Identidad:** Consultar `manifest.json`.
2.  **Lectura de Reglas:** Revisar este `README.md` y los ADRs.
3.  **Evaluación de Capas:** Navegar de `0_gateway` hacia `2_providers`.

---

⚡ **Indra Core: La materia al servicio de la consciencia.** ⚡
