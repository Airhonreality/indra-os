# Auditoría de Refactorización: Soberanía de Descubrimiento (V8.2)

## 1. Matriz de Dependencias en Riesgo

| Componente | Nivel de Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| **PublicAPI: _isWhitelisted** | 🔥 Crítico | Un error aquí bloquea todas las llamadas externas al Core. | Mantener un 'Failover Whitelist' para sistemas Tier 1 (Sensing, Cosmos). |
| **NotionAdapter** | 🧊 Bajo | Podría dejar de renderizar si el esquema no se marca como 'publico'. | Actualización del Canon en este ciclo. |
| **DriveAdapter** | 🧊 Bajo | Riesgo de regresión en el listado de archivos. | Verificación manual de la firma 'drive_listContents'. |
| **MCEP Core** | 🟡 Medio | La IA podría perder acceso a herramientas si el filtrado dinámico es muy estricto. | Sincronización de reglas entre MCEP y PublicAPI. |

---

## 2. Identificación de Código Zombie / Legacy

*   **Whitelist Hardcoded**: El array literal dentro de `_isWhitelisted` en `PublicAPI.gs`.
*   **Manual Bridge Mapping**: Los mapeos uno-a-uno en `SystemAssembler` (objetivo: pasar a inyección dinámica).
*   **Legacy Signatures**: Soporte para `action_payload` (pasando a `resolvedPayload`).

---

## 3. Factor Residual de la Operación

**Residuo Estimado: 5%**
El riesgo residual reside en la **Latencia de Inicialización**. En sistemas distribuidos muy grandes, un nodo podría reportarse como "vago" antes de haber poblado sus esquemas, causando un falso negativo de seguridad en el primer segundo de vida del sistema.

---

## 4. Checklist Arquitectónico (EL CANON)

Cualquier nuevo adaptador que desee integrarse de forma "Cero Fricción" debe cumplir:

1.  [ ] **Identidad**: Debe exportar un objeto con `archetype` (`VAULT`, `SERVICE`, `ENTITY`) y `domain`.
2.  [ ] **Contrato**: El objeto debe exponer un getter `schemas` que devuelva un mapa de capacidades.
3.  [ ] **Soberanía de Acceso**: Las capacidades destinadas al Frontend/IA deben tener `exposure: "public"`.
4.  [ ] **Agnosticismo**: No debe depender de la existencia de otros adaptadores (Aislamiento Total).
5.  [ ] **IO-Interface**: Debe definir `inputs` y `outputs` para validación estructural automática.

---
**Firmado bajo el Sello de Gravedad:**
*El Arquitecto de INDRA OS - Auditoría V8.2*





