# ADR-034: Multimedia Ingest Engine (MIE)

- **Estado**: PROPUESTO
- **Fecha**: 2026-03-30
- **Autores**: Arquitecto Soberano + Antigravity
- **Módulos Afectados**: `services/multimedia_core/`, `components/widgets/MIE/`, `AEEFormRunner`, `satellite/hud.js`

---

## 1. Contexto y Problema

El módulo `video_core` actual concentra lógica de transcodificación acoplada al `VideoDesigner` (macro-engine de edición). Esto impide que cualquier otro punto del sistema (formularios AEE, satélites externos, flujos de publicación masiva) pueda ingestar, normalizar y optimizar archivos multimedia de forma autónoma.

Adicionalmente, el `transcoder_worker.js` actual tiene limitaciones críticas:
- Solo acepta entrada `video/mp4` (Fast-Track).
- El pipeline de Re-codificación completo no tiene Drain enganchado.
- No existe soporte nativo para audio standalone ni imágenes.
- No hay sistema de presets de calidad/compresión.

**Necesidad**: Un motor **ultra-agnóstico, headless y ultra-especializado** dedicado exclusivamente a la ingesta y normalización de materia multimedia, invocable desde cualquier superficie de Indra sin importar el contexto.

---

## 2. Decisión

Se crea el **Multimedia Ingest Engine (MIE)**: una librería de servicios pura (sin UI obligatoria) compuesta por un orquestador, un pool de Web Workers tipo-específicos y un conjunto de Widgets React acoplables.

**Axioma Central (Extensión de la Ley de Aduana — ADR-008):**
> Todo archivo multimedia que ingrese al ecosistema de Indra DEBE pasar por la Aduana MIE antes de ser persistido o transmitido. Solo materia canónica cruza la frontera.

---

## 3. Diseño Axiomatic

### Ley 1: Separación Total de Responsabilidades
El MIE no conoce React, no conoce el `VideoDesigner`, no conoce Google Drive. Su única interfaz es:
- **Entrada**: `File[]` + `MIEConfig`
- **Salida**: `Promise<MIEResult[]>` con blobs canónicos + metadatos sinceros

### Ley 2: Paralelismo por Naturaleza (Worker Pool)
Cada tipo de medio corre en su propio hilo. El número de instancias de Workers es dinámico: `Math.max(1, navigator.hardwareConcurrency - 1)`. El usuario nunca espera en el main thread.

### Ley 3: Hardware Acceleration First
Todos los codecs usan `hardwareAcceleration: 'prefer-hardware'`. Si el hardware no está disponible, el sistema cae graciosamente a software, notificando al orquestador.

### Ley 4: Configuración como Contrato (no como string)
El preset nunca es un string genérico en runtime. Es un JSON tipado (`MIEConfig`) que puede ser serializado, persistido y auditado.

### Ley 5: Progreso Granular (No Bloqueo Percibido)
Cada Worker emite eventos `PROGRESS` frecuentes con `{ fileId, percent, eta_ms, originalBytes, estimatedOutputBytes }`. El usuario siempre ve progreso real.

---

## 4. Estructura de Archivos

```
services/multimedia_core/
  mie_config.js              ← Presets + schema + factory functions
  MIEOrchestrator.js         ← Director: cola, pool de workers, promesas
  video_ingest_worker.js     ← Worker: video (WebCodecs + mp4box + mp4-muxer)
  audio_ingest_worker.js     ← Worker: audio (AudioDecoder/Encoder + WebCodecs)
  image_ingest_worker.js     ← Worker: imagen (OffscreenCanvas + WebP/AVIF)

components/widgets/MIE/
  useMIE.js                  ← Hook React: conecta Orquestador con estado UI
  MIEDropzone.jsx            ← Widget 1: Área de arrastre masivo
  MIEQueuePanel.jsx          ← Widget 2: Cola de progreso estilo Handbrake
  MIEConfigPanel.jsx         ← Widget 3: Slider de preset + panel avanzado
```

---

## 5. Contrato de Configuración (`MIEConfig`)

