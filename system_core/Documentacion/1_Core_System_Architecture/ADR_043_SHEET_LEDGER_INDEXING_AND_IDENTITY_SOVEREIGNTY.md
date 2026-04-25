# ADR-043: Arquitectura de Identidad Soberana, Santuarios Tabulares y Ledgers Celulares

> **Estado:** ACEPTADO Y CRISTALIZADO (v18.0)
> **Versión:** 2.0 (2026-04-25) — *Reescritura Total Post-Reforma Axiomática*
> **Autor:** Antigravity (Auditor Axiomático) para Indra OS
> **Contexto:** Superación de la "Esquizofrenia de Datos" y consolidación del enrutamiento tabular para la identidad humana.

---

## 1. ONTOLOGÍA (El "Ser" de la Identidad)

En Indra OS v18.0, la identidad ya no es un archivo `.json` perdido en Google Drive ni una fila en una base de datos monolítica global. 

**La Identidad es Materia Activa.** Un átomo de clase `IDENTITY` que reside exclusivamente en un **Santuario Tabular** (la pestaña `Entidades`) dentro de un **Ledger Celular** (una Spreadsheet de Google asociada a un único Workspace).

El ser humano no se mezcla con la máquina. La infraestructura y las definiciones del sistema viven en la pestaña `ATOMS`, mientras que los sujetos con soberanía y agencia viven aislados en `Entidades`.

---

## 2. TELEOLOGÍA (El Propósito del Diseño)

Esta arquitectura no fue diseñada por capricho, sino para garantizar la **Homeostasis del Sistema** bajo presión extrema:

1.  **Soberanía Absoluta:** Cada Workspace (Célula) es dueño de sus propios usuarios. No existe un "registro global" que pueda ser corrompido.
2.  **Génesis Autónoma:** El sistema debe construirse a sí mismo. No se requieren configuraciones manuales ni creación de "Schemas" previos por parte del desarrollador.
3.  **Hidratación de Rango:** La autoridad (el `role`) no debe ser inferida ni calculada por el front-end; debe ser sellada criptográficamente por el Core desde la fuente de verdad y entregada como un derecho inalienable en la sesión.

---

## 3. ARTEFACTOS IMPLICADOS (El Genoma Físico)

La implementación de este ADR cruza verticalmente todas las capas del Core, delegando responsabilidades con precisión quirúrgica:

*   **`provider_system_identity.gs` (Capa de Agencia):** Expone la directiva `createProfile`. Ya no toca bases de datos; delega el destino del átomo al Ledger.
*   **`auth_service.gs` (Motor Criptográfico):** Gestiona la directiva `SYSTEM_IDENTITY_SYNC`. Solicita al Ledger que encuentre al usuario y, si tiene éxito, forja el Ticket de Sesión L2 (JWT) inyectándole el `payload.role`.
*   **`provider_system_ledger.gs` (El Orquestador de Materia):** El "cerebro" del almacenamiento celular.
    *   `ledger_register_identity`: Empaqueta el átomo, convierte el ADN extendido a JSON string (`payload`), y lo envía al enrutador tabular.
    *   `ledger_find_atom_deep`: Realiza el barrido físico, extrae las filas, deserializa el JSON del `payload` (Hidratación) y retorna el átomo perfectamente reconstruido para que Auth pueda leer el rango.
*   **`infra_persistence.gs` / `provider_system_logic.gs` (La Fibra Óptica):** Exponen y enrutan los protocolos `TABULAR_UPDATE` y `TABULAR_STREAM`, redirigiendo la petición al proveedor de Sheets si `uqo.provider === 'sheets'`.
*   **`provider_sheets.gs` (El Conector de Última Milla):** La mano que toca la Spreadsheet.
    *   `_sheets_get_target_tab_`: Resuelve la pestaña buscando "Entidades" (con insensibilidad a mayúsculas/minúsculas). Si es una escritura y la pestaña no existe, ejecuta el **Axioma de Génesis Tabular** creando la hoja y sus cabeceras.
    *   `_sheets_handleTabularStream`: Extrae y formatea las filas físicas saltando las cabeceras.

