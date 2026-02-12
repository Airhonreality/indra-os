# 🧪 Guía de Pruebas para Desarrolladores (Dev-Test Protocol)

Esta guía define qué suites de pruebas ejecutar según la parte del sistema que estés modificando. El objetivo es mantener la **Pureza Axiomática** y evitar regresiones en el sub-suelo.

## 1. Escenarios de Pruebas

| Acción del Desarrollador | Suite a Ejecutar | Propósito |
| :--- | :--- | :--- |
| **Añadir/Modificar un Adapter** | `ContractCompliance.spec.js` | Verifica que los esquemas IO cumplan con el estándar industrial del Core. |
| **Modificar Leyes (0_Laws)** | `RunSovereigntyTests()` | Asegura que las 7 leyes sigan presentes, alineadas y jerárquicamente correctas. |
| **Refactorizar el MCEP / IA** | `MCEPCognitiveLoop.spec.js` | Valida que la traducción de leyes a "digestas cognitivas" para la IA no se haya roto. |
| **Cambios en SystemAssembler** | `StructuralIntegrity.spec.js` | Verifica que el grafo de dependencias (DI) se construya sin bucles ni nulos. |
| **Refactorización General** | `RunAllTests.gs` | El juicio final. Ejecuta todas las capas (Infra, Adapters, Services, Core). |

---

## 2. Cómo interpretar los Logs

Los tests de Indra OS están diseñados para ser **informativos, no poéticos**:

- **`✅` (Pass):** El componente es axiomáticamente puro.
- **`🚨 GAP DETECTED`:** Hay una inconsistencia entre lo que dice la Ley (`0_Laws`) y lo que hace el código. *Solución: Sincroniza el esquema en el Blueprint.*
- **`🛑 [ARCHITECTURAL_HALT]`:** Error crítico de cableado. El sistema ha bloqueado el arranque para proteger la integridad.

---

## 3. Comandos Rápidos (GAS Editor)

1.  **Para verificar la salud legal:** Selecciona la función `RunSovereigntyTests` en el archivo `Sovereignty_Tests.gs` y presiona Ejecutar.
2.  **Para un chequeo completo de regresión:** Selecciona la función `RunAllTests` en el archivo `RunAllTests.gs`.

> [!IMPORTANT]
> **Regla de Oro:** Nunca hagas un `clasp push` si `ContractCompliance` reporta deudas técnicas superiores al 0%. La soberanía no admite excepciones.
