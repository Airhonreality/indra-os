# 🏛️ Guía de Andamiaje Soberano (Protocolo Stark v5.5)

Esta guía define los principios técnicos, estructurales y filosóficos que permiten que Indra OS funcione como un **Sistema Soberano Polimórfico**.

## 1. Fundamentos del Diseño (Auditoría Suh & TGS)

El sistema se rige por la **Teoría General de Sistemas (TGS)** y el **Diseño Axiomático de Suh**:

### A. Totalidad y Equifinalidad (TGS)
- **Wholeness:** El sistema no es solo código; es la tríada `Leyes - Núcleo - Contexto`. Ninguna parte tiene sentido sin las otras dos.
- **Equifinalidad:** El sistema puede alcanzar el mismo estado de ejecución pura desde diferentes orígenes físicos (Google Drive, Notion, JSON externos) gracias a su naturaleza agnóstica.

### B. Independencia y Mínima Información (Suh)
- **Independencia Funcional:** La lógica de ejecución (Adapters) está desacoplada de la lógica de identidad (`systemContext`). Puedes cambiar *quién* opera sin alterar *cómo* se opera.
- **Minimización de Información:** Los componentes solo conocen lo estrictamente necesario. Un adapter no sabe que existe un `PropertiesService`; solo sabe que recibe un `TokenManager`.

---

## 2. El Ciclo de Vida del Framework (The Life-Flow)

El andamiaje no es estático; se despliega en fases críticas:

### Fase 1: Ignición (Bootstrapping)
- **Actor:** `SystemInitializer.gs`.
- **Propósito:** Localización de la "Semilla" física (`ORBITAL_ROOT`) y configuración de infraestructura.
- **Axioma:** El sistema es **Idempotente**. Si el entorno físico desaparece, el Initializer reconstruye la jerarquía basándose en el `DRIVE_SCHEMA` de L0.

### Fase 2: Hidratación y Decoración Ontológica
- **Actor:** `SystemAssembler.gs`.
- **Propósito:** Construcción del Grafo de Dependencias y **Asignación de Identidad**.
- **Proceso:** Se inyectan las `SOVEREIGN_LAWS`. El Assembler decora cada componente utilizando el `COMPONENT_REGISTRY` de L0, otorgándole un label canónico y un rol arquitectónico antes de su ignición.

### Fase 3: Certificación (Audit)
- **Actor:** `ContractGatekeeper.gs`.
- **Propósito:** Verificación de Pureza Axiomática y cumplimiento de contratos STARK.
- **Axioma:** Ningún componente entra en el espacio de ejecución si viola los contratos definidos en `0_Laws` o si sus llaves no cumplen el estándar `UPPER_CASE`.

### Fase 4: Ejecución y Homeostasis (Gestión)
- **Actores:** `PublicAPI.gs` & `CoreOrchestrator.gs`.
- **Propósito:** Mantener el equilibrio del sistema ante entradas externas.
- **Homeostasis:** El sistema se auto-regula rechazando cualquier transacción que no coincida con el ADN del contexto (ej: acceso a archivos de otro `spaceId`).

### Fase 5: Persistencia y Entropía (Cooldown)
- **Propósito:** Sincronización de estado y prevención de degradación.
- **Manejo de Entropía:** El sistema es primordialmente **Stateless** (Sin Estado). El estado reside en el Drive (`SensingAdapter`) o en la Memoria del Sistema, evitando la degradación del Core.

---

## 3. Soberanía Contextual (Espacio Soberano Compartido)

El punto más avanzado del andamiaje es su capacidad de ser **Polimórfico**:

- **ADN Transaccional:** Cada llamada a la `PublicAPI` porta un contexto que define el `accountId` y el `spaceId`.
- **Soberanía de Datos:** El `TokenManager` usa este contexto para elegir el cofre de llaves correcto. Esto permite que el mismo Core sirva a múltiples arquitecturas compartidas sin fugas de soberanía entre ellas.

---

## 4. La Revolución Ontológica (Soberanía Lexical)

A partir de la v5.5-STARK, el sistema impone la **Soberanía Lexical**:

1.  **L0 como Diccionario**: El Front-End ya no define qué es un "Notion Adapter". Lo descubre consultando el `COMPONENT_REGISTRY` en el Core. 
2.  **Traducción Translúcida**: El Core provee la identidad canónica (Inglés Técnico). El Front-End es meramente una capa de visualización que aplica diccionarios locales si existen, pero la "verdad" de la identidad reside en L0.
3.  **STARK Keys**: Todos los parámetros de configuración y secretos se rigen por llaves en `UPPER_CASE` para evitar colisiones y garantizar legibilidad industrial.

---

## 5. Puntos Críticos de Mantenimiento

1.  **Invarianza del Núcleo:** El folder `1_Core` nunca debe importar nada globalmente. Todo debe entrar por el `SystemAssembler`.
2.  **Consulta a la Ley:** La soberanía se pierde cuando un componente "supone" algo en lugar de "preguntar" a la ley inyectada.
3.  **Aislamiento de Errores:** Un fallo en un adaptador (Capa 3) nunca debe colapsar la `PublicAPI` (Capa 1).

> [!IMPORTANT]
> Indra OS no es una aplicación; es un **Sistema Operativo Lógico** que se proyecta sobre infraestructuras físicas.