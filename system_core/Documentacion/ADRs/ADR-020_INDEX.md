# 📚 ADR-020: Índice de Documentos

**Guía de navegación completa para la implementación del protocolo OAuth en workflows**

---

## 🗺️ Mapeo de Documentos

```
┌─────────────────────────────────────────────────────────┐
│           ADR-020: OAuth Handshake Stepwise             │
│              (Especificación técnica)                   │
│  ↓                                                      │
│  ├─ Problema: Workflows necesitan acceso a Drive user  │
│  ├─ Solución: Protocolos OAUTH_HANDSHAKE + RESUME     │
│  ├─ Ciclo de vida: UML sequences                       │
│  └─ Errors handled: 6 escenarios documentados          │
│                                                        │
├─────────────────────────────────────────────────────────┤
│  QUICK_START.md                                        │
│  (5 min read - comienzo aquí)                          │
│  ↓                                                      │
│  └─ Visual diagram, what you need to know, timeline   │
│                                                        │
├─────────────────────────────────────────────────────────┤
│  IMPLEMENTATION_STATUS.md                              │
│  (10 min read - resumen ejecutivo)                     │
│  ↓                                                      │
│  └─ Roadmap 3 fases, tasks by day, pre-requisites    │
│                                                        │
├─────────────────────────────────────────────────────────┤
│  IMPLEMENTATION_PLAN.md                                │
│  (30 min read - detalles de every task)               │
│  ↓                                                      │
│  ├─ Task 1.1-1.5: Backend detail + pseudocode        │
│  ├─ Task 2.1-2.6: Frontend detail + pseudocode       │
│  └─ Task 3.x: Validation + security + docs           │
│                                                        │
├─────────────────────────────────────────────────────────┤
│  APPROVAL_CHECKLIST.md                                 │
│  (Validation per phase)                                │
│  ↓                                                      │
│  ├─ Phase 1: 50 checkpoints backend                   │
│  ├─ Phase 2: 40 checkpoints frontend                  │
│  └─ Phase 3: 30 checkpoints validation + security    │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 Documentos Detallados

### 1️⃣ **ADR-020_OAUTH_HANDSHAKE_STEPWISE.md** (Especificación)

**¿Cuándo leer?**
- Necesitas entender el protocolo a fondo
- Buscas especificación técnica completa
- Duda sobre error handling o edge cases

**Secciones principales:**
- §1: Problema (por qué OAuth en workflows)
- §2: Solución (arquitectura general)
- §3: Protocolos OAUTH_HANDSHAKE + WORKFLOW_RESUME
- §4: Descriptor de Workflow (sintaxis DAG)
- §5: Ciclo de vida completo (UML sequences)
- §6: Casos de error (6 escenarios)
- §7: Fases de implementación (roadmap)

**Tiempo:** 20-30 min lectura  
**Output:** Comprensión 100% del qué y por qué

---

### 2️⃣ **ADR-020_QUICK_START.md** (Inicio Rápido)

**¿Cuándo leer?** ← **COMIENZA AQUÍ**
- Es tu primer encuentro con ADR-020
- Necesitas 5 minutos para entender la idea
- Quieres ver el flujo visual

**Secciones principales:**
- Tabla de documentos y tiempos de lectura
- Diagrama visual del flujo OAuth (ASCII art)
- Fase 1 Backend: 5 tareas resumidas
- Fase 2 Frontend: 6 tareas resumidas
- Fase 3 Validation: E2E test + security
- Testing strategy
- Timeline sugerido
- FAQ común

**Tiempo:** 5-10 min lectura  
**Output:** Entiende "qué hay que hacer"

---

### 3️⃣ **ADR-020_IMPLEMENTATION_STATUS.md** (Resumen Ejecutivo)

**¿Cuándo leer?**
- Necesitas ver el estado del proyecto
- Quieres plan de 3 fases visualizado
- Buscas "qué empieza primero"

**Secciones principales:**
- Roadmap: 3 fases (Gantt-style)
- Fase 1 detalles (5 tareas por día)
- Riesgos identificados + mitigación
- Pre-requisitos Fase 1
- Testing strategy breve
- Cómo comenzar (opciones A/B)

**Tiempo:** 10-15 min lectura  
**Output:** Comprensión de timeline + decisiones de implementación

---

### 4️⃣ **ADR-020_IMPLEMENTATION_PLAN.md** (Detalles Técnicos)

**¿Cuándo leer?**
- Estás DURANTE la implementación
- Necesitas pseudocódigo para una tarea
- Buscas integration points específicos

**Secciones principales:**
- **Fase 1 (4-5 días):**
  - Task 1.1: `oauth_handler.js` (pseudocódigo 90-120 líneas)
  - Task 1.2: `provider_system_logic.js` (50 líneas mod)
  - Task 1.3: `workflow_executor.js` (150-200 líneas)
  - Task 1.4: `provider_drive.js` (80-100 líneas)
  - Task 1.5: OAuth credentials setup
  
- **Fase 2 (4-5 días):**
  - Task 2.1-2.6: Frontend components + hooks + endpoint
  
- **Fase 3 (2-3 días):**
  - E2E test, security, documentation

**Tiempo:** 30+ min (lectura referencial)  
**Output:** Pseudocódigo listo para implementar cada task

---

### 5️⃣ **ADR-020_APPROVAL_CHECKLIST.md** (Validación)

**¿Cuándo usar?**
- Terminaste una tarea y necesitas validar
- Antes de pasar a siguiente fase
- Necesitas lista de "qué probar"

**Secciones principales:**
- Pre-requisitos (antes de empezar)
- Fase 1 checklist: 50 puntos de validación
- Fase 2 checklist: 40 puntos de validación
- Fase 3 checklist: 30 puntos de validación
- Signature/approval boxes

**Tiempo:** Referencial (uso durante implementation)  
**Output:** Confirmación de que task está 100% completo

---

## 🎯 Flujo de Lectura Recomendado

### Día 1: Entendimiento

```
T1: Lees QUICK_START.md (5 min)
    ↓