```js
// mie_config.js

export const MIE_PRESETS = {

  MAX_EFFICIENCY: {
    preset: 'MAX_EFFICIENCY',
    video: {
      codec: 'avc1.4d002a',       // H.264 Main Profile
      bitrate_mode: 'VBR',
      target_bitrate: 2_500_000,  // 2.5 Mbps
      max_resolution: 1080,
      fps_cap: 30,
      hardware_accel: true,
      gop_size: 60,               // Keyframe cada 2s a 30fps
    },
    audio: {
      codec: 'mp4a.40.2',         // AAC-LC
      bitrate: 96_000,            // 96kbps
      normalize: true,            // -14 LUFS broadcast
      sample_rate: 44100,
    },
    image: {
      format: 'webp',
      quality: 0.75,
      max_dimension: 1920,
      strip_metadata: true,
    }
  },

  BALANCED: {
    preset: 'BALANCED',           // DEFAULT
    video: {
      codec: 'avc1.4d002a',
      bitrate_mode: 'VBR',
      target_bitrate: 4_000_000,  // 4 Mbps
      max_resolution: 1080,
      fps_cap: 60,
      hardware_accel: true,
      gop_size: 60,
    },
    audio: {
      codec: 'mp4a.40.2',
      bitrate: 128_000,           // 128kbps
      normalize: true,
      sample_rate: 44100,
    },
    image: {
      format: 'webp',
      quality: 0.82,              // Sweet spot calidad/peso
      max_dimension: 2048,
      strip_metadata: true,
    }
  },

  MAX_QUALITY: {
    preset: 'MAX_QUALITY',
    video: {
      codec: 'avc1.64002a',       // H.264 High Profile
      bitrate_mode: 'CBR',
      target_bitrate: 12_000_000, // 12 Mbps
      max_resolution: 2160,       // Preservar 4K
      fps_cap: 120,
      hardware_accel: true,
      gop_size: 30,
    },
    audio: {
      codec: 'mp4a.40.2',
      bitrate: 320_000,           // 320kbps
      normalize: false,           // Preservar dinámica original
      sample_rate: 48000,
    },
    image: {
      format: 'webp',
      quality: 0.95,
      max_dimension: 4096,
      strip_metadata: false,      // Preservar EXIF en producción
    }
  }
};

export const createMIEConfig = (presetKey = 'BALANCED', overrides = {}) => {
  const base = structuredClone(MIE_PRESETS[presetKey] || MIE_PRESETS.BALANCED);
  return deepMerge(base, overrides); // Merge granular para CUSTOM
};
```

---

## 6. Orquestador (`MIEOrchestrator.js`)

Responsabilidades:
1. **Detección de tipo**: Análisis de `file.type` MIME + extensión como fallback.
2. **Routing al worker correcto**: `video/*` → `video_ingest_worker`, `audio/*` → `audio_ingest_worker`, `image/*` → `image_ingest_worker`.
3. **Pool de Workers**: Máximo `N = navigator.hardwareConcurrency - 1` workers concurrentes por tipo.
4. **Cola de Trabajo (FIFO)**: Archivos que esperan se encolan; cuando un Worker queda libre, toma el siguiente trabajo.
5. **Agregación de Progreso**: Combina el progreso de todos los workers activos en un estado global (`totalFiles`, `processedFiles`, `currentPercent`).
6. **Retorno**: `Promise<MIEResult[]>` con:
   ```js
   {
     fileId: string,
     originalFile: File,
     canonicalBlob: Blob,
     metadata: {
       originalSize: number,
       finalSize: number,
       compressionRatio: number, // e.g. 0.23 = 77% de reducción
       duration_ms: number,      // (video/audio)
       width: number,            // (video/image)
       height: number,           // (video/image)
       codec: string,
       preset: string,
     }
   }
   ```

---

## 7. Workers Especializados

### `video_ingest_worker.js`
Pipeline (extensión y corrección del actual `transcoder_worker.js`):
1. Leer `File` en chunks → `MP4Box` demuxea el contenedor.
2. `VideoDecoder` (WebCodecs) decodifica frames crudos a `VideoFrame`.
3. Si `max_resolution` < alta original → redimensionar con `OffscreenCanvas`.
4. `VideoEncoder` re-encoda con la config del preset.
5. `AudioDecoder` extrae e `AudioEncoder` re-encoda pista de audio en paralelo.
6. `mp4-muxer` empaqueta video + audio en MP4 final con `fastStart: 'in-memory'`.
7. Emite `TRANSCODE_COMPLETE` con el `Blob` y metadatos sinceros.

**Corrección al estado actual**: El `transcoder_worker.js` existente lanza un error en el pipeline profundo ("Fast-Track exigido"). El nuevo `video_ingest_worker.js` implementa el **Drain correcto**: `await videoEncoder.flush()` + `await audioEncoder.flush()` antes de finalizar el muxer.

