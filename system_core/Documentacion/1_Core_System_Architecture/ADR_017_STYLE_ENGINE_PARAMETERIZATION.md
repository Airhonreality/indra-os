# ADR_017 — STYLE ENGINE & PARAMETERIZATION: Gobernanza Estética

> **Versión:** 1.0 (Dharma)  
> **Estado:** VIGENTE  
> **Relación:** Complemento de [ADR-004 (Design System)](./ADR_004_DESIGN_SYSTEM.md) y [ADR-005 (Resonancia)](./ADR_005_UI_RESONANCE.md).

---

## 1. CONTEXTO

En un sistema de grado industrial, la estética no debe ser estática ni dependiente de la voluntad del programador. INDRA requiere que la interfaz sea **viva y editable** sin tocar el código fuente. Para ello, se ha implementado un **Style Engine** que desacopla la definición visual de la estructura del componente.

## 2. DECISIÓN: ESTILOS COMO PARÁMETROS ATÓMICOS

Se establece que el diseño visual de INDRA es una consecuencia de la **Parametrización de Tokens CSS**.

### 2.1 El Global Style Engine (GSE)
El `StyleEngineSidebar` es el orquestador que permite la manipulación en tiempo real de los tokens. Su funcionamiento se basa en la **API de Propiedades de CSS** (`setProperty`), actuando directamente sobre `:root` o contenedores específicos.

### 2.2 Clasificación de Tokens
1.  **Tokens Canónicos (`--color-*`, `--space-*`)**: Definen la estructura basal del sistema (Solar Punk HUD). Son globales y persistentes.
2.  **Tokens Dinámicos (`--indra-dynamic-*`)**: Se inyectan en tiempo real según el átomo activo. Permiten que cada motor (Bridge, Schema, etc.) tenga su propia "Identidad Cromática" sin cambiar una sola línea de CSS.

### 2.3 El Vínculo con la Resonancia
Cuando se modifica un parámetro local (ej: `Universe Accent Identity`), el cambio es volátil hasta que el usuario activa el protocolo **SINCERAR IDENTIDAD**.
*   **Mecánica**: El GSE llama a `updateArtifact`, lo que dispara un `ATOM_UPDATE` hacia el Core.
*   **Resonancia**: Durante este proceso, el Panel de Estilos muestra el estado de "SINCERANDO..." y se bloquea siguiendo las leyes del [ADR-005](./ADR_005_UI_RESONANCE.md).

## 3. AXIOMAS DE GOBERNANZA VISUAL

1.  **Axioma de Neutralidad**: Ningún componente de UI de Nivel 2 o 3 puede definir colores sólidos en su CSS o JS. Deben referenciar variables dinámicas.
2.  **Axioma de Sinceridad Estética**: El color inyectado en el HUD debe ser el mismo color guardado en el objeto del Core. Cualquier discrepancia se considera "Entropía Visual".
3.  **Patrón del Contenedor Hueco**: El componente visual es daltónico. No sabe qué color tiene; solo sabe que debe brillar con la intensidad definida en `--color-accent`.

## 4. CONSECUENCIAS

*   **Integridad Visual**: No existen errores de diseño tras un rediseño, ya que todo el sistema escala armónicamente a través de los tokens.
*   **Permisividad IA**: Al estar documentado, cualquier agente sabe que para cambiar la apariencia de un módulo no debe tocar el CSS, sino interactuar con el `StyleEngine` o actualizar los parámetros del átomo en el `app_state`.
