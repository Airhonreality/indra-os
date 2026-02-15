# ADR-010: Hidratación Imperativa y Pasaportes de Identidad

## Estatus
Propuesto / En Implementación (Fase 6)

## Contexto
Tras ADR-009, se identificó que el Frontend todavía realizaba intentos de "adivinar" el origen basándose en la estructura de los datos o en prefijos de ruta (`notion://`, `drive://`). Además, los componentes (ej. `DatabaseEngine`) iniciaban procesos de carga de datos (`fetch`) de forma autónoma basándose en heurísticas internas, lo que provocaba inconsistencias de estado y "zombie logic" difícil de auditar.

## Decisión
Se implementa el modelo de **Hidratación Imperativa (Imperative Hydration)**:

1.  **Pasaporte de Identidad (Identity Passport)**: Ningún artefacto puede ser seleccionado (`SELECT_ARTIFACT`) sin un pasaporte completo inyectado por el emisor (Vault, Search). Este pasaporte incluye obligatoriamente `ORIGIN_SOURCE` y `ACCOUNT_ID`.
2.  **Pre-Reificación Centralizada**: El `AxiomaticStore` actúa como guardián de la realidad. Al detectar la selección de una unidad de datos, el Store dispara la hidratación del Silo *antes* de que el motor de proyección se monte.
3.  **Motores de Proyección Puros**: Los componentes (Engines) dejan de ser responsables de pedir datos. Se convierten en proyecciones puras de la verdad contenida en los Silos. Si el Silo está vacío, el motor muestra un estado de vacío, pero NO intenta cargar datos por su cuenta.
4.  **Vocabulario de Linaje Estandarizado**: Se establece un vocabulario restringido para `ORIGIN_SOURCE`:
    - `notion`: Datos provenientes de la API de Notion.
    - `drive`: Archivos genéricos de Google Drive.
    - `sheets`: Hojas de cálculo de Google.
    - `calendar`: Eventos de Google Calendar.
    - `email`: Hilos y mensajes de Gmail.
    - `cosmos`: Estructuras de grafos de Indra.

## Consecuencias
- **Positivas**:
    - Predictibilidad total en la carga de datos.
    - Eliminación de efectos secundarios (`side-effects`) en los componentes de renderizado.
    - Auditoría simplificada del flujo de datos (Tracing).
- **Negativas**:
    - Requiere que todas las interacciones de UI (clicks, double-clicks) pasen por un despacho formal con metadatos completos.

## Ley de Impedancia Relacionada
"La realidad no se adivina, se convoca. Un motor sin pasaporte es un ciego en el vacío."





