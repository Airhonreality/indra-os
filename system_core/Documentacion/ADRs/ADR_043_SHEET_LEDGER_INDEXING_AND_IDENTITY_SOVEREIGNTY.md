# ADR-043: Indexación por Master Ledger (Sheets) y Soberanía de Identidad Pura

> **Estado:** PROPUESTO — Plan de Verificación y Transmutación
> **Versión:** 1.0 (2026-04-16)
> **Autor:** Antigravity (Auditor Axiomático)
> **Contexto:** Optimización de la persistencia y simplificación del flujo de ignición.

---

## 1. CONTEXTO Y PROBLEMÁTICA

### 1.1 El Cuello de Botella de Drive (Miopía de Disco)
La arquitectura actual de Indra basa su descubrimiento de datos en la iteración física de archivos JSON en carpetas de Google Drive (`folder.getFiles()`). 
*   **Problema:** A medida que el número de átomos (Workspaces, Schemas, etc.) crece, el tiempo de respuesta aumenta linealmente. 
*   **Síntoma:** Latencias altas en el Dashboard y riesgo de *Execution Timeout* en Google Apps Script.

### 1.2 La Redundancia de Identidad (Password Atavism)
El sistema actual solicita una contraseña (`password`) incluso cuando el usuario ha validado su identidad mediante Google Auth (OAuth nativo).
*   **Problema:** Genera bucles de `NEEDS_SETUP` innecesarios.
*   **Síntoma:** Fricción en el "Bootstrap" inicial y una capa de seguridad redundante que ignora la infraestructura de confianza de Google.

### 1.3 Acoplamiento de Handlers (El Problema del "Vaso Comunicante")
Los handlers de protocolos (`ATOM_READ`, `ATOM_CREATE`) en `provider_system_infrastructure.js` están casados físicamente con las APIs de `DriveApp`.
*   **Problema:** No existe una capa de abstracción. El "cerebro" cree que todo dato es un archivo.
*   **Síntoma:** Imposibilidad de migrar a Sheets (u otras BD) sin reescribir la lógica de negocio core.

### 1.4 La Opacidad de las Funciones Privadas (`_`)
Indra utiliza el sufijo de guion bajo (`_`) para funciones de utilidad interna. 
*   **Propósito:** Encapsulamiento en Google Apps Script. Evita que funciones core sean visibles como macros o vía `clasp run`. 
*   **Problema:** Muchas de estas funciones contienen lógica de parcheo de datos mezclada con lógica de persistencia, dificultando la auditoría.

---

## 2. DECISIÓN ARQUITECTÓNICA

Se aprueba la transición hacia un modelo de **Persistencia Híbrida** basado en un **Master Ledger** (Libro Mayor) en Google Sheets y un **Bypass de Identidad** para el propietario.

### 2.1 El INDRA_MASTER_LEDGER (Capa Index)
Se crea una Google Sheet central que actuará como índice de alta velocidad.
*   **Propósito:** Sustituir la búsqueda secuencial en Drive por una consulta única a memoria (`getValues()`).
*   **Naturaleza:** Es un "mapa de la materia". El contenido pesado (payload) sigue viviendo en JSON, pero la metadata vive en la Sheet.

### 2.2 Soberanía por Derecho de Sangre
Se establece que el `core_id` (email del dueño) es la credencial máxima y suficiente para el acceso MASTER.
*   **Bypass:** Si `Session.getActiveUser().getEmail() == readCoreOwnerEmail()`, el reto de contraseña se omite.

### 2.3 Persistencia Híbrida (Shadow Backup)
Para evitar la fragilidad de Sheets (borrados accidentales), se implementa un modelo de **Sombra en Drive**.
*   **Lectura/Búsqueda:** Prioridad absoluta a la Sheet (Velocidad).
*   **Escritura:** El sistema escribe en la Sheet y simultáneamente genera/actualiza el JSON en Drive (Resiliencia).
*   **Recuperación:** Indra debe ser capaz de regenerar el Ledger completo escaneando la "Sombra" en Drive en cualquier momento.

### 2.4 GID (Global ID) y Genoma Micelar
Se introduce el concepto de **Global ID (GID)** independiente de la infraestructura física del proveedor.
*   **Axioma:** El GID es la clave primaria única en todo el micelio (Core y Satélites). Permite que un átomo sea movido de un Core a otro manteniendo su identidad "genómica".

### 2.5 El Rol de los Providers en la Persistencia Dual
Para evitar la duplicidad de lógica y mantener la integridad axiomática:
*   **Master Ledger (Sheets):** Se convierte en la fuente de verdad primaria para la operación y búsqueda rápida.
*   **Shadow Backup (Drive):** Gestionado exclusivamente por el **`provider_drive.js`**. 
*   **Abstracción de Infraestructura:** El `provider_system_infrastructure.gs` delega en `provider_drive.js` la creación y actualización de la "sombra" JSON únicamente con fines de resiliencia, migración y recuperación de desastres.

### 2.6 Nexo Reactivo y Proyección Optimista
El despliegue del Master Ledger en el Core debe ser acompañado por una evolución en el Frontend (Nexo):
*   **Optimistic Pulse:** El Nexo forzará una actualización del estado local inmediatamente tras el éxito de una directiva, sin esperar al ciclo de resonancia global.
*   **Memoización de Proyección:** Los átomos se proyectarán una sola vez al entrar en el `domain.slice`. Se prohíbe la re-proyección en cada render para garantizar 60fps en workspaces densos.
*   **Fallback Axiomático:** Implementación de un "Generic Engine" que permita inspeccionar cualquier átomo cuya clase no esté registrada en el `EngineRegistry`.

