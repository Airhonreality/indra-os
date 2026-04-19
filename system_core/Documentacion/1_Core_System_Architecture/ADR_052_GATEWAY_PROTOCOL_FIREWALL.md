# ADR-052: Protocol Firewall Gateway — Semantic Routing y System Lifecycle Manager

**Estado:** PROPUESTO  
**Fecha:** 2026-04-17  
**Autor:** Indra Architecture Council  
**Reemplaza/Refactoriza:** `api_gateway.gs` (v4.x monolítico)  
**Relacionado con:** ADR-041 (Keychains), ADR-043 (Ledger/Identidad), ADR-051 (Relational Graph Mesh)

---

## 1. Contexto

El subsistema `api_gateway.gs` es el único punto de entrada HTTP del Core de Indra OS. Históricamente ha acumulado responsabilidades que pertenecen a capas distintas: validación de autenticación, decisión de estado del sistema, ruteo de protocolos e inicialización del ciclo de vida. Esta acumulación viola el Principio de Responsabilidad Única y convierte al gateway en un cuello de botella frágil.

### 1.1 Síntomas Observados

- **Array 0 persistente:** el frontend recibe respuestas vacías porque el gateway intercepta todos los protocolos antes de verificar si el sistema necesita bootstrapping parcial o total.
- **Paradoja de identidad:** el sistema bloquea el acceso porque no sabe quién es el dueño; pero no puede resolver quién es el dueño sin dejar pasar al menos un protocolo de inicialización.
- **Escalabilidad nula:** agregar un actor nuevo (un satélite, un frontend multi-usuario, un webhook externo) exige modificar el gateway directamente.
- **Rigidez del modelo de estado:** `isBootstrapped()` es un booleano. El sistema real tiene al menos cuatro estados de madurez.

### 1.2 Principio Violado

> **ADR-001, Axioma de Membrana:** "El gateway no produce ni consume datos de negocio. Solo valida el vector y enruta al orgánulo correcto."

El gateway actual produce lógica de negocio (inicialización del Ledger, construcción de respuestas de instalación) que no le corresponde.

---

## 2. Decisión

Se refactoriza el gateway en un **Protocol Firewall** de responsabilidad única, respaldado por tres servicios nuevos y una tabla de contratos declarativa. El gateway pasa a ser un **orquestador de válvulas**, no un tomador de decisiones.

### 2.1 Principio Rector

> **El gateway no debe saber qué hace ningún protocolo. Solo debe saber si el protocolo puede entrar.**

---

## 3. Arquitectura de la Solución

### 3.1 Diagrama de Componentes

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│      api_gateway.gs             │
│   (Protocol Firewall — Puro)    │
│                                 │
│  1. parse(request) → UQO        │
│  2. SystemStateManager.get()    │──→ [system_state_manager.gs]
│  3. ProtocolRegistry.resolve()  │──→ [protocol_registry.gs]
│  4. AuthService.authorize()     │──→ [auth_service.gs]
│  5. ProtocolRouter.dispatch()   │──→ [protocol_router.gs]
│  6. ResponseEnvelope.wrap()     │──→ [response_envelope.gs]
└─────────────────────────────────┘
           │
           ├──→ SystemOrchestrator  (SYSTEM_* protocols)
           ├──→ InstallationService (INSTALL_* protocols, state < ACTIVE)
           ├──→ LogicEngine / route() (business protocols)
           └──→ PulseInterceptor    (PULSE_* protocols)
