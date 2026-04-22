# INDRA SATELLITE PROTOCOL: El Manifiesto de la Resonancia Industrial (v15.0)

## 🪐 La Filosofía del Satélite Soberano
En Indra v15.0, el Satélite evoluciona de ser un cliente pasivo a un **Nodo de Resonancia Inteligente**. El satélite ya no es ciego; conoce sus silos físicos y orquestra su propia realidad con determinismo absoluto.

### 🧬 Axioma 1: El ADN es Código Vivo (JS-Native)
El ADN (Esquemas y Workflows) ya no son datos inertes almacenados en JSON. Son **Módulos ES nativos**.

### 🧬 Axioma 2: Resonancia en Vivo (Latencia Cero)
El satélite puede sincronizar su estado directamente con el Core de Indra sin intermediarios.

 ---

## 🛠️ Protocolos de Infraestructura (Agnosticismo Crítico)

### 1. Ciclo de Vida Reactivo (Chasis Primero, Gasolina Después)
Para evitar la "falla de pantalla en blanco", la arquitectura del satélite debe ser asíncrona.

*   **Estados de Resonancia (`bridge.status`)**:
    *   `GHOST`: El motor está apagado o sin identidad. La UI debe mostrar el chasis base.
    *   `IGNITING`: El motor está negociando con el Core. La UI debe mostrar estados de carga (skeletons/spinners).
    *   `READY`: El nexo es estable. Los datos se hidratan en los componentes.
    *   `ERROR`: Colapso de resonancia. La UI debe reportar el fallo.

*   **Suscripción segura (`bridge.onReady(cb)`)**:
    Es el estándar para ejecutar lógica de negocio. Si el bridge ya está listo al llamar a este método, el callback se ejecuta al instante. Si no, se encola hasta que la ignición complete.

### 2. `SYSTEM_MANIFEST` (El Oráculo)
Antes de realizar cualquier acción, el Satélite **debe** consultar sus capacidades a través de `bridge.capabilitiesOracle`.

### 3. Protocolo de Ignición Cooperativa (Soberanía de Proveedores)
1.  **`ATOM_CREATE`**: Envía el blueprint al Core. Devuelve un `ID`.
2.  **`SYSTEM_SCHEMA_IGNITE`**: Materializa la infraestructura física. **OBLIGATORIO**: Usar `target_provider: 'sheets'` para materia tabular.

### 4. Enrutamiento por Identidad (Determinismo)
Queda prohibido el uso de alias genéricos en el Core. El Satélite debe usar `bridge.resolveSilo(alias)` para obtener la identidad real antes de la ejecución.

Consulte [TECHNICAL_HANDSHAKE.md](./TECHNICAL_HANDSHAKE.md) para ejemplos de implementación.

 ---

## 🛡️ La Aduana y el Fail-Fast
Cada instrucción lleva un `trace_id`. El sistema de Indra opera bajo el **Axioma de Falla Ruidosa**: cualquier violación del contrato o intento de cruce de celdas resultará en un colapso controlado para proteger el Ledger.

**Indra no almacena datos; orquestas realidades a través de código vivo.** 🛰️💎🔥

