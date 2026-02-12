// ======================================================================
// ARTEFACTO: 3_Adapters/TikTokAdapter.gs
// DHARMA: Ser el orquestador de contenido de video en TikTok.
// PROPÓSITO: Proporcionar acceso a la TikTok Business API
//            usando el token de acceso gestionado por TokenManager.
// ======================================================================

function createTikTokAdapter({ errorHandler, tokenManager }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[TikTokAdapter] errorHandler contract not fulfilled');
  }
  if (!tokenManager || typeof tokenManager.getToken !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', '[TikTokAdapter] tokenManager es obligatorio');
  }

  const BASE_URL = 'https://open.tiktokapis.com/v1';

  // ============================================================
  // LÓGICA PRIVADA: Ayudantes
  // ============================================================

  function _getConnectionData(accountId = null) {
    try {
      const tokenData = tokenManager.getToken({ provider: 'tiktok', accountId });
      if (!tokenData || !tokenData.apiKey) {
        throw new Error(`No se encontró apiKey para el proveedor tiktok`);
      }
      return {
        apiKey: tokenData.apiKey,
        openId: tokenData.openId || tokenData.accountId
      };
    } catch (e) {
      throw errorHandler.createError('CONFIGURATION_ERROR', `[TikTokAdapter] Error al obtener token: ${e.message}`);
    }
  }

  function _executeRequest(url, options = {}) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: options.method || 'get',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + options.apiKey
        },
        payload: options.payload ? JSON.stringify(options.payload) : null,
        muteHttpExceptions: true
      });

      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (statusCode < 200 || statusCode >= 300) {
        let errorData;
        try { errorData = JSON.parse(responseText); } catch(e) { errorData = { error: { message: responseText } }; }
        
        if (statusCode === 429) {
            throw errorHandler.createError('RATE_LIMIT_EXCEEDED', `TikTok Rate Limit: ${errorData.error.message || responseText}`, { statusCode, errorData });
        }
        throw errorHandler.createError('TIKTOK_API_ERROR', `TikTok API error (${statusCode}): ${errorData.error.message || responseText}`, { statusCode, errorData });
      }

      return JSON.parse(responseText);

    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('SYSTEM_FAILURE', `[TikTokAdapter] ${e.message}`);
    }
  }

  // --- INDRA CANON: Normalización Semántica ---

  function _mapProfile(raw) {
    const data = raw.data || {};
    const user = data.user || {};
    return {
      id: user.open_id || user.union_id,
      handle: user.display_name,
      displayName: user.display_name,
      bio: user.bio_description || "",
      avatarUrl: user.avatar_url || null,
      stats: {
        followers: user.follower_count || 0,
        following: user.following_count || 0,
        posts: user.video_count || 0
      },
      raw: raw
    };
  }

  function _mapMedia(raw) {
    return {
      id: raw.id,
      type: 'VIDEO', // TikTok es inherentemente video
      url: raw.embed_link || raw.share_url,
      caption: raw.video_description || "",
      permalink: raw.share_url,
      timestamp: raw.create_time ? new Date(raw.create_time * 1000).toISOString() : null,
      author: raw.username || "unknown",
      stats: {
        likes: raw.like_count || 0,
        comments: raw.comment_count || 0
      },
      raw: raw
    };
  }

  function _mapComment(raw) {
    return {
      id: raw.id,
      author: {
        id: raw.user_id,
        handle: raw.username || "anonymous"
      },
      text: raw.text,
      timestamp: raw.create_time ? new Date(raw.create_time * 1000).toISOString() : null,
      stats: {
        likes: raw.digg_count || 0
      },
      hidden: false,
      raw: raw
    };
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================

  function getUserProfile(payload = {}) {
    const { accountId = null } = payload;
    const { apiKey } = _getConnectionData(accountId);
    const url = `${BASE_URL}/user/info/`;
    const response = _executeRequest(url, { apiKey });
    return _mapProfile(response);
  }

  function getVideos(payload = {}) {
    const { accountId = null, limit = 10, cursor = null } = payload;
    const { apiKey } = _getConnectionData(accountId);
    let url = `${BASE_URL}/video/list/?max_count=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    
    const response = _executeRequest(url, { apiKey });
    return {
      videos: (response.data?.videos || []).map(v => _mapMedia(v)),
      cursor: response.data?.cursor,
      hasMore: response.data?.has_more
    };
  }

  function getVideoComments(payload) {
    const { videoId, accountId = null, limit = 10, cursor = null } = payload;
    if (!videoId) throw errorHandler.createError('INVALID_INPUT', '[TikTokAdapter.getVideoComments] videoId es obligatorio');
    
    const { apiKey } = _getConnectionData(accountId);
    let url = `${BASE_URL}/video/${videoId}/comments/?max_count=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    
    const response = _executeRequest(url, { apiKey });
    return {
      comments: (response.data?.comments || []).map(c => _mapComment(c)),
      cursor: response.data?.cursor,
      hasMore: response.data?.has_more
    };
  }

  function replyComment(payload) {
    const { commentId, message, accountId = null } = payload;
    if (!commentId || !message) throw errorHandler.createError('INVALID_INPUT', '[TikTokAdapter.replyComment] commentId y message son obligatorios');

    const { apiKey } = _getConnectionData(accountId);
    const url = `${BASE_URL}/comment/reply/`;
    
    return _executeRequest(url, { 
      apiKey, 
      method: 'post', 
      payload: { 
        comment_id: commentId,
        content: message 
      } 
    });
  }

  function publishVideo(payload) {
    const { videoUrl, description, accountId = null, privacyLevel = 'PUBLIC' } = payload;
    if (!videoUrl) throw errorHandler.createError('INVALID_INPUT', '[TikTokAdapter.publishVideo] videoUrl es obligatorio');

    const { apiKey } = _getConnectionData(accountId);

    // Crear el upload
    const uploadUrl = `${BASE_URL}/video/upload/`;
    const uploadResponse = _executeRequest(uploadUrl, {
      apiKey,
      method: 'post',
      payload: { source: 'PULL_FROM_URL', video_url: videoUrl }
    });

    const tiktokUploadUrl = uploadResponse.data.upload_url;

    // Publicar
    const publishUrl = `${BASE_URL}/video/publish/`;
    return _executeRequest(publishUrl, {
      apiKey,
      method: 'post',
      payload: {
        data: {
          video: {
            source: 'PULL_FROM_URL',
            upload_url: tiktokUploadUrl,
            description: description,
            privacy_level: privacyLevel
          }
        }
      }
    });
  }

  function getAnalytics(payload) {
    const { targetId, metrics, accountId = null, startDate, endDate } = payload;
    const { apiKey } = _getConnectionData(accountId);

    let url;
    if (targetId) {
        url = `${BASE_URL}/video/${targetId}/analytics/?fields=${metrics.join(',')}`;
    } else {
        url = `${BASE_URL}/user/analytics/?metrics=${metrics.join(',')}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
    }
    
    return _executeRequest(url, { apiKey });
  }

  /**
   * MÉTODO COMPUESTO: Obtiene los videos con mejor rendimiento.
   */

  function receive(payload) {
    const { webhookEvent } = payload;
    if (!webhookEvent) throw errorHandler.createError('INVALID_INPUT', '[TikTokAdapter.receive] webhookEvent es obligatorio');

    // Canon de Eventos Indra
    return {
      source: 'social_tiktok',
      type: webhookEvent.event === 'video.publish' ? 'social_media_published' : (webhookEvent.event || 'unknown'),
      data: webhookEvent.data,
      open_id: webhookEvent.user ? webhookEvent.user.open_id : null,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================
  // RETORNO DE INTERFAZ
  // ============================================================
  
  const schemas = {
    getUserProfile: {
      description: "Extracts institucional profile data from the TikTok Business circuit.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        },
        outputs: {
          profile: { type: "object", io_behavior: "STREAM", description: "Indra SocialProfile: { id, handle, displayName, bio, avatarUrl, stats, raw }" }
        }
      }
    },
    getVideos: {
      description: "Extracts an industrial list of video entries from the target TikTok repository.",
      semantic_intent: "SENSOR",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." },
          limit: { type: "number", io_behavior: "SCHEMA", description: "Maximum quantity of video descriptors to return." },
          cursor: { type: "string", io_behavior: "SCHEMA", description: "Technical cursor for stream pagination." }
        },
        outputs: {
          videos: { type: "array", io_behavior: "STREAM", description: "Collection of Indra SocialMedia: { id, type, url, caption, permalink, timestamp, author, stats, raw }" }
        }
      }
    },
    getVideoComments: {
      description: "Extracts comment threads from a specific TikTok video resource.",
      semantic_intent: "SENSOR",
      io_interface: {
        inputs: {
          videoId: { type: "string", io_behavior: "GATE", description: "Target video resource identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." },
          limit: { type: "number", io_behavior: "SCHEMA", description: "Technical pagination limit." }
        },
        outputs: {
          comments: { type: "array", io_behavior: "STREAM", description: "Collection of Indra SocialComment: { id, author, text, timestamp, stats, hidden, raw }" }
        }
      }
    },
    replyComment: {
      description: "Dispatches a linguistic response to an existing TikTok comment resource.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          commentId: { type: "string", io_behavior: "GATE", description: "Target comment identifier." },
          message: { type: "string", io_behavior: "STREAM", description: "Linguistic response content." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
        },
        outputs: {
          result: { type: "object", io_behavior: "PROBE", description: "Dispatch confirmation status." }
        }
      }
    },
    publishVideo: {
      description: "Orchestrates institucional video publication via external resource URL (pull-mode).",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          videoUrl: { type: "string", io_behavior: "STREAM", description: "Source video resource URL." },
          description: { type: "string", io_behavior: "STREAM", description: "Institutional video descriptor text." },
          privacyLevel: { type: "string", io_behavior: "SCHEMA", description: "Visibility status configuration." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          result: { type: "object", io_behavior: "PROBE", description: "Publication status confirmation." }
        }
      }
    },
    getAnalytics: {
      description: "Extracts high-integrity performance metrics from the TikTok Business circuit.",
      semantic_intent: "SENSOR",
      io_interface: {
        inputs: {
          targetId: { type: "string", io_behavior: "GATE", description: "Optional specific resource identifier focus." },
          metrics: { type: "array", io_behavior: "SCHEMA", description: "Collection of requested technical metrics." },
          startDate: { type: "string", io_behavior: "SCHEMA", description: "Institutional start temporal marker." },
          endDate: { type: "string", io_behavior: "SCHEMA", description: "Institutional end temporal marker." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        },
        outputs: {
          metricsData: { type: "object", io_behavior: "STREAM", description: "Resulting industrial metrics data stream." }
        }
      }
    }
  };

  function verifyConnection(payload = {}) {
    try {
      getUserProfile(payload);
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  function send() {
    return { success: false, info: "Direct Messaging not supported by current TikTok Business API scope." };
  }

  return {
    description: "Industrial bridge for TikTok Business API integration, video content management, and performance telemetry.",
    semantic_intent: "BRIDGE",
    schemas: schemas,
    // Protocol mapping (MESSENGER_V1)
    send,
    receive,
    verifyConnection,
    // Original methods
    getUserProfile,
    getVideos,
    getVideoComments,
    replyComment,
    publishVideo,
    getAnalytics
  };
}