---

## 4. PROTOCOLOS VINCULADOS (La Coreografía)

El ciclo de vida de la identidad baila al ritmo de 4 protocolos fundamentales:

1.  **`SYSTEM_IDENTITY_CREATE`**: El acto de sembrar un sujeto. Inicia en el Router, pasa por `provider_system_identity` y termina escribiendo físicamente a través del Ledger.
2.  **`SYSTEM_IDENTITY_SYNC`**: El acto de reclamar soberanía (Login). El Satélite envía un token de Google, el `AuthService` lo valida y desencadena un barrido de búsqueda.
3.  **`TABULAR_UPDATE`**: Protocolo agnóstico de infraestructura. Usado por el Ledger para pedirle al proveedor físico que añada una fila.
4.  **`TABULAR_STREAM`**: Protocolo de visión profunda. Usado por el Ledger para volcar en memoria las filas de la hoja `Entidades` y realizar el "match" polimórfico del email.

---

## 5. VECTORES DE ENTROPÍA ANIQUILADOS

Durante la evolución hacia la v18.0, se identificaron y destruyeron los siguientes vectores de falla sistémica:

### ⚠️ Vector Alfa: "Esquizofrenia de Datos" (Acoplamiento Infra/Sujeto)
*   **Fallo original:** Los usuarios se guardaban en la misma pestaña `ATOMS` que los esquemas y las definiciones del sistema.
*   **Mitigación:** Creación obligatoria del "Santuario Tabular". Las identidades habitan única y exclusivamente en la pestaña `Entidades`.

### ⚠️ Vector Beta: "Miopía de Identidad" (Pérdida de Rango / Fallback a GUEST)
*   **Fallo original:** Al leer la hoja, el campo `payload` se devolvía como un simple texto plano (String JSON). Cuando `AuthService` intentaba leer `userAtom.payload.role`, obtenía `undefined` y degradaba al usuario al rango `GUEST`.
*   **Mitigación:** Implementación de "Hidratación de Rango" en `ledger_find_atom_deep`. El escáner ahora hace un `JSON.parse` seguro al vuelo, devolviendo a Auth un objeto rico del que extraer permisos.

### ⚠️ Vector Gamma: "Fragilidad Sensible a Caja" (Case Sensitivity)
*   **Fallo original:** Si un humano renombraba la pestaña a `entidades` (minúscula), el código de Apps Script `getSheetByName("Entidades")` fallaba y devolvía 0 filas.
*   **Mitigación:** Resolución heurística insensible (`toLowerCase()`) en `_sheets_get_target_tab_`.

### ⚠️ Vector Delta: "Agujero de Enrutamiento" (Protocolos Fantasma)
*   **Fallo original:** El Ledger llamaba a `TABULAR_STREAM`, pero un "handler" defectuoso en `provider_system_logic` ignoraba que el destino era `sheets` e intentaba buscar archivos locales en Drive, fallando silenciosamente.
*   **Mitigación:** Enrutamiento explícito y estricto. Si `uqo.provider === 'sheets'`, se delega instantáneamente a `_sheets_handleTabularStream`.

### ⚠️ Vector Épsilon: "Fricción de Despliegue" (Setup Manual)
*   **Fallo original:** Si la pestaña no existía, la escritura fallaba o se corrompía el Workspace.
*   **Mitigación:** **Génesis Tabular Autónoma**. Si al hacer un `TABULAR_UPDATE` la pestaña `Entidades` no existe, el sistema asume autoridad creadora: inserta la hoja, inyecta las cabeceras canónicas (`id`, `handle`, `class`, `payload`, etc.) y procede con la escritura en la misma fracción de segundo.

---
*Documento forjado en fuego tras la Auditoría SUH v18.0 | Larga Vida a la Homeostasis.*
