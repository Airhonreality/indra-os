# 🔥 PRUEBA DE FUEGO: Escenarios de Stress de INDRA OS (Edición Pro Renderer)

Este documento desglosa 10 casos de uso complejos para validar la arquitectura de INDRA bajo el paradigma **Pro Renderer (Fase 6)** y **Eidos Runtime (Fase 7)**.

> **Premisa:** Ya no existe un "Panel Eidos" estático. El diseño ocurre en el **Renderer Canvas** (Indra Studio) y la ejecución en el **Eidos Runtime** (Overlay).

---

## 🏗️ Parte 1: Desglose Atómico de Casos de Uso

### 1. Sincronización de Tesis y Evidencia
*   **Fase Diseño (Renderer):** Usuario arrastra un `SmartFrame` conectado al puerto `bibliografía`. Configura el layout como `AutoLayout: Vertical`.
*   **Fase Runtime (Eidos):** Usuario pega una cita textual en el input.
*   **Lógica:** Disparar `callCore('ScholarAdapter', 'extractMetadata', {cite_text})`.
*   **Reacción:** El Core devuelve un objeto `UniversalItem`. El Eidos Runtime invoca al Renderer para generar una tarjeta visual (Card) y la ancla al SmartFrame dinámicamente.

### 2. Conciliación de Pagos Multi-moneda
*   **Fase Diseño (Renderer):** Input de moneda con validación `onChange`.
*   **Lógica:** Nodo de Lógica `.logic` invoca `FX_Adapter.getRealTimeRate()`.
*   **Veto (Core):** Si `(Total * Rate) - Costo < 5%`, el Core devuelve `CORE_REJECT`.
*   **Feedback Visual:** El botón "Cerrar Venta" en el Eidos Runtime se bloquea físico y el borde del input pulsa en rojo (Shadow Schema Validation).

### 3. Gestión de Inventario en Tiempo Real
*   **Interacción (Eidos):** Usuario incrementa cantidad en un `Stepper Component` diseñado en el Renderer.
*   **Lógica:** `callCore('InventoryAdapter', 'checkStock', {sku, qty})`.
*   **Gatillo Físico:** Si `stock == 0`, el Core devuelve estado `EXHAUSTED`.
*   **Salida:** El componente se desatura visualmente (Opacity 50%) y el cursor de presencia del usuario muestra un icono de "Prohibido".

### 4. Contratos Legales Dinámicos
*   **Fase Diseño (Renderer):** Uso de `Vector Networks` para dibujar firmas biométricas.
*   **Lógica:** Selección de "Jurisdicción" cambia el esquema de datos.
*   **Acción:** El Renderer detecta el cambio de esquema upstream y re-renderiza el formulario usando `Schema-Aware Binding`. Campos irrelevantes desaparecen (Layout Sovereignty).
*   **Salida:** El contrato se adapta a la ley local en tiempo real sin recargar.

### 5. Auditoría de Ensayos Clínicos (Ghost Data)
*   **Entrada:** Sensores IoT -> Core.
*   **Visualización:** El Renderer usa su capa de **Canvas 2D (Hybrid Engine)** para graficar millones de puntos de datos sin bloquear el DOM.
*   **Veto:** Si hay desviación > Sigma-3, el gráfico se tiñe de rojo mediante tintado OkLCH perceptualmente uniforme.

### 6. Pipeline de Contenido Multicanal
*   **Fase Diseño (Renderer):** Multi-Page Layout. Página 1: A4 (Paper), Página 2: Cuadrada (Instagram).
*   **Vinculación:** Ambos layouts comparten el mismo `Data Source` (Materia).
*   **Salida:** Al editar el título en el Paper, el texto se ajusta automáticamente en el post de Instagram gracias al `AutoLayout V2` (Constraints: HUG).

### 7. Monitoreo de Reputación con Presencia
*   **Escenario:** 3 operadores monitoreando una crisis en el mismo nodo.
*   **Presencia:** Los 3 ven los cursores de los demás ("Shadow Cursors") sobre el mapa de calor.
*   **Lógica:** Si el sentimiento cae drásticamente, el nodo entra en "Modo Lockdown".
*   **Salida:** Todos los cursores remotos son expulsados del área de "Publicar" visualmente (Force Push).

### 8. Onboarding de Empleados
*   **Fase Runtime (Eidos):** Formulario de aptitudes renderizado desde `.layout`.
*   **Lógica:** Árbol de decisión `.logic` resuelve permisos.
*   **Salida:** El Runtime genera una tarjeta de identidad digital en el momento, usando los vectores de la marca y la foto subida, lista para exportar a PDF vía Core.

### 9. Optimización de Logística
*   **Entrada:** Dirección de entrega en mapa interactivo (Componente WebGL en Renderer).
*   **Lógica:** Comparación asíncrona de apis.
*   **Rollback:** Si la API falla, el componente mapa hace un "Glitch effect" y restaura la coordenada anterior garantizada por Amnesia.

### 10. Leads con Veto de Entrada
*   **Entrada:** Email de empresa.
*   **Lógica:** `LinkedIn_Adapter` verifica UUID.
*   **Veto:** Si es empresa fantasma, el Core rechaza la transacción.
*   **Feedback:** El botón "Enviar" (diseñado en Renderer) ejecuta una animación de desintegración y muestra "Access Denied".

---

## 🎯 Parte 2: Confirmación de Viabilidad (Arquitectura Pro Renderer)

Confirmamos que todos los casos son **100% posibles** bajo la arquitectura V6.0:

1.  **Hybrid Engine:** Permite la visualización masiva (Caso 5) y mapas interactivos (Caso 9).
2.  **Auto Layout V2:** Esencial para la adaptación dinámica de contratos (Caso 4) y contenido multicanal (Caso 6).
3.  **Schema-Aware Binding:** Habilita la reacción inmediata ante cambios de jurisdicción o datos (Casos 1, 4, 8).
4.  **Shadow Cursors:** Valida la operación en equipo en tiempo real (Caso 7).
5.  **Eidos Runtime:** Provee el entorno de ejecución segura para la lógica de negocio (Casos 2, 3, 10).

---

## 🧠 Parte 3: Mejoras Ergonómicas Cognitivas (Alineadas)

1.  **Veto Ghosting (Pre-fetch en Runtime):**
    *   *Concepto:* El Eidos Runtime predice el rechazo antes del clic basándose en reglas locales descargadas.
2.  **Atom Zoom (Aether Ribbon):**
    *   *Concepto:* Mantener la inspección de linaje de datos en la barra inferior, funcionando tanto en Reality como en el Renderer Canvas.
3.  **Kinesthetic Wiring (Reality):**
    *   *Concepto:* Arrastrar un cable desde un `Logic Node` directamente al canvas del Renderer para crear un input vinculado automáticamente.

*Documento actualizado al Estándar Pro Renderer Phase 6.*