### `audio_ingest_worker.js`
1. Se decodifica el archivo de audio raw con `AudioDecoder`.
2. Si `normalize: true` → análisis de sample peak + ganancia para alcanzar -14 LUFS.
3. `AudioEncoder` encoda a AAC con los parámetros del preset.
4. `mp4-muxer` empaqueta en contenedor M4A/MP4.
5. Emite resultado.

### `image_ingest_worker.js`
1. `createImageBitmap(file)` — decodificación nativa sin bloquear.
2. Cálculo de dimensiones respetando aspect ratio vs `max_dimension`.
3. `OffscreenCanvas` renderiza con las nuevas dimensiones.
4. `canvas.convertToBlob({ type: 'image/webp', quality })` — salida canónica.
5. Si `strip_metadata: true` → el proceso de re-render ya elimina EXIF naturalmente.

---

## 8. Widgets React

### `useMIE.js` (Hook)
```js
const {
  files,          // Lista de MIEJob con estado
  addFiles,       // (File[]) → encola en el Orquestador
  removeFile,     // (fileId) → cancela o elimina de la lista
  config,         // MIEConfig activo
  setPreset,      // ('BALANCED' | ...) → actualiza config
  setConfig,      // (partialOverride) → modo CUSTOM
  isProcessing,   // boolean
  globalProgress, // 0.0 – 1.0
  results,        // MIEResult[] de archivos completos
  clearResults,
} = useMIE({ defaultPreset: 'BALANCED', autoStart: true });
```

### `<MIEDropzone />`
- Acepta `multiple` + drag-and-drop masivo.
- Preview instantáneo por tipo: thumbnail para images/video, waveform mini para audio.
- Filtra por `accept` configurable (e.g. `video/*,audio/*,image/*`).
- Al soltar archivos → llama `addFiles(files)` del hook.

### `<MIEQueuePanel />`
- Lista virtualizada (react-window si > 50 items) para manejar miles de archivos.
- Por cada item: nombre, tipo (icono), tamaño original → estimado final, barra de progreso individual, badge de estado: `PENDING / PROCESSING / DONE / ERROR`.
- Footer sticky con progreso global + velocidad de procesamiento (MB/s).

### `<MIEConfigPanel />`
- **Slider de 1 a 3** mapeado a `MAX_EFFICIENCY / BALANCED / MAX_QUALITY` con labels semánticos:
  - **"Pluma"** / **"Sincero"** / **"Cristal"**
- Toggle `"Configuración Avanzada"` que expande controles granulares del `MIEConfig` (bitrate, resolución, calidad de imagen).
- Estimación de tamaño resultante en tiempo real.

---

## 9. Integración en AEE FormRunner

Se añade el tipo de nodo `MULTIMEDIA_UPLOADER` al schema AEE. Cuando el `FormRunner` detecta este tipo, monta `<MIEDropzone />` + `<MIEQueuePanel />`. El valor del campo en `formData` es el array de `MIEResult` (blobs + metadatos), que luego el AEE puede publicar en Drive, Sheets, etc.

---

## 10. Integración en Satélite Web (hud.js)

El `satellite/hud.js` expone un componente adicional `<MIESatelliteUploader />` que empaqueta los 3 widgets dentro del Shadow DOM. Cualquier web externa que inyecte el script `hud.js` Indra puede ofrecer a sus usuarios una terminal de publicación multimedia de nivel profesional, sin backend propio.

---

## 11. Comparación con `video_core` Actual

| Aspecto | `video_core` (actual) | MIE (propuesto) |
|:--------|:----------------------|:----------------|
| Scope | Solo VideoDesigner | Todo Indra + Satélites |
| Tipos | Solo MP4 video | Video, Audio, Imagen |
| Formatos entrada | MP4 únicamente (Fast-Track) | MP4, MOV, WebM, MP3, WAV, FLAC, PNG, HEIC, etc. |
| Presets | Hardcoded 5 Mbps + 1080p | 3 presets + CUSTOM |
| Drain pipeline | ⚠️ No enganchado (throws error) | ✅ Implementado correctamente |
| Uso desde AEE | ❌ No posible | ✅ Nativo (campo MULTIMEDIA_UPLOADER) |
| Uso desde Satélite | ❌ No posible | ✅ MIESatelliteUploader |

---

## 12. Estado de Implementación

- [ ] Fase 1: Core Workers + Orquestador
- [ ] Fase 2: Widgets React
- [ ] Fase 3: Integración AEE
- [ ] Fase 4: Integración Satélite
- [ ] Fase 5: Verificación y pruebas

---

*Referencia cruzada: ADR-008 (Ley de Aduana), ADR-023 (Canonical Media Transport), ADR-024 (Media Resolver Strategy)*
