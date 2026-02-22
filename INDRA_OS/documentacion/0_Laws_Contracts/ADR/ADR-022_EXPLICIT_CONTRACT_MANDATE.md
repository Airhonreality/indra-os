# ADR-022: Mandato de Contrato Explícito (Zen V14 Canon)

**Status:** VIGENTE / CANONIZADO  
**Versión:** 1.1 — Zen Final Simplification  
**Fecha:** 2026-02-22  
**Relación:** Protocolo V14 (Canon Supremo), ADR-003 (Snapshots)

---

## 1. Contexto

El sistema ha evolucionado de un modelo heurístico (basado en regex e inferencias) a un modelo de **Soberanía Contractual**. Se detectaron fallas de "ceguera" en el `Law_Compiler` al intentar interpretar envoltorios de red (Envelopes) como si fueran parte de la estructura semántica de los datos.

---

## 2. Decisión: El Canon V14

### 2.1 Prohibición de Inferencia (Zero Heuristics) — ADR-022-A
Ningún subsistema (Store, Lóbulos, Motores) tiene permiso para "interpretar" o "adivinar" el significado de un dato. La verdad reside única y exclusivamente en el **CANON** emitido por el adaptador en el Core.
- Si el `io` no está declarado, se bloquea la acción.
- Si el `ARCHETYPE` es nulo, el objeto es materia inerte.

### 2.2 Unificación de Retornos (The Return Law) — ADR-022-B
Cada comando ejecutado en el Core debe emitir un `return` canónico. El Frontend confía plenamente en este retorno. Se elimina la capa de "Excavación Semántica" en favor de una **Proyección Directa**.

### 2.3 Estructura de Capas Canónica (Axiomatic Hierarchy) — ADR-022-C
El sistema se organiza en capas numeradas que reflejan la profundidad de la consciencia:
- **Capa 1: Axiomatic Store** (Persistencia, Continuidad, Memoria de Hierro).
- **Capa 2: Semantic Transformation** (Reificación, Proyección de Leyes, Law Compiler).
- **Capa 3: Projection Engines** (Visualización, Interacción, Grafo).

---

## 3. El Transformador Semántico (Law Compiler) en V14

El `Law_Compiler` deja de ser un "Alquimista" que transmuta metales en oro. Ahora es un **Anfitrión de Datos**:
1. Recibe el `return` del adaptador (La Médula).
2. Valida la Identidad Triatómica (`id`, `ARCHETYPE`, `DOMAIN`).
3. Inyecta el Esmalte Visual (Iconografía y Layout).

---

## 4. Consecuencias

### Positivas
- **Inmunidad al Transporte**: El sistema no se rompe si el JSON cambia de estructura externa (Envelopes), porque el compilador busca la médula canónica.
- **Acoplamiento Zero**: Añadir nuevas capacidades al Core no requiere tocar una sola línea de lógica en el Frontend.

### Negativas
- El desarrollador del Core tiene la carga total de la verdad; un error en el `return` del adaptador es un error garantizado en el Frontend.

---
*Firmado bajo el Sello de Verdad Viva: AXIOM_ARCHITECT — V14 Canon*

