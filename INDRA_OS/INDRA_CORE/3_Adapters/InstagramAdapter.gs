// ======================================================================
// ARTEFACTO: 3_Adapters/InstagramAdapter.gs
// DHARMA: Ser el orquestador de interacciones sociales en Instagram.
// PROPÓSITO: Proporcionar acceso a la API de Instagram Graph (Meta)
//            usando el token de acceso gestionado por TokenManager.
// ======================================================================

function createInstagramAdapter({ errorHandler, tokenManager }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[InstagramAdapter] errorHandler contract not fulfilled');
  }
  if (!tokenManager || typeof tokenManager.getToken !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', '[InstagramAdapter] tokenManager es obligatorio');
  }

  const BASE_URL = 'https://graph.facebook.com/v24.0';

  // ============================================================
  // LÓGICA PRIVADA: Ayudantes
  // ============================================================

  function _getConnectionData(accountId = null) {
    try {
      const tokenData = tokenManager.getToken({ provider: 'instagram', accountId });
      if (!tokenData || !tokenData.apiKey) {
        throw new Error(`No se encontró apiKey para el proveedor instagram`);
      }
      return {
        apiKey: tokenData.apiKey,
        igUserId: tokenData.igUserId || tokenData.accountId // Priorizar igUserId si existe
      };
    } catch (e) {
      throw errorHandler.createError('CONFIGURATION_ERROR', `[InstagramAdapter] Error al obtener token: ${e.message}`);
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
            throw errorHandler.createError('RATE_LIMIT_EXCEEDED', `Instagram Rate Limit: ${errorData.error.message}`, { statusCode, errorData });
        }
        throw errorHandler.createError('INSTAGRAM_API_ERROR', `Instagram API error (${statusCode}): ${errorData.error.message}`, { statusCode, errorData });
      }

      return JSON.parse(responseText);

    } catch (e) {
      if (e.code) throw e;
      throw errorHandler.createError('SYSTEM_FAILURE', `[InstagramAdapter] ${e.message}`);
    }
  }

  // --- AXIOM CANON: Normalización Semántica ---

  function _mapProfile(raw) {
    return {
      id: raw.id,
      handle: raw.username,
      displayName: raw.name || raw.username,
      bio: raw.biography || "",
      avatarUrl: raw.profile_picture_url || null,
      stats: {
        followers: raw.followers_count || 0,
        following: raw.follows_count || 0,
        posts: raw.media_count || 0
      },
      raw: raw
    };
  }

  function _mapMedia(raw) {
    const typeMap = {
      'IMAGE': 'IMAGE',
      'VIDEO': 'VIDEO',
      'CAROUSEL_ALBUM': 'CAROUSEL'
    };
    return {
      id: raw.id,
      type: typeMap[raw.media_type] || 'UNKNOWN',
      url: raw.media_url,
      caption: raw.caption || "",
      permalink: raw.permalink,
      timestamp: raw.timestamp,
      author: raw.username,
      stats: {
        likes: raw.like_count || 0,
        comments: raw.comments_count || 0
      },
      raw: raw
    };
  }

  function _mapComment(raw) {
    return {
      id: raw.id,
      author: {
        id: raw.from ? raw.from.id : null,
        handle: raw.from ? raw.from.username : (raw.username || "anonymous")
      },
      text: raw.text,
      timestamp: raw.timestamp,
      stats: {
        likes: raw.like_count || 0
      },
      hidden: !!raw.hidden,
      raw: raw
    };
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================

  function getUserProfile(payload = {}) {
    const { accountId = null } = payload;
    const { apiKey, igUserId } = _getConnectionData(accountId);
    
    if (!igUserId) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.getUserProfile] igUserId es obligatorio');

    const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count';
    const url = `${BASE_URL}/${igUserId}?fields=${fields}`;
    
    const response = _executeRequest(url, { apiKey });
    return _mapProfile(response);
  }

  function getMedia(payload = {}) {
    const { accountId = null, limit = 10 } = payload;
    const { apiKey, igUserId } = _getConnectionData(accountId);

    if (!igUserId) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.getMedia] igUserId es obligatorio');

    const fields = 'id,caption,media_type,media_url,permalink,timestamp,username,like_count,comments_count';
    const url = `${BASE_URL}/${igUserId}/media?fields=${fields}&limit=${limit}`;
    
    const response = _executeRequest(url, { apiKey });
    const items = (response.data || []).map(m => _mapMedia(m));

    // AXIOMA: Reducción de Entropía (Esquema de Media)
    const schema = {
      columns: [
        { id: 'caption', label: 'CAPTION', type: 'STRING' },
        { id: 'type', label: 'TIPO', type: 'STRING' },
        { id: 'timestamp', label: 'FECHA', type: 'DATE' },
        { id: 'permalink', label: 'VER', type: 'URL' }
      ]
    };

    return {
      results: items,
      items: items, // Backward compatibility
      ORIGIN_SOURCE: 'instagram',
      SCHEMA: schema,
      PAGINATION: {
        hasMore: !!response.paging?.next,
        nextToken: response.paging?.next || null,
        total: items.length,
        count: items.length
      },
      IDENTITY_CONTEXT: {
        accountId: accountId,
        permissions: {
          canEdit: true,
          role: 'owner'
        }
      }
    };
  }

  function getMediaComments(payload) {
    const { mediaId, accountId = null } = payload;
    if (!mediaId) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.getMediaComments] mediaId es obligatorio');
    
    const { apiKey } = _getConnectionData(accountId);
    const fields = 'id,from,text,timestamp,hidden,like_count';
    const url = `${BASE_URL}/${mediaId}/comments?fields=${fields}`;
    
    const response = _executeRequest(url, { apiKey });
    const items = (response.data || []).map(c => _mapComment(c));

    // AXIOMA: Reducción de Entropía (Esquema de Comentarios)
    const schema = {
      columns: [
        { id: 'text', label: 'COMENTARIO', type: 'STRING' },
        { id: 'timestamp', label: 'FECHA', type: 'DATE' },
        { id: 'author', label: 'AUTOR', type: 'STRING' }
      ]
    };

    return {
      results: items,
      comments: items, // Original property
      items: items,    // Vault compatibility
      ORIGIN_SOURCE: 'instagram',
      SCHEMA: schema,
      PAGINATION: {
        hasMore: !!response.paging?.next,
        nextToken: response.paging?.next || null,
        total: items.length,
        count: items.length
      },
      IDENTITY_CONTEXT: {
        accountId: accountId,
        permissions: {
          canEdit: true,
          role: 'owner'
        }
      }
    };
  }

  function postComment(payload) {
    const { mediaId, message, accountId = null } = payload;
    if (!mediaId || !message) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.postComment] mediaId y message son obligatorios');

    const { apiKey } = _getConnectionData(accountId);
    const url = `${BASE_URL}/${mediaId}/comments`;
    
    return _executeRequest(url, { 
      apiKey, 
      method: 'post', 
      payload: { message } 
    });
  }

  function replyComment(payload) {
    const { commentId, message, accountId = null } = payload;
    if (!commentId || !message) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.replyComment] commentId y message son obligatorios');

    const { apiKey } = _getConnectionData(accountId);
    const url = `${BASE_URL}/${commentId}/replies`;
    
    return _executeRequest(url, { 
      apiKey, 
      method: 'post', 
      payload: { message } 
    });
  }

  function getInsights(payload) {
    const { targetId, metrics, accountId = null } = payload;
    if (!targetId || !metrics || !Array.isArray(metrics)) {
        throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.getInsights] targetId y metrics (array) son obligatorios');
    }

    const { apiKey } = _getConnectionData(accountId);
    const url = `${BASE_URL}/${targetId}/insights?metric=${metrics.join(',')}`;
    
    return _executeRequest(url, { apiKey });
  }

  function publishMedia(payload) {
    const { imageUrl, caption, accountId = null } = payload;
    if (!imageUrl) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.publishMedia] imageUrl es obligatorio');

    const { apiKey, igUserId } = _getConnectionData(accountId);
    if (!igUserId) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.publishMedia] igUserId es obligatorio');

    // Crear el contenedor
    const containerUrl = `${BASE_URL}/${igUserId}/media`;
    const containerResponse = _executeRequest(containerUrl, {
      apiKey,
      method: 'post',
      payload: { image_url: imageUrl, caption }
    });

    const creationId = containerResponse.id;

    // Esperar procesamiento si es video (Heurística simple: URL contiene .mp4 o mediaType es VIDEO)
    // En una implementación ultra-robusta, esto se manejaría con un job asincrónico del Core,
    // pero para el adaptador, retornamos el ID y el Core decidirá si esperar o seguir.

    // Publicar el contenedor
    const publishUrl = `${BASE_URL}/${igUserId}/media_publish`;
    return _executeRequest(publishUrl, {
      apiKey,
      method: 'post',
      payload: { creation_id: creationId }
    });
  }

  function sendDirectMessage(payload) {
    const { recipientId, message, accountId = null } = payload;
    if (!recipientId || !message) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.sendDirectMessage] recipientId y message son obligatorios');

    const { apiKey, igUserId } = _getConnectionData(accountId);
    if (!igUserId) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.sendDirectMessage] igUserId es obligatorio');

    const url = `${BASE_URL}/${igUserId}/messages`;
    
    return _executeRequest(url, { 
      apiKey, 
      method: 'post', 
      payload: {
        recipient: { id: recipientId },
        message: { text: message }
      }
    });
  }

  function receive(payload) {
    const { webhookEvent } = payload;
    if (!webhookEvent) throw errorHandler.createError('INVALID_INPUT', '[InstagramAdapter.receive] webhookEvent es obligatorio');

    // Canon de Eventos Axiom
    const normalized = {
      source: 'social_instagram',
      type: 'unknown',
      data: webhookEvent,
      timestamp: new Date().toISOString()
    };

    if (webhookEvent.entry && webhookEvent.entry[0].changes) {
      const change = webhookEvent.entry[0].changes[0];
      normalized.type = change.field === 'comments' ? 'social_comment' : change.field;
      normalized.id = change.value.id;
    }

    return normalized;
  }

  /**
   * Verifica la conectividad y validez del token actual.
   * @param {object} payload - { accountId? }
   */
  function verifyConnection(payload = {}) {
    try {
      const response = getUserProfile(payload);
      return { 
        success: true, 
        message: "Conexión exitosa con Instagram",
        authenticatedAs: response.username 
      };
    } catch (e) {
      return { 
        success: false, 
        message: e.message 
      };
    }
  }

  // ============================================================
  // RETORNO DE INTERFAZ
  // ============================================================
  
  const schemas = {
    getUserProfile: {
      id: "READ_DATA",
      io: "READ",
      description: "Extracts an institutional technical profile from the Instagram Graph registry.",
      traits: ["SOCIAL_PROFILE", "IDENTITY"]
    },
    getMedia: {
      id: "DATA_STREAM",
      io: "READ",
      description: "Extracts a chronological data stream of media resources.",
      traits: ["EXPLORE", "SOCIAL_MEDIA", "DATA_STREAM"]
    },
    getMediaComments: {
      id: "DATA_STREAM",
      io: "READ",
      description: "Extracts a technical interaction stream (comments) from a specific media resource.",
      traits: ["EXPLORE", "SOCIAL_MEDIA"]
    },
    postComment: {
        id: "WRITE_DATA",
        io: "WRITE",
        description: "Initializes a new technical interaction record (comment) upon a target media resource.",
        traits: ["COMMUNICATE", "POST"]
    },
    replyComment: {
        id: "SEND_REPLY",
        io: "WRITE",
        description: "Initializes a threaded linguistic response within the institutional social registry.",
        traits: ["COMMUNICATE", "REPLY"]
    },
    getInsights: {
        id: "READ_DATA",
        io: "READ",
        description: "Extracts high-integrity performance metrics and industrial telemetry.",
        traits: ["METRICS", "TELEMETRY"]
    },
    publishMedia: {
        id: "PROCESS_SIGNAL",
        io: "WRITE",
        description: "Orchestrates a multi-stage industrial publishing flow for social content resources.",
        traits: ["PUBLISHING", "AUTOMATION"]
    },
    sendDirectMessage: {
      id: "SEND_MESSAGE",
      io: "WRITE",
      description: "Orchestrates a technical interaction record (Direct Message).",
      traits: ["COMMUNICATE", "MESSAGING"]
    },
    verifyConnection: {
      id: "HEALTH_CHECK",
      io: "READ",
      description: "Executes a high-integrity health check of connectivity.",
      traits: ["DIAGNOSTICS"]
    }
  };

  // --- SOVEREIGN CANON V12.0 (Algorithmic Core) ---
  const CANON = {
      id: "instagram",
      archetype: "adapter",
      domain: "social_media",
      REIFICATION_HINTS: {
          id: "id",
          label: "username || name || caption || id",
          items: "results || items"
      },
      CAPABILITIES: schemas
  };

  return {
    id: "instagram",
    label: "Instagram Control Panel",
    archetype: CANON.archetype,
    domain: CANON.domain,
    semantic_intent: "social_media",
    description: "Industrial engine for Instagram Graph API integration, social interaction management, and performance telemetry.",
    CANON: CANON,
    // Protocol mapping (MESSENGER_V1)
    send: sendDirectMessage,
    receive,
    verifyConnection,
    // Original methods
    getUserProfile,
    getMedia,
    getMediaComments,
    postComment,
    replyComment,
    getInsights,
    publishMedia,
    sendDirectMessage
  };
}









