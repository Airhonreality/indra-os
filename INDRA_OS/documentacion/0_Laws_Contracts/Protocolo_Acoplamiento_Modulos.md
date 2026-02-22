# Protocolo de Acoplamiento de Módulos (V14.0 — Zen / ADR-022)
## Axiom OS: El Algoritmo de Soberanía Híbrida

> **Modelo Mental**: En Axiom OS, el Core no manda sobre la UI; el Core provee **capacidades declaradas** y la UI proyecta realidades. El puente entre ambos es el **CANON**, un contrato de ADN que reside en cada Adaptador. No hay heurística: todo se declara, nada se infiere.

---

### 1. Reificación Contractual (v15.0)
El sistema abandona la transmutación heurística. Los datos recibidos del backend se reifican directamente según el contrato (CAPABILITIES/TRAITS). Si un dato no tiene contrato, el sistema no intenta interpretarlo.

**Axiomas de Identidad V12:**
*   **ARCHETYPE**: La naturaleza funcional (ej: `VAULT`, `GRID`, `ENGINE`). Determina qué motor de React se usará.
*   **DOMAIN**: El sector lógico (ej: `KNOWLEDGE`, `SYSTEM`).
*   **ID**: El identificador técnico único (ej: `drive`, `sheet`, `notion`).
*   **CANON**: Objeto que describe capacidades (`CAPABILITIES`), signos vitales (`VITAL_SIGNS`) y preferencias de layout (`UI_LAYOUT`).

```javascript
const CANON = {
  LABEL: "Google Drive",
  ARCHETYPE: "VAULT", // Soy un sistema de archivos
  DOMAIN: "INFRASTRUCTURE",
  CAPABILITIES: {
    listContents: { desc: "Explora la jerarquía de archivos", io: "READ" },
    store: { desc: "Persiste un blob de datos", io: "WRITE" }
  }
};

// En el return del Adapter:
return Object.freeze({
  id: "drive",
  CANON: CANON,
  get schemas() { /* Generador automático de esquemas para IA */ },
  listContents: find, // Implementación de la señal universal
  // ...
});
```

---

## 2. DIFERENCIACIÓN COGNITIVA: VAULT vs DRIVE
A partir de la V12, distinguimos entre **Implementación** y **Arquetipo**:

*   **DRIVE (Adapter)**: Es el "músculo". Sabe cómo hablar con la API de Google, cómo listar archivos y cómo mover carpetas. Su ID es `drive`.
*   **VAULT (Engine/Archetype)**: Es el "cerebro visual". Es el componente de React (`VaultEngine.jsx`) que sabe cómo mostrar cuadritos, breadcrumbs y barras de búsqueda. 
*   **La Relación**: El `VaultEngine` puede ser usado por `drive`, `notion` o `local`, porque todos ellos comparten el arquetipo `VAULT` y responden a la señal `listContents`.

---

## 3. EL PROTOCOLO DE SEÑAL UNIVERSAL (V9.0 / ADR-022)
Todos los adaptadores que expongan colecciones de datos DEBEN implementar el método `listContents` **con `io: "READ"` explícito en su `CANON.CAPABILITIES`**. Esto permite que cualquier motor de React o IA funcione con cualquier adaptador sin código extra ni inferencia.

**El Contrato del Ítem:**
```javascript
{
  id: "...",      // ID único
  name: "...",    // Nombre legible
  type: "FILE",   // FILE o DIRECTORY
  mimeType: "...", // Para iconos inteligentes
  lastUpdated: "ISO_DATE",
  raw: { ... }    // Datos específicos del proveedor
}
```

---

## 4. LA MEMBRANA DE DESPACHO (Agnosticismo Total)
Se ha eliminado el ruteo hardcodeado del Core (`reifyDatabase`). Ahora, es responsabilidad del **AxiomaticStore** (Frontend) decidir a qué nodo invocar basándose en el origen del artefacto:

*   **Si es una Tabla de Notion** -> Llama a `notion:queryDatabase`.
*   **Si es una Tabla de Drive** -> Llama a `sheet:read`.
*   **Si no sabes qué es** -> Llama a `nodeId:listContents`.

---

## 5. REGLAS DE ORO PARA EL DESARROLLADOR
1.  **No usar Alias**: No llames a `vault` en el código si te refieres a `drive`. Usa los IDs técnicos definidos en el `CANON.id`.
2.  **Soberanía de Errores**: Si un adaptador falla, debe devolver un error estructurado vía `errorHandler`, no un `null` silencioso.
3.  **Hidratación por Esquema**: Nunca asumas las columnas de una tabla. Lee siempre el `SCHEMA` devuelto por el adaptador.

---
**Firmado bajo el Sello de Verdad Viva:**
*AXIOM_ARCHITECT — V14.0 / ADR-022 Compliant*

---

## 6. EL CONTRATO ALQUÍMICO (Reificación de Datos — ADR-022 Compliant)
Para que Axiom OS sea verdaderamente universal, los datos deben declarar su propia traducción mediante `REIFICATION_HINTS`. Esto elimina la necesidad del `SignalTransmuter` como capa intermedia _(removido en Zen Simplification)_.

### El ADN del Contrato IO
Cada adaptador declara en su `CANON`:

1.  **IDENTIDAD (`id`)**: El "Nombre Verdadero" del objeto. Sin ID, el dato es materia fantasma y no puede ser persistido.
2.  **MANIFESTACIÓN (`LABEL`)**: El nombre legible por humanos.
3.  **REIFICATION_HINTS**: Mapa de campos del proveedor al esquema canónico del artefacto.

### El Pipeline Simplificado (3 pasos)
```
CANON del Adapter → HTTP/Cache → Render Engine
```
El Backend emite el dato ya canónico. El Frontend cachea y renderiza. Sin transformaciones intermedias.

> **Principio de Soberanía**: "Un adaptador es libre de hablar su propio idioma, siempre que entregue un REIFICATION_HINTS para que Axiom pueda entenderlo."





