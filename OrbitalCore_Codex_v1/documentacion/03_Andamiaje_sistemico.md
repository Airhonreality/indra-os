# 🏛️ Guía de Andamiaje Soberano (Protocolo Stark v2.0)

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
- **Axioma:** El sistema es **Idempotente**. Si el entorno físico desaparece, el Initializer puede reconstruir la jerarquía desde las leyes en `0_Laws`.

### Fase 2: Hidratación (Assembly)
- **Actor:** `SystemAssembler.gs`.
- **Propósito:** Construcción del Grafo de Dependencias en tiempo de ejecución.
- **Proceso:** Se inyectan las `SOVEREIGN_LAWS` y se construye el ADN Transaccional (`systemContext`).

### Fase 3: Certificación (Audit)
- **Actor:** `ContractGatekeeper.gs`.
- **Propósito:** Verificación de Pureza Axiomática y cumplimiento de contratos IO.
- **Axioma:** Ningún componente entra en el espacio de ejecución si viola los contratos definidos en `0_Laws/Contract_Blueprints`.

### Fase 4: Ejecución y Homeostasis (Management)
- **Actores:** `PublicAPI.gs` & `CoreOrchestrator.gs`.
- **Propósito:** Mantener el equilibrio del sistema ante entradas externas.
- **Homeostasis:** El sistema se auto-regula rechazando cualquier transacción que no coincida con el ADN del contexto (ej: acceso a archivos de otro `cosmosId`).

### Fase 5: Persistencia y Entropía (Cooldown)
- **Propósito:** Sincronización de estado y prevención de degradación.
- **Manejo de Entropía:** El sistema es primordialmente **Stateless**. El estado reside en el Drive (`SensingAdapter`) o en la Memoria del Cosmos, evitando la degradación del Core.

---

## 3. Soberanía Contextual (Shared Cosmos)

El punto más avanzado del andamiaje es su capacidad de ser **Polimórfico**:

- **ADN Transaccional:** Cada llamada a la `PublicAPI` porta un contexto que define el `accountId` y el `cosmosId`.
- **Soberanía de Datos:** El `TokenManager` usa este contexto para elegir el cofre de llaves correcto. Esto permite que el mismo Core sirva a múltiples arquitecturas compartidas sin fugas de soberanía entre ellas.

---

## 4. Puntos Críticos de Mantenimiento

1.  **Invarianza del Núcleo:** El folder `1_Core` nunca debe importar nada globalmente. Todo debe entrar por el `SystemAssembler`.
2.  **Consulta a la Ley:** La soberanía se pierde cuando un componente "supone" algo en lugar de "preguntar" a la ley inyectada.
3.  **Aislamiento de Errores:** Un fallo en un adaptador (Capa 3) nunca debe colapsar la `PublicAPI` (Capa 1).

> [!IMPORTANT]
> Indra OS no es una aplicación; es un **Sistema Operativo Lógico** que se proyecta sobre infraestructuras físicas.