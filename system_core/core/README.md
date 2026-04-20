# INDRA OS CORE: El Núcleo Soberano

> "En la sinceridad de la materia y la independencia del diseño reside la libertad del sistema."

Este documento detalla la arquitectura axiomática de Indra OS, un motor de orquestación de datos diseñado bajo los principios de la **Teoría General de Sistemas (TGS)** y el **Diseño Axiomático de Suh**.

---

## 1. Arquitectura de Capas (Diferenciación Orgánica)

Indra se organiza en 4 estratos de responsabilidad, donde la información fluye de forma centrífuga desde el Gateway hasta la Infraestructura.

### Capa 0: Gateway & Registry (`0_gateway/`)
- **Responsabilidad**: Interfaz de entrada única y registro de capacidades.
- **RF (Requerimiento Funcional)**: Validar la autenticidad de la petición y despacharla al Router.
- **DP (Parámetro de Diseño)**: `protocol_registry.gs`.
- **Restricción**: No debe contener lógica de negocio. Es una membrana semipermeable.

### Capa 1: Lógica & Orquestación (`1_logic/`)
- **Responsabilidad**: Despacho determinista de protocolos y orquestación de flujos (Inducción).
- **RF**: Garantizar que cada protocolo sea atendido por un handler físico verificado.
- **DP**: `protocol_router.gs` y `induction_orchestrator.gs`.
- **Axioma**: **Independencia Funcional**. Una decisión en el router no debe afectar la persistencia física.

### Capa 2: Proveedores e Infraestructura (`2_providers/`)
- **Responsabilidad**: Gestión de la materia física (Drive, Notion, etc.) y persistencia.
- **Silos de Infraestructura**:
    - `infra_persistence`: CRUD Atómico.
    - `infra_identity`: Soberanía de nombres y alias.
    - `infra_workspaces`: Génesis y descubrimiento físico.
- **Restricción**: **Estatismo Puro**. Ningún provider puede mutar el estado global (PropertiesService) directamente sin pasar por un protocolo de orquestación.

### Capa 3: Servicios & Extensiones (`3_services/`)
- **Responsabilidad**: Capacidades avanzadas (Keychain, Resonance, Intelligence).
- **RF**: Proveer servicios de valor añadido sobre los átomos existentes.
- **Axioma**: **Acoplamiento Débil**. Los servicios deben ser "enchufables" y no críticos para el arranque del sistema.

---

## 2. Análisis Axiomático (Suh)

### Axioma 1: Independencia de Contenido
Cada handler de protocolo debe ser funcionalmente independiente. La modificación de la lógica de "Rename" en Identidad no debe requerir cambios en el handler de "Create" en Persistencia.

### Axioma 2: Sinceridad de la Materia (Anti-Ledger)
El sistema confía en la realidad física (Drive) antes que en el estado virtual (Base de datos). 
- **Restricción**: El "Ghost ID" está estrictamente prohibido. Si un archivo no existe en Drive, no existe en Indra.

### Axioma 3: El Dharma de Errores
El error es una información soberana.
- **Restricción**: Todo fallo debe retornar un átomo de tipo `INDRA_ERROR` con `recovery_hint`. El silencio administrativo es una falla sistémica.

---

## 3. Parámetros de Calidad y Validación

El sistema cuenta con una **Suite de Auditoría Local** (Node.js) que garantiza:
1. **Resonancia (Oracle)**: 100% de los protocolos ruteados a handlers existentes.
2. **Duplicidad**: 0 colisiones en el espacio de nombres global.
3. **Contrato**: Validación rigurosa de UQO (Universal Query Object) y cumplimiento de la Ley de Retorno.

---

## 4. Guía de Evolución
Para añadir un nuevo protocolo al sistema:
1. Registre el protocolo en `protocol_registry.gs`.
2. Asigne el handler en `protocol_router.gs`.
3. Implemente el handler en el Silo correspondiente de `2_providers/`.
4. valide con `node infra_oracle.js`.

---
*Indra OS - Hacia una tecnología axiomáticamente sincera.*
