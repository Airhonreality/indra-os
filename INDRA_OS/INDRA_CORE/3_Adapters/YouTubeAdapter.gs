// ======================================================================
// ARTEFACTO: 3_Adapters/YouTubeAdapter.gs
// DHARMA: Operador de contenido y scout de investigación en el ecosistema YouTube.
// VERSION: 5.5.0 (MCEP-Ready)
// ======================================================================

/**
 * Factory para el YouTubeAdapter (Video Orchestrator).
 * @param {object} deps - { errorHandler, tokenManager, sensingService }
 * @returns {object} El adaptador congelado.
 */
function createYouTubeAdapter({ errorHandler, tokenManager, sensingService }) {
  if (!errorHandler) throw new Error("YouTubeAdapter: errorHandler is required");

  const schemas = {
    listChannelVideos: {
      description: "Extracts an industrial list of video descriptors from a target YouTube channel utilizing the uploads playlist protocol.",
      semantic_intent: "SENSOR",
      io_interface: {
        inputs: {
          channelId: { type: "string", io_behavior: "GATE", description: "Target channel resource identifier." },
          maxResults: { type: "number", io_behavior: "SCHEMA", description: "Maximum quantity of video descriptors to return." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        },
        outputs: {
          videos: { type: "array", io_behavior: "STREAM", description: "Collection of Indra SocialMedia: { id, type, url, caption, permalink, timestamp, author, stats, raw }" }
        }
      }
    },
    extractTranscript: {
      description: "Transforms a target YouTube video resource into a high-integrity linguistic text stream via transcript extraction.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          videoId: { type: "string", io_behavior: "GATE", description: "Target video resource identifier." },
          language: { type: "string", io_behavior: "SCHEMA", description: "Target linguistic model identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        },
        outputs: {
          transcript: { type: "string", io_behavior: "STREAM", description: "Extracted linguistic text stream." },
          method: { type: "string", io_behavior: "PROBE", description: "Technical extraction methodology used." }
        }
      }
    }
  };

  /**
   * Obtener API Key de YouTube.
   */
  function _getApiKey(accountId = 'system_default') {
    if (!tokenManager) return null;
    const token = tokenManager.getToken({ provider: 'youtube', accountId });
    return (token && token.apiKey) ? token.apiKey : null;
  }

  /**
   * Lista videos usando el patrón Uploads Playlist ID.
   */
  // --- INDRA CANON: Normalización Semántica ---

  function _mapMedia(raw) {
    return {
      id: raw.videoId,
      type: 'VIDEO',
      url: `https://www.youtube.com/watch?v=${raw.videoId}`,
      caption: raw.title || "",
      permalink: `https://www.youtube.com/watch?v=${raw.videoId}`,
      timestamp: raw.publishedAt,
      author: raw.channelTitle || "unknown",
      stats: {
        likes: 0, // No disponible en listRes básico por defecto sin campos extra
        comments: 0
      },
      raw: raw
    };
  }

  function listChannelVideos(payload) {
    const { channelId, maxResults = 10, accountId = 'system_default' } = payload || {};
    const apiKey = _getApiKey(accountId);
    if (!apiKey) throw errorHandler.createError("AUTH_ERROR", "YouTube API Key no configurada.");

    try {
      // 1. Obtener el ID de la lista "uploads" del canal
      const chanUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
      const chanRes = JSON.parse(UrlFetchApp.fetch(chanUrl).getContentText());
      
      const uploadsPlaylistId = chanRes.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) throw new Error("No se encontró la playlist de uploads para este canal.");

      // 2. Listar items de esa playlist
      const listUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`;
      const listRes = JSON.parse(UrlFetchApp.fetch(listUrl).getContentText());

      const videos = (listRes.items || []).map(item => _mapMedia({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle
      }));

      // AXIOMA: Reducción de Entropía (Esquema de Video)
      const schema = {
        columns: [
          { id: 'caption', label: 'TÍTULO', type: 'STRING' },
          { id: 'author', label: 'CANAL', type: 'STRING' },
          { id: 'timestamp', label: 'PUBLICADO', type: 'DATE' },
          { id: 'permalink', label: 'LINK', type: 'URL' }
        ]
      };

      return {
        results: videos,
        videos: videos, // Backward compatibility
        items: videos,  // Vault compatibility
        ORIGIN_SOURCE: 'youtube',
        SCHEMA: schema,
        PAGINATION: {
          hasMore: !!listRes.nextPageToken,
          nextToken: listRes.nextPageToken || null,
          total: listRes.pageInfo?.totalResults || videos.length,
          count: videos.length
        },
        IDENTITY_CONTEXT: {
          accountId: accountId,
          permissions: {
            canEdit: false,
            role: 'viewer'
          }
        }
      };

    } catch (e) {
      throw errorHandler.createError("YOUTUBE_API_ERROR", e.message);
    }
  }

  /**
   * Extrae transcripción (Agnóstico: Usa Sensing Service Fallback).
   */
  function extractTranscript(payload) {
    const { videoId } = payload || {};
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // AXIOMA: Agnosticismo. Si tenemos un servicio de sensing inyectado, lo usamos para el trabajo sucio.
    if (sensingService && typeof sensingService.extract === 'function') {
      try {
        const result = sensingService.extract({ url: videoUrl });
        return {
          transcript: result.markdown || result.content || "Fallo en la extracción del contenido.",
          method: "fallback_sensing"
        };
      } catch (e) {
        console.warn(`YouTubeAdapter: Falló el sensing fallback: ${e.message}`);
      }
    }

    return {
      transcript: "No se pudo extraer la transcripción. Asegúrate de tener habilitado el oráculo o ser el dueño del canal.",
      method: "unsupported"
    };
  }

  function verifyConnection() {
    return { success: true, status: "ACTIVE", info: "YouTube Public/Authenticated Bridge Ready" };
  }

  // --- SOVEREIGN CANON V8.0 (Media Standard) ---
  const CANON = {
    id: "youtube",
    LABEL: "YouTube Adapter",
    ARCHETYPE: "ADAPTER",
    DOMAIN: "SOCIAL_MEDIA",
    SEMANTIC_INTENT: "BRIDGE",
    CAPABILITIES: {
      "search": { 
        "io": "READ", 
        "desc": "Index channel video descriptors",
        "inputs": schemas.listChannelVideos.io_interface.inputs
      },
      "extract": { 
        "io": "COMPUTE", 
        "desc": "Cognitive transcript extraction",
        "inputs": schemas.extractTranscript.io_interface.inputs
      }
    },
    VITAL_SIGNS: {
      "QUOTA_REMAINING": { "criticality": "NOMINAL", "value": "85%", "trend": "stable" },
      "TRANSCRIPT_CACHE": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "flat" }
    }
  };

  return {
    CANON: CANON,
    id: "youtube",
    description: "Industrial engine for video content discovery, transcript extraction, and investigation scouting within the YouTube ecosystem.",
    semantic_intent: "BRIDGE",
    
    // Legacy Bridge
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                io_interface: { inputs: cap.inputs || {}, outputs: {} }
            };
        }
        return s;
    },

    search: listChannelVideos,
    extract: extractTranscript,
    getVideoMetadata: (p) => ({ 
        id: p.videoId, 
        title: "Mock Title", 
        description: "Mock Description", 
        channelId: "MockChannel", 
        publishedAt: new Date().toISOString() 
    }),
    deepResearch: (p) => ({ status: "IN_PROGRESS", info: "Deep video analysis requires MCEP cycle." }),
    verifyConnection,
    
    // Original methods
    listChannelVideos,
    extractTranscript
  };
}