### 2.7 Homeostasis y Cristalización Pasiva
El sistema no asume la infalibilidad del Ledger, sino su conveniencia.
*   **Protocolo de Resonancia:** Si un átomo es "tocado" y no existe en el Ledger, se indexa JIT (Just-In-Time).
*   **Sincronía de Sangre:** El dueño no solo tiene bypass de contraseña, sino que el sistema genera un **Ephemeral Master Ticket** interno para mantener la trazabilidad formal sin fricción.
*   **Escritura Peristáltica:** Implementación de un buffer de escritura mediante `LockService` para evitar errores de cuota en Google Sheets durante operaciones masivas.

---

## 3. ESPECIFICACIÓN TÉCNICA

### 3.1 Estructura del Ledger (Canon de Fila Indra)
| Columna | Descripción |
|---------|-------------|
| `gid` | ID Global Único (Genoma del Átomo). |
| `drive_id` | ID físico del archivo JSON en Google Drive (Puntero de Resiliencia). |
| `class` | Clase canónica del átomo (WORKSPACE, DATA_SCHEMA, etc.). |
| `alias` | Identificador humano slugified. |
| `label` | Nombre visible del artefacto. |
| `owner_id` | Email del creador/dueño (Effective Owner). |
| `updated_at` | Marca de tiempo ISO para ordenamiento y resonancia rápida. |
| `payload_json` | (Opcional) Caché del contenido para filtros ultra-rápidos. |
| `metadata_json`| (Opcional) Configuración extendida del átomo. |

### 3.2 Cambios en Capas de Core

#### Capa 0: Gateway (`api_gateway.js`)
*   Refactorizar `isBootstrapped()` para que valide identidad de sesión antes que existencia de secretos físicos.
*   Modificar la validación de `isAuthenticated` para priorizar `isOwnerSession`.

#### Capa 2: Providers (`provider_system_infrastructure.js`)
*   **`_system_listAtomsByClass`**: Cambiar iteración de Drive por lectura de rango en el Master Ledger (Sheets).
*   **`_system_createAtom`**: Escritura en Master Ledger + Delegación a `provider_drive.js` para creación de la "Sombra JSON".
*   **`_system_deleteAtom`**: Limpieza en Master Ledger + Delegación a `provider_drive.js` para marcado de papelera en Drive.

#### Capa 3: Servicios Afectados
*   **`resonance_service.js`**: El Checksum ahora se calcula solo leyendo la celda `last_updated_ledger` en lugar de escanear Drive.
*   **`integrity_suite.js`**: Nuevo handler para auditoría de filas vs archivos "sombra".
*   **`search_engine`**: Implementación de consultas directas vía `QUERY()` de Sheets para filtrado avanzado.

#### Capa 2 (FRONTEND): El Nexo
*   **`directive_executor.js`**: Sanitización total. El `share_ticket` debe ser inyectado desde el `app_state`, eliminando la dependencia directa de `localStorage`.
*   **`domain.slice.js`**: Se convierte en el "Caché de Átomos Proyectados". Deja de ser un simple contenedor de JSONs crudos.
*   **`DataProjector.js`**: Purgado de clases legacy y optimización de densidad de cálculo.

#### Capa 4: Utilidades de Parcheo y Genoma
*   **`JSON_PATCH_ENGINE`**: Nueva utilidad interna para realizar `ATOM_UPDATE` de forma atómica.
*   **`GID_JIT_GENESIS`**: Lógica de generación de Global ID al vuelo para átomos legacy detectados durante la lectura. La identidad se cristaliza en el momento de la observación.

---

## 4. PLAN DE VERIFICACIÓN (Puntales de Verdad)

Para considerar esta cirugía exitosa, se deben validar los siguientes hitos:

1.  **[ ] Hito de Consistencia:** Tras la migración, el número total de archivos JSON en las carpetas de Drive debe coincidir exactamente con el número de filas en el `INDRA_MASTER_LEDGER`.
2.  **[ ] Hito de Identidad:** Un usuario (dueño) debe poder acceder al `SYSTEM_MANIFEST` inmediatamente después de un despliegue sin haber configurado una contraseña previa.
3.  **[ ] Hito de Performance:** Una llamada a `ATOM_READ` de la clase `DATA_SCHEMA` con 10 o más ítems debe resolverse en < 500ms (reducción estimada del 60%).
4.  **[ ] Hito de Resiliencia:** El borrado manual de una fila en la Sheet no debe corromper el átomo en Drive (posibilidad de re-indexación manual).

---

## 5. RIESGOS Y MITIGACIÓN

*   **Riesgo:** Desincronización entre Sheet y Drive.
*   **Mitigación:** Implementar una función `SYSTEM_LEDGER_REINDEX` que pueda reconstruir la Sheet escaneando Drive en casos de emergencia.
*   **Riesgo:** Límites de cuotas de lectura de Sheets.
*   **Mitigación:** Usar caché de `ScriptProperties` para el ID de la Sheet y un caché de sesión para los resultados de lectura frecuentes.

---
> "Matamos al purista para salvar al sistema. La soberanía no es solo privacidad, es eficiencia." 🛰️🏗️⚡
