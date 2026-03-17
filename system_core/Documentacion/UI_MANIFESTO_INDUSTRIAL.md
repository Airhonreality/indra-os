# 📜 MANIFIESTO DE UI INDUSTRIAL (Constitución de INDRA)

> **Versión:** 1.0 (Dharma)  
> **Objetivo:** Eliminar la ambigüedad en la creación de interfaces y garantizar la industrialización absoluta del Nivel 2 y 3.
> **Audiencia:** Agentes de IA y Desarrolladores Expertos.

---

## 🚫 1. LEYES DE EXCLUSIÓN (Axiomas Negativos)

Para que un código visual sea aceptado en INDRA, **NO** debe contener los siguientes patrones de entropía:

1.  **PROHIBIDO: Gestión de Carga en Componente.** Ningún Glif, Chassis o Card debe definir un estado interno de `loading` para sincronización con el Core. La carga es una propiedad del **Campo de Resonancia** gestionado por el padre.
2.  **PROHIBIDO: Estilos Inline para Estados.** Queda terminantemente prohibido usar `style={{ opacity: 0.5 }}` o similares para indicar bloqueo o relaciones. Se DEBE delegar al motor de CSS mediante `data-attributes`.
3.  **PROHIBIDO: Hardcoding de Colores.** No se permiten valores Hex, RGB o nombres de colores CSS. Se deben usar estrictamente los tokens: `var(--color-...)` o `var(--indra-dynamic-...)`.
4.  **PROHIBIDO: Datos Ficticios.** No se permite inventar campos como `_inputs` o `linkedTo`. El sistema debe mapear relaciones basadas en el contrato real: `payload.sources` y `_origin`.

---

## 🏛️ 2. EL PATRÓN "HOLLOW COMPONENT" (Componente Hueco)

Un componente de INDRA es una **Cáscara Visual Agnóstica**. Su única función es renderizar la proyección entregada por el `DataProjector`.

*   **Identidad**: El componente recibe un objeto `atom` crudo.
*   **Proyección**: Llama inmediatamente a `DataProjector.projectArtifact(atom)`.
*   **Soberanía**: No toma decisiones operativas. Si hay un clic, emite un evento o llama a una función del `app_state.js`.
*   **Resonancia**: Debe ser sensible al atributo `data-resonance` inyectado por su orquestador. Si el orquestador lo marca como `active`, el componente se "apaga" por ley física de CSS.

---

## 🧬 3. CONTRATOS TÉCNICOS (Determinismo)

Cualquier arquitectura de UI nueva debe cumplir con el esquema definido en:  
[ui_contracts.json](./ui_contracts.json)

| Realidad | Atributo Requerido | Valor Esperado | Consecuencia en CSS |
| :--- | :--- | :--- | :--- |
| **Materia (Sync)** | `data-resonance` | `"active" \| "idle"` | Opacidad 0.5 + Bloqueo Total |
| **Navegación (Hover)** | `data-highlighted` | `"true" \| "false"` | Opacidad 0.7 + Escala de Grises |

---

## 🛠️ 4. PROTOCOLO DE AUDITORÍA PARA AGENTES

Antes de sugerir o implementar un cambio en la UI, todo agente DEBE realizar este checklist:

1.  [ ] ¿Mi componente delega la opacidad de carga al CSS global?
2.  [ ] ¿He eliminado todo rastro de estilos inline para estados lógicos?
3.  [ ] ¿Estoy usando `sources` en lugar de campos inventados para las relaciones?
4.  [ ] ¿He envuelto mis tarjetas en un orquestador que inyecte `data-resonance`?

**Si cualquiera de estos puntos es "NO", la implementación es ARTESANAL y será rechazada.**