T2: Lees ADR-020_OAUTH_HANDSHAKE_STEPWISE.md (20 min)
    ↓
T3: Lees IMPLEMENTATION_STATUS.md (10 min)
    ↓
OUTPUT: Entiendes el "qué" y "por qué"
```

### Día 2: Planificación

```
T1: Lees IMPLEMENTATION_PLAN.md - Fase 1 (20 min)
    ↓
T2: Lees APPROVAL_CHECKLIST.md - Phase 1 (15 min)
    ↓
T3: Preparas ambiente (Google OAuth credentials setup)
    ↓
OUTPUT: Listo para comenzar implementación
```

### Días 3+: Implementación

```
X: Implementas tarea 1.1 (oauth_handler.js)
    ↓
Consultas: IMPLEMENTATION_PLAN.md #Tarea 1.1 (pseudocódigo)
Validas: APPROVAL_CHECKLIST.md Phase1 / oauth_handler.js section
    ↓
Y: Implementas tarea 1.2, 1.3, 1.4, ...
    (mismo patrón)
    ↓
Z: Fase completada → Validación general vs APPROVAL_CHECKLIST.md
```

---

## 🔍 Búsqueda Rápida

### "¿Dónde está el pseudocódigo de kafka_handler.js?"
→ IMPLEMENTATION_PLAN.md #Tarea 1.1

### "¿Qué errores puede ocurrir en OAuth?"  
→ ADR-020.md #Sección 6 (Casos de error)

### "¿Cuáles son los pre-requisitos?"
→ IMPLEMENTATION_STATUS.md #Pre-requisitos

### "¿Cómo se valida que Fase 1 está completo?"
→ APPROVAL_CHECKLIST.md #Phase 1 Completion

### "¿Cuál es el timeline?"
→ IMPLEMENTATION_STATUS.md #Fase 1 Detalles por Día

### "¿Qué protocolo se usa para pausar el workflow?"
→ ADR-020.md #Sección 3.1 OAUTH_HANDSHAKE

### "¿Cómo se inyecta el token en steps posteriores?"
→ ADR-020.md #Sección 4.2 Evaluación de use_oauth_token

---

## 📊 Documentos por Rol

### 👨‍💼 Project Manager

**Lee en este orden:**
1. QUICK_START.md (5 min)
2. IMPLEMENTATION_STATUS.md (10 min)
3. APPROVAL_CHECKLIST.md (10 min)

**Output:** Timeline, fases, checkpoints

---

### 🧑‍💻 Backend Developer (GAS)

**Lee en este orden:**
1. QUICK_START.md (5 min)
2. ADR-020.md (20 min) - secciones 1-5
3. IMPLEMENTATION_PLAN.md - Fase 1 (20 min)
4. APPROVAL_CHECKLIST.md - Phase 1 (10 min)

**Output:** Implementa Tasks 1.1-1.5 usando pseudocódigo

---

### 🎨 Frontend Developer (React)

**Lee en este orden:**
1. QUICK_START.md (5 min)
2. ADR-020.md (20 min) - secciones 1-3
3. IMPLEMENTATION_PLAN.md - Fase 2 (20 min)
4. APPROVAL_CHECKLIST.md - Phase 2 (10 min)

**Output:** Implementa Tasks 2.1-2.6 usando pseudocódigo

---

### 🔒 Security Reviewer

**Lee en este orden:**
1. ADR-020.md (completo)
2. IMPLEMENTATION_PLAN.md - Fase 3 Security section (10 min)
3. APPROVAL_CHECKLIST.md - Phase 3 (10 min)

**Output:** Security validations para CSRF, token TTL, scopes

---

### ✅ QA Engineer

**Lee en este orden:**
1. QUICK_START.md (5 min)
2. APPROVAL_CHECKLIST.md (todo el documento)
3. IMPLEMENTATION_PLAN.md - Secciones de Testing (referencial)

**Output:** Test plans y validación de cada checkpoint

---

## 📂 Localización en Workspace

```
system_core/
├── Documentacion/
│   └── ADRs/
│       ├── ADR-020_OAUTH_HANDSHAKE_STEPWISE.md
│       ├── ADR-020_QUICK_START.md
│       ├── ADR-020_IMPLEMENTATION_STATUS.md
│       ├── ADR-020_IMPLEMENTATION_PLAN.md
│       ├── ADR-020_APPROVAL_CHECKLIST.md
│       └── ADR-020_INDEX.md  ← Este archivo
│
├── core/
│   ├── oauth_handler.js  ← Será creado (Tarea 1.1)
│   ├── workflow_executor.js  ← Será modificado (Tarea 1.3)
│   ├── 2_providers/
│   │   ├── oauth_handler.js  ← Será creado (Tarea 1.1)
│   │   └── provider_drive.js  ← Será modificado (Tarea 1.4)
│   └── 1_logic/
│       ├── provider_system_logic.js  ← Será modificado (Tarea 1.2)
│       └── workflow_executor.js  ← Será modificado (Tarea 1.3)
│
└── client/
    └── src/
        ├── components/
        │   ├── OAuthPopup.jsx  ← Será creado (Tarea 2.1)
        │   ├── OAuthCallback.jsx  ← Será creado (Tarea 2.2)
        │   └── WorkflowRunner.jsx  ← Será modificado (Tarea 2.4)
        ├── hooks/
        │   ├── useOAuth.js  ← Será creado (Tarea 2.3)
        │   └── useWorkflow.js  ← Será modificado (Tarea 2.5)
        └── services/
            └── workflowService.js  ← Será modificado (Tarea 2.6)
```

---

## 🚀 Siguientes Pasos

1. **Lee QUICK_START.md** (5 min, esta sesión)
2. **Lee ADR-020.md** (20 min, hoy)
3. **Lee IMPLEMENTATION_STATUS.md** (10 min, hoy)
4. **Setup Google OAuth credentials** (30 min, hoy)
5. **Kickoff Fase 1** (mañana o cuando estés listo)

---

## 📞 Soporte

Si durante lectura tienes preguntas:
- Referencia el documento donde surgió la duda
- Código específico? → Ve a IMPLEMENTATION_PLAN.md
- Conceptos? → Ve a ADR-020.md
- Timeline? → Ve a IMPLEMENTATION_STATUS.md
- Validación? → Ve a APPROVAL_CHECKLIST.md

---

**Creado:** 2026-03-21  
**Status:** 📋 Index completo, listo para navegación  
**Siguiente lectura recomendada:** QUICK_START.md ← Comienza aquí! 🚀
