# Auditoría de Trazabilidad Multi-Arquetipo (Informe de Riesgos)

**Fecha:** 2026-02-04
**Objetivo:** Verificar la proyección de `Notion` y `Sheet` bajo la nueva arquitectura v8.0.

## 1. Estado de los Artefactos

| Artefacto | `ARCHETYPES` (v8.0) | `ARCHETYPE` (Legacy Fallback) | Motor Frontend Esperado | Resultado Visual Anticipado |
| :--- | :--- | :--- | :--- | :--- |
| **Google Drive** | N/A (Implícito) | `VAULT` | `VaultEngine` | ✅ Sistema de Archivos robusto. |
| **Notion** | `[ADAPTER, VAULT, GRID, DOC]` | `VAULT` | `VaultEngine` | ✅ Sistema de Archivos (Carpetas/Páginas). **Riesgo:** Se pierde la vista de Grid/Doc temporalmente. |
| **Google Sheets** | `[ADAPTER, GRID]` | `DATAGRID` | `AdapterEngine` | ⚠️ Vista genérica de Adaptador. No se verá como una tabla de Excel (Grid) real aún. |

---

## 2. Análisis de Código Frontend (`Indra Skin`)

### `ComponentProjector.jsx`
*   **Estado:** *LEGACY*. Usa una lógica de selección singular (`ArchetypeMap[canon.ARCHETYPE]`).
*   **Hallazgo Crítico:** Ignora completamente la propiedad `ARCHETYPES` (array). No hay bucles de composición.
*   **Parche UX:** Detecta `VIEW_MODE_SELECTOR` para cambiar de motor, pero esto depende de que el fallback `ARCHETYPE` inicial sea compatible.

### `AdapterEngine.jsx`
*   **Estado:** *INCOMPLETO*.
*   **Hallazgo Crítico:** Renderiza los botones del selector de vistas ("VAULT", "GRID", "DOC") pero **no tienen funcionalidad real**. Al hacer click, solo cambia un estado visual (`viewLens`), pero no carga el motor correspondiente (`VaultEngine`, `GridEngine`).
*   **Consecuencia:** Si Notion entra como `ADAPTER`, verás botones para cambiar a `VAULT`, pero al pulsarlos **no pasará nada**. Seguirás viendo la vista de tarjetas.

---

## 3. Riesgos y Realidad Cruda

1.  **El "Engaño" de Notion:**
    *   Para cumplir la promesa de "Notion se ve como Drive", he forzado el fallback de Notion a `VAULT`.
    *   **Resultado:** Al abrir Notion, verás la interfaz de carpetas igual que Drive. ¡Éxito!
    *   **El Precio:** No podrás cambiar a vista de Base de Datos ("GRID") o Documento ("DOC") desde esa interfaz, porque `VaultEngine` no tiene implementado el selector de vistas para salir de él. Es una calle de un solo sentido por ahora.

2.  **La Decepción de Sheets:**
    *   Fallback `DATAGRID` mapea a `AdapterEngine`.
    *   **Resultado:** Verás las capacidades de Sheet (`read`, `write`, `query`) como botones. No verás una hoja de cálculo.
    *   **Mitigación:** Es funcional, pero no "espacial".

3.  **Deuda Técnica Frontend:**
    *   El Frontend necesita una refactorización urgente para implementar el `Poly-Archetype Renderer`. Sin esto, la arquitectura v8.0 del backend es solo "potencia latente" desperdiciada.

## 4. Recomendación de Acción Inmediata

1.  **Despliegue Backend:** Ejecutar `clasp push` para aplicar los nuevos Canons.
2.  **Validación:** Verificar que Notion carga en la terminal con la interfaz de archivos.
3.  **Roadmap Frontend:** Agendar la tarea "Implementar Poly-Archetype en ComponentProjector" como prioridad alta para desbloquear las vistas múltiples reales.

---
**Firmado:** Auditoría INDRA Core





