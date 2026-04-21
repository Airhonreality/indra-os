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
5.  **PROHIBIDO: Hardcoding de Tipos en Motores.** Ningún Macro-Motor (AEE, Designer) debe contener lógica de renderizado específica (`switch/case`) para tipos de datos (inputs, fechas, imágenes). Se DEBE delegar el renderizado a un **ComponentMapper** y a **Widgets especializados**.
6.  **PROHIBIDO: Fuga de Infraestructura.** Ningún componente visual (Layout, Card, Widget) tiene permitido recibir `coreUrl` o `sessionSecret` vía props. Estos secretos están restringidos a la capa del **Bridge**.

---

## 🏛️ 2. EL PATRÓN "HOLLOW COMPONENT" (Componente Hueco)

Un componente de INDRA es una **Cáscara Visual Agnóstica**. Su única función es renderizar la proyección entregada por el `DataProjector`.

*   **Identidad**: El componente recibe un objeto `atom` crudo.
*   **Proyección**: Llama inmediatamente a `DataProjector.projectArtifact(atom)`.
*   **Soberanía (Aduana UI)**: Los widgets finales actúan como **Agentes de Aduana** (ADR-008). Deben validar activamente el dato (tamaño, formato, regex) en el cliente antes de permitir que la información viaje al Core. No se permite delegar validaciones básicas exclusivamente al backend.
*   **Resonancia**: Debe ser sensible al atributo `data-resonance` inyectado por su orquestador. Si el orquestador lo marca como `active`, el componente se "apaga" por ley física de CSS.

---

## 🛸 3. LEY DE LA MEMBRANA (Agnostic Bridge)

La comunicación entre niveles debe ser **Mediadora, no Directa**.

1.  **Independencia de Red**: Los componentes invocan servicios mediante `bridge.execute(uqo)`. La UI no sabe dónde vive el Core, solo sabe qué desea pedirle.
2.  **Cripta de Datos (Vault)**: Toda información estructural recuperada (esquemas, árboles de archivos) debe pasar por el `AgnosticVault`. El componente primero consulta la cripta y solo después solicita a la red (Resonancia Silenciosa).

---

## 🧬 4. AXIOMA DEL AUTODIBUJADO (Schema Forms)

La creación de interfaces de configuración (Modals de Setup, Nexus Control) no debe ser artesanal.

*   **Proyección del Contrato**: La UI se genera automáticamente recorriendo el objeto `metadata.schema.fields` entregado por el Core.
*   **Nexus Control**: El mapeo de propiedades (ej: vincular campos de Notion a columnas de Sheets) es dinámico. Si el Core añade un campo al esquema, la UI **debe dibujarlo automáticamente** sin intervención de código React.

---

## 🏛️ 5. CONTRATOS TÉCNICOS (Determinismo)

Cualquier arquitectura de UI nueva debe cumplir con el esquema definido en:  
[ui_contracts.json](./ui_contracts.json)

| Realidad | Atributo Requerido | Valor Esperado | Consecuencia en CSS |
| :--- | :--- | :--- | :--- |
| **Materia (Sync)** | `data-resonance` | `"active" | "idle"` | Opacidad 0.5 + Bloqueo Total |
| **Navegación (Hover)** | `data-highlighted` | `"true" | "false"` | Opacidad 0.7 + Escala de Grises |

---

## 🛠️ 6. PROTOCOLO DE AUDITORÍA PARA AGENTES

1.  [ ] ¿Mi componente delega la opacidad de carga al CSS global?
2.  [ ] ¿He eliminado todo rastro de secretos de infraestructura (`coreUrl`, `secret`) de mis props?
3.  [ ] ¿Estoy usando el **Bridge** para despachar directivas?
4.  [ ] ¿Mi formulario se autoconstruye iterando sobre el `schema.fields`?
5.  [ ] ¿He implementado la "Aduana" (validación) en el widget de entrada?
6.  [ ] ¿Estoy consultando el `AgnosticVault` antes de disparar un fetch innecesario?

**Si cualquiera de estos puntos es "NO", la implementación es ARTESANAL y será rechazada.**
