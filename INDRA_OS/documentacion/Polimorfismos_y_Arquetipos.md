# 🎭 Polimorfismos y Arquetipos: La Identidad Soberana del Sistema

> **AXIOMA**: "El ComponentProjector no adivina; el Arquetipo decreta."
>
> Este documento define la taxonomía oficial de identidades (Arquetipos) que un Artefacto puede asumir dentro del Indra OS. Cada Arquetipo mapea una "Forma de Ser" a un "Motor de Renderizado" específico.

---

## 🦠 1. Arquetipos Fundamentales (Existentes)

Estos son los pilares ya registrados en el `Archetype_Registry.js` y funcionales en el sistema.

| Arquetipo | Motor (Engine) | Descripción Semiótica | Etiqueta Humana (Ejemplo) |
| :--- | :--- | :--- | :--- |
| **`REALITY`** | `RealityEngine` | El Espacio mismo. Renderiza topología 3D y física. | "Dimension 3D" |
| **`VAULT`** | `VaultEngine` | Contenedor de explorables. Bóvedas de archivos. | "Explorador de Archivos", "Drive" |
| **`ADAPTER`** | `AdapterEngine` | Interfaz de control genérica. Dashboard de salud. | "Panel de Control", "Monitor" |
| **`SERVICE`** | `ServiceEngine` | Procesos en segundo plano sin UI compleja. | "Servicio", "Demonio" |
| **`GRID`** | `AdapterEngine` (*) | Datos tabulares estrictos. Hojas de cálculo. | "Tabla de Datos", "Hoja de Cálculo" |
| **`SLOT_NODE`**| `SlotEngine` | Espacios vacíos de proyección futura. | "Espacio Disponible" |
| **`NODE`** | `NodeEngine` | La representación atómica en el grafo. | "Nodo", "Punto de Conexión" |
| **`SCHEMA`** | `SchemaFormEngine`| Editor de estructuras y contratos. | "Editor de Leyes" |

> (*) `GRID` actualmente usa `AdapterEngine` en modo tabla, pero evolucionará a `GridEngine` propio.

---

## 📡 2. Arquetipos de Comunicación (Recién Implementados)

Subsistema unificado de interacción humana/máquina.

| Arquetipo | Motor (Engine) | Sub-Tipos (MimeType) | Etiqueta Humana |
| :--- | :--- | :--- | :--- |
| **`MAIL`** | `CommunicationEngine` | `msg/email`, `thread/smtp` | "Bandeja de Entrada", "Correo" |
| **`MESSAGING`**| `CommunicationEngine` | `msg/chat`, `stream/whatsapp` | "Chat", "Mensajería Instantánea" |
| **`SOCIAL`** | `CommunicationEngine` | `feed/post`, `stream/insta` | "Feed Social", "Red" |

---

## 🔮 3. Nuevos Arquetipos Propuestos (Análisis del Core)

Basado en la autopsia de la carpeta `3_Adapters`, se identifican entidades que merecen soberanía propia para escapar del genérico `ADAPTER`.

### A. El Oráculo (`ORACLE`)
Para `OracleAdapter.gs` (Investigación Web) y `LLMAdapter.gs` (Inteligencia Pura).
*   **Motor Sugerido**: `OracleEngine` (Input de Búsqueda + Resultados Estructurados + Citas).
*   **Sub-Tipos**:
    *   `RESEARCH`: Búsqueda profunda con navegador headless.
    *   `SYNTHESIS`: Resumen de inteligencia.

### B. Cronoso (`CHRONOS`)
Para `CalendarAdapter.gs`. El tiempo merece su propia dimensión, no ser un simple dashboard.
*   **Motor Sugerido**: `ChronosEngine` (Vista de Calendario / Línea de Tiempo).
*   **Etiqueta Humana**: "Agenda Soberana", "Línea de Tiempo".

### C. Geo-Espacial (`GEO`)
Para `MapsAdapter.gs`.
*   **Motor Sugerido**: `GeoEngine` (Visor de Mapas, Rutas, Coordenadas).
*   **Etiqueta Humana**: "Mapa", "Navegación".

### D. Multimedia (`MEDIA`)
Para `AudioAdapter.gs`, `YouTubeAdapter.gs`.
*   **Motor Sugerido**: `MediaEngine` (Player unificado con controles de scrub, volumen, playlists).
*   **Sub-Tipos**:
    *   `AUDIO`: Visualizador de ondas + Controles.
    *   `VIDEO`: Viewport 16:9 + Controles.
*   **Etiqueta Humana**: "Reproductor", "Estudio".

### E. Presentación (`SHOW`)
Para `GoogleSlidesAdapter.gs`.
*   **Motor Sugerido**: `SlideEngine` (Visor de diapositivas paso a paso).
*   **Etiqueta Humana**: "Presentación", "Diapositivas".

### F. Formulario (`FORM`)
Para `GoogleFormsAdapter.gs`.
*   **Motor Sugerido**: `FormEngine` (Renderizado de encuestas input/output).
*   **Etiqueta Humana**: "Encuesta", "Formulario de Origen".

---

## 🧬 4. Polimorfismo y Sub-división Atómica

El verdadero poder del Indra OS reside en que **un mismo Artefacto puede tener múltiples Arquetipos** dependiendo del contexto (Polimorfismo).

### Caso de Estudio: `NotionAdapter`
Actualmente es un híbrido monstruoso. Propongo dividirlo en proyecciones:
1.  **Como Bóveda (`VAULT`)**: Cuando navegas la jerarquía de páginas.
2.  **Como Documento (`DOC`)**: Cuando lees una página de texto.
3.  **Como Base de Datos (`GRID`)**: Cuando ves una inline-database.

### Caso de Estudio: `YouTubeAdapter`
1.  **Como Feed (`SOCIAL`)**: Ver lista de videos nuevos o comentarios.
2.  **Como Player (`MEDIA`)**: Ver un video específico.
3.  **Como Oráculo (`ORACLE`)**: Buscar conocimiento en video (transcripciones).

### Estrategia de Etiquetado Humano (Human Labeling)
Para evitar nombres técnicos (`INPUT_PORT_01`), el `NodeEngine` ahora busca activamente metadatos humanos en el contrato del adaptador.

**Ejemplo de Contrato Ideal (JSON Backend):**

```json
{
  "ARCHETYPE": "MEDIA",
  "LABEL": "YouTube Studio",
  "CAPABILITIES": {
    "play_stream": {
      "io": "READ",
      "type": "STREAM",
      "human_label": "Reproducir Video 📺"  <-- AXIOMA VISUAL
    },
    "fetch_comments": {
      "io": "READ",
      "type": "JSON",
      "human_label": "Leer Comentarios 💬"
    }
  }
}
```

## 🚀 Próximos Pasos de Implementación

1.  Crear `OracleEngine.jsx` para dar cara a la investigación.
2.  Crear `MediaEngine.jsx` simple para unificar Audio/Video.
3.  Implementar `human_label` en los Adapter.gs del Core (Backend).





