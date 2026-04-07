/**
 * =============================================================================
 * MIE_CONFIG: Contrato de Configuración Agnóstico
 * ORIGEN: Definición de la "Aduana de Formatos" (ADR-008). 
 * RESOLUCIÓN: Presets tipados para control de Bitrate, Resolución y Estética.
 * AXIOMA: Configuración como Contrato Tipado (No como string genérico).
 * CUMPLIMIENTO TGS: Define los parámetros base para la futura geometría temporal.
 * =============================================================================
 */

export const MIE_PRESETS = {
  MAX_EFFICIENCY: {
    id: 'MAX_EFFICIENCY',
    label: 'MÁXIMA COMPRESIÓN (Web / Redes)',
    hint: 'Mínimo peso, calidad visual indistinguible. Ideal para web y móvil.',
    video: {
      codec: 'avc1.4d002a',       // H.264 Main Profile
      bitrate_mode: 'VBR',
      target_bitrate: 2_500_000,  // 2.5 Mbps
      max_resolution: 1080,
      fps_cap: 30,
      hardware_accel: 'prefer-hardware',
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
    id: 'BALANCED',
    label: 'EQUILIBRADO (Estándar)',
    hint: 'El punto dulce entre fidelidad y rendimiento.',
    video: {
      codec: 'avc1.4d002a',
      bitrate_mode: 'VBR',
      target_bitrate: 4_500_000,  // 4.5 Mbps
      max_resolution: 1080,
      fps_cap: 60,
      hardware_accel: 'prefer-hardware',
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
    id: 'MAX_QUALITY',
    label: 'ALTA FIDELIDAD (Preservar)',
    hint: 'Preserva texturas y detalles originales. Archivo resultante pesado.',
    video: {
      codec: 'avc1.64002a',       // H.264 High Profile
      bitrate_mode: 'VBR',
      target_bitrate: 12_000_000, // 12 Mbps
      max_resolution: 2160,       // Preservar 4K
      fps_cap: 120,
      hardware_accel: 'prefer-hardware',
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
      strip_metadata: false,      // Preservar EXIF
    }
  }
};

/**
 * Factory para crear una configuración MIE con overrides opcionales (Modo CUSTOM).
 */
export const createMIEConfig = (presetId = 'BALANCED', overrides = {}) => {
  const base = structuredClone(MIE_PRESETS[presetId] || MIE_PRESETS.BALANCED);
  
  // Merge profundo simple
  const merge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };

  return merge(base, overrides);
};
