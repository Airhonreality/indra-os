# MDO — AEE Form Runner (El Capturador Operativo)

> **Estado:** Maestro de Operatividad (v1.0 - Simplificación Bruta)
> **Responsabilidad:** Proyectar esquemas de datos (Schemas) como formularios funcionales y disparar su persistencia/flujo.

---

## 1. AXIOMAS DE DISEÑO (SIMPLIFIED)

### A1 — Proyección Ciega de Esquemas
El Form Runner no sabe qué está capturando. Lee el `DATA_SCHEMA` y rinde los inputs necesarios (Repeaters, Texts, Numbers, Relations).

### A2 — Disparo Unidireccional
La única acción permitida al completar la captura es el **Commit al Workflow**. No hay lógica de guardado local dispersa; todo va al sistema nervioso central.

---

## 2. ARQUITECTURA TÉCNICA

Ubicación: `system_core/client/src/components/macro_engines/AEEFormRunner/`

### 2.1 Componentes de Proyección
*   `FormRenderer.jsx`: El motor que itera sobre los campos del esquema.
*   `FieldProjector.jsx`: Switch funcional que devuelve el input adecuado según el tipo de campo del esquema.
*   `CollectionProjector.jsx`: Maneja la lógica de los `Repeaters` y su anidamiento.

---

## 3. DISEÑO DE INTERFAZ (THE FORM COCKPIT)

### 3.1 Layout de Enfoque
*   **Zona Central:** Formulario limpio, tipografía premium (`--font-sans`), espaciado generoso.
*   **Foco Cognitivo:** Se resalta el grupo o ítem en el que el usuario está trabajando para reducir el estrés en formularios complejos (ej: cotizaciones con muchos espacios).

### 3.2 La HUD de Acción (Bottom)
*   **Botón Único de Ejecución:** `[ EJECUTAR FLUJO ]`. 
*   **Validación Visual:** El botón se mantiene con opacidad reducida hasta que el `FormRenderer` notifica que todos los campos requeridos son válidos.

---

## 4. RESTRICCIONES REFINADAS

*   ❌ **PROHIBIDO** cualquier elemento de edición del diseño del formulario. 
*   ❌ **PROHIBIDO** botones de acción hardcodeados. El destino se define en el átomo del Workflow asociado.
*   ❌ **PROHIBIDO** el bypass del Core. Todo envío viaja como un `SCHEMA_SUBMIT` a través del `ProtocolRouter`.