```

### 3.2 Los Nuevos Servicios

#### A. `SystemStateManager` (reemplaza `isBootstrapped()`)

Calcula el **estado de madurez del sistema** de forma determinista y sin efectos secundarios.

```
Estado 0 — UNINITIALIZED  No hay propietario registrado. El sistema no sabe quién es.
Estado 1 — PROVISIONING   Propietario identificado. Ledger aún no cristalizado.
Estado 2 — ACTIVE         Sistema operativo completo. Ledger montado y accesible.
Estado 3 — FEDERATED      (Futuro) Múltiples núcleos activos, grafos distribuidos.
```

Esta función es **pura**: mismo input → mismo output. No tiene efectos secundarios.

#### B. `ProtocolRegistry` (reemplaza la lista estática + if/else del Orchestrator)

Una tabla de datos declarativa que define el **contrato de cada protocolo**:

```javascript
// Contrato por protocolo
{
  min_state: 0,          // Estado mínimo del sistema para ejecutar
  actors: ['ALL'],       // Tipos de identidad que pueden invocarlo
  requires_auth: false,  // ¿Requiere token/password?
  dispatcher: 'SYSTEM'   // A qué capa de despacho pertenece
}
```

#### C. `ResponseEnvelope` (reemplaza `_buildResponse_`)

Garantiza que **toda respuesta** del sistema tenga el contrato canónico:

```javascript
{ items: [], metadata: { status, state, core_id, core_version, timestamp } }
```

Independientemente del éxito o el error, el cliente conoce la forma del dato.

---

## 4. Tabla de Contratos de Protocolo (Protocol Registry)

| Protocolo | Estado Mínimo | Actores | Auth? | Dispatcher |
| :--- | :---: | :--- | :---: | :--- |
| `SYSTEM_MANIFEST` | 0 | ALL | No | SYSTEM |
| `SYSTEM_INSTALL_HANDSHAKE` | 0 | SOVEREIGN | No | INSTALL |
| `SYSTEM_CONFIG_WRITE` | 1 | SOVEREIGN | No* | INSTALL |
| `ATOM_READ` | 2 | SOVEREIGN, SATELLITE, GUEST | Sí | LOGIC |
| `ATOM_CREATE` | 2 | SOVEREIGN, SATELLITE | Sí | LOGIC |
| `ATOM_UPDATE` | 2 | SOVEREIGN, SATELLITE | Sí | LOGIC |
| `ATOM_DELETE` | 2 | SOVEREIGN | Sí | LOGIC |
| `SEARCH_DEEP` | 2 | SOVEREIGN, SATELLITE | Sí | LOGIC |
| `SYSTEM_KEYCHAIN_GENERATE` | 2 | SOVEREIGN | Sí | SYSTEM |
| `SYSTEM_KEYCHAIN_REVOKE` | 2 | SOVEREIGN | Sí | SYSTEM |
| `SYSTEM_KEYCHAIN_AUDIT` | 2 | SOVEREIGN, SATELLITE | Sí | SYSTEM |
| `SYSTEM_SHARE_CREATE` | 2 | SOVEREIGN | Sí | SYSTEM |
| `PULSE_WAKEUP` | 2 | SYSTEM_INTERNAL | No | PULSE |
| `SYSTEM_BATCH_EXECUTE` | 2 | SOVEREIGN, SATELLITE | Sí | SYSTEM |
| `SYSTEM_NEXUS_HANDSHAKE_INIT` | 2 | SOVEREIGN | Sí | SYSTEM |
| `EMERGENCY_INGEST_*` | 2 | SOVEREIGN, SATELLITE | Sí | SYSTEM |

*`SYSTEM_CONFIG_WRITE` en estado ≤ 1 usa el email de sesión activa como identidad, sin password.

---

## 5. Contratos de Identidad (Actor Types)

El `AuthService` resuelve cada UQO a uno de estos tipos:

| Tipo | Fuente | Privilegio | Alcance |
| :--- | :--- | :--- | :--- |
| `SOVEREIGN` | Session.getActiveUser() == owner | Absoluto | Todo |
| `SATELLITE` | `satellite_token` válido en Keychain | Delegado | Por scopes |
| `GUEST` | `share_ticket` válido | Público | Por contexto |
| `UNIDENTIFIED` | Ninguna validación exitosa | Ninguno | Solo estado 0 |

---

## 6. Patrones y Anti-patrones

### ✅ Patrones Recomendados

**Pattern 1: Table-Driven Dispatch**
La lógica de ruteo como datos, no como código. Agregar un protocolo = agregar una fila a la tabla, no escribir un `if` nuevo.

**Pattern 2: Fail-Fast con Envelope Estándar**
Cualquier error devuelve el envelope completo con `items: []` y `metadata.status: ERROR|BOOTSTRAP|UNAUTHORIZED`. El cliente nunca recibe `undefined`.

**Pattern 3: State Machine para el Ciclo de Vida**
`SystemStateManager` es una máquina de estados explícita. Cada transición tiene precondiciones verificables. No hay estados intermedios implícitos.

**Pattern 4: Single Responsibility por Archivo**
Cada gs-file = una sola responsabilidad. El gateway solo orquesta. El registro solo almacena contratos. El manejador de estado solo calcula el estado.

**Pattern 5: Pure Functions en Capas de Decisión**
`SystemStateManager.getState()` y `ProtocolRegistry.resolve()` son funciones puras. No tienen efectos secundarios. Son testeables de forma aislada.

### ❌ Anti-patrones a Evitar

**Anti-pattern 1: Logic in Gateway**
El gateway NO debe hacer llamadas a `LedgerService`, `DriveApp`, ni construir respuestas de negocio. Solo valida y delega.

**Anti-pattern 2: Implicit State via Booleans**
`isBootstrapped() === true/false` colapsa cuatro estados en dos. Produce los "Arrays 0" y los deadlocks de identidad.

**Anti-pattern 3: Protocol Hardcoding**
Nunca volver a escribir `if (protocol === 'SYSTEM_MANIFEST')` en el gateway. Toda la lógica de qué puede entrar vive en el `ProtocolRegistry`.

**Anti-pattern 4: Side Effects en Auth**
`AuthService.authorize()` no debe escribir en PropertiesService ni en el Ledger. Solo lee y devuelve un contexto.

**Anti-pattern 5: Acoplamiento Auth-State**
El gateway NO debe decidir el estado del sistema dentro del flujo de autenticación. Son dos preguntas distintas con respuestas independientes.

---

## 7. Restricciones Axiómaticas

Estas restricciones son invariantes del sistema. Violadas = el sistema es incoherente.

> **AX-052-1: Separación Absoluta de Capas**  
> El gateway nunca llama directamente a `SpreadsheetApp`, `DriveApp` ni `PropertiesService`. Toda interacción con persistencia ocurre a través de los servicios de capa 3.

> **AX-052-2: Contrato de Respuesta Universal**  
> Toda respuesta del sistema, exitosa o fallida, sigue el esquema `{ items: Array, metadata: Object }`. Un campo ausente es un bug de contrato, no de negocio.

> **AX-052-3: Inmutabilidad del ProtocolRegistry**  
> El registro de contratos es de solo lectura en tiempo de ejecución. No puede ser modificado por ningún protocolo del sistema, ni siquiera por el Soberano.

> **AX-052-4: Monotonía del Estado del Sistema**  
> `SystemStateManager` solo puede avanzar hacia estados más altos (0→1→2→3). El retroceso de estado solo ocurre por una operación explícita de `SYSTEM_RESET`, que es auditada en el Ledger.

> **AX-052-5: Identidad Anónima Prohibida en Estado 2+**  
> Un sistema en estado ACTIVE (2+) nunca responde a un actor `UNIDENTIFIED`. La única excepción es el Pulse Interceptor para latidos internos del sistema.

> **AX-052-6: Extensibilidad sin Modificación del Gateway**  
> Agregar soporte para un nuevo actor (satélite, API externa, webhook) no debe requerir modificar `api_gateway.gs`. Solo se añaden filas al `ProtocolRegistry` o nuevos casos al `AuthService`.

---

## 8. Plan de Migración (Sin Rotura)

La refactorización ocurre en capas, preservando la API pública del sistema:

```
Fase 1 (Mínima Viable — Soluciona Array 0):
  ├── Crear system_state_manager.gs
  ├── Crear protocol_registry.gs (solo protocolos existentes)
  └── Modificar doPost para usar SystemStateManager en lugar de isBootstrapped()

Fase 2 (Limpieza Estructural):
  ├── Extraer InstallationService de _handleBootstrap_
  ├── Crear response_envelope.gs
  └── Simplificar doPost a ~12 líneas

Fase 3 (Extensibilidad Plena):
  ├── Migrar SystemOrchestrator.dispatch() a table-driven
  ├── Preparar ProtocolRegistry para actores externos
  └── Documentar proceso para agregar nuevos protocolos sin tocar el gateway
```

---

## 9. Criterios de Aceptación

- [ ] `SYSTEM_MANIFEST` devuelve items con la configuración incluso cuando el sistema está en estado 0.
- [ ] `ATOM_READ` en estado 0 devuelve `{ items: [], metadata: { status: 'PROVISIONING_REQUIRED' } }` con código 200.
- [ ] Agregar un nuevo protocolo requiere solo modificar `protocol_registry.gs`.
- [ ] El gateway tiene ≤ 30 líneas efectivas en `doPost`.
- [ ] No hay ningún `if (protocol === '...')` en `api_gateway.gs`.
- [ ] `SystemStateManager.getState()` es una función pura sin efectos secundarios.

---

## 10. Referencias

- ADR-001: Data Contracts — Define el esquema `{ items, metadata }`.
- ADR-041: Satellite Keychains — Define el modelo de identidad delegada.
- ADR-043: Sheet Ledger & Identity Sovereignty — Define los estados de arranque.
- ADR-051: Relational Graph Mesh — Define el estado 3 (FEDERATED).
