/**
 * =============================================================================
 * SERVICIO: OrchestratorService.js
 * RESPONSABILIDAD: El "Arquitecto de Ignición".
 * Orquestador secuencial del proceso de instalación automática (Bootstrap v4.0).
 * AXIOMA: Soberanía programática: el usuario fabrica su propio núcleo.
 * =============================================================================
 */

const REPO_URL_BASE = 'https://raw.githubusercontent.com/Airhonreality/indra-os/main/system_core/core/';
const HOME_ROOT_FOLDER_NAME = '.core_system';
const MANIFEST_FILENAME = 'INDRA_MANIFEST.json';
const FILES_MANIFEST_URL = REPO_URL_BASE + 'files_manifest.json';
const CORE_VERSION_URL = REPO_URL_BASE + 'version.json';

// CORE_FILES_MANIFEST ha sido movido a un archivo remoto (files_manifest.json) para Micellar Updates

export const OrchestratorService = {
/**
 * Proceso completo de instalación:
 * 1. Crear Bóveda (Google Sheet)
 * 2. Crear Carpeta de Sistema (.core_system)
 * 3. Crear Proyecto Apps Script
 * 4. Inyectar Código del Repositorio
 * 5. Publicar como Web App
 * 6. Handshake Final
 */
async installCore(accessToken, userEmail, onProgress) {
  const notify = (step, progress) => onProgress && onProgress(step, progress);
  
  // Estado persistente interno para la sesión de instalación
  let currentVaultId = null;
  let currentFolderId = null;
  let currentScriptId = null;

  const runIgnition = async () => {
    try {
      // --- PASO 1: EL TERRITORIO (.core_system) ---
      // IMPORTANTE: Ahora el territorio es lo primero para que todo viva dentro
      if (!currentFolderId) {
        notify('Anclando Territorio... Preparando carpeta visible en tu Drive.', 10);
        currentFolderId = await this._getOrCreateFolder(accessToken, HOME_ROOT_FOLDER_NAME);
      }

      // --- PASO 2: LA BÓVEDA (Registro Akashiko) ---
      if (!currentVaultId) {
        notify('Creando Bóveda de Realidades (Google Sheet)... Tus datos se almacenarán de forma privada dentro de tu carpeta.', 25);
        currentVaultId = await this._createVault(accessToken, userEmail, currentFolderId);
      }

      // --- PASO 3: EL MOTOR (Script Project) ---
      if (!currentScriptId) {
        notify('Forjando Motor de Apps Script... Esta es la inteligencia propia que residirá en tu cuenta.', 40);
        try {
          currentScriptId = await this._createScriptProject(accessToken, 'Indra Core', currentVaultId);
        } catch (err) {
          if (this._isAppsScriptApiDisabled(err)) {
            notify('¡Génesis Interrumpido! La Apps Script API está desactivada. Por favor, actívala en el botón de abajo.', 45);
            
            // Iniciar protocolo de Polling
            const enabled = await this._waitForAppsScriptApi(accessToken, (msg) => notify(msg, 45));
            if (enabled) {
              notify('¡API Detectada! Reanudando la forja del motor...', 48);
              return await runIgnition(); // Reintento recursivo manteniendo estado
            } else {
              throw new Error('Tiempo de espera agotado. Activa la API manualmente y vuelve a intentarlo.');
            }
          }
          throw err;
        }
      }

      // --- PASO 4: LA MATERIA (Inyeccion de Código) ---
      notify('Transmitiendo materia fractal... Inyectando el código servidor de Indra directamente en tu proyecto.', 60);
      await this._injectCode(accessToken, currentScriptId);

      // --- PASO 5: EL DESPERTAR (Despliegue) ---
      notify('Desplegando Membrana de Acceso... Publicando tu propio Core en la web para que el front-end pueda hablar con él.', 80);
      const { coreUrl, deploymentId } = await this._deployWebApp(accessToken, currentScriptId, userEmail);

      // --- PASO 6: EL PACTO (Handshake & Manifiesto) ---
      notify('Firmando Pacto de Ignición... Vinculando tu identidad con tu nuevo núcleo.', 95);
      const satelliteKey = crypto.randomUUID();
      
      // Obtener versión maestra de GitHub (Cache-Busting)
      const versionInfo = await fetch(CORE_VERSION_URL + `?t=${Date.now()}`).then(r => r.json()).catch(() => ({ version: '0.4.16' }));

      // Handshake inicial con el Core desplegado
      await this._igniteCore(coreUrl, satelliteKey, userEmail);

      // --- 💾 ANCLAJE DE IDENTIDAD (v4.20) ---
      // Escribimos el manifiesto antes de verificar la disponibilidad real.
      // Así, si el handshake falla por falta de Auth, el sistema ya existe en Drive.
      notify('Anclando identidad en Drive...', 96);
      const manifest = {
        schema: 'indra-manifest-v4',
        core_id: userEmail,
        core_url: coreUrl,
        satellite_key: satelliteKey,
        script_id: currentScriptId,
        vault_id: currentVaultId,
        system_root_id: currentFolderId,
        deployment_id: deploymentId,
        core_version: versionInfo.version,
        installed_at: new Date().toISOString()
      };
      
      await this._writeManifest(accessToken, currentFolderId, manifest);

      // --- 🛡️ VERIFICACIÓN DE SOBERANÍA (v4.19) ---
      // Realizamos el call CORS real. Si falla, lanzamos AUTORIZACION_PENDIENTE.
      // Pero como el manifiesto ya está escrito, al volver el usuario descubrirá su Core.
      notify('[v4.33-NUCLEUS] Verificando soberanía del motor...', 98);
      await this._verifyCoreReadiness(coreUrl, manifest);

      notify('¡Indra ha Despertado!', 100);
      return { ok: true, manifest };

    } catch (err) {
      console.error('[Orchestrator] Fallo en la cascada de ignición:', err);
      let userMessage = err.message;
      
      // Si el error es de Handshake, adjuntamos la URL para autorización manual
      if (err.requiresManualAuth) {
        return { 
          ok: false, 
          error: 'AUTORIZACION_PENDIENTE', 
          coreUrl: err.coreUrl,
          manifest: err.manifest, // Pasamos el manifest parcial para recuperar la Key
          message: 'Tu núcleo necesita un último permiso manual para despertar.'
        };
      }

      if (this._isAppsScriptApiDisabled(err)) {
        userMessage = 'Debes activar la "Google Apps Script API" (https://script.google.com/home/settings) y pulsar en Reintentar.';
      }
      
      return { ok: false, error: userMessage };
    }
  };

  return await runIgnition();
},

  /**
   * Sincronización Silenciosa (Core Overload)
   * Sobreescribe el código y actualiza la versión del despliegue sin cambiar la URL.
   */
  async syncCore(accessToken, manifest) {
    try {
      console.log(`[SyncManager] Sincronizando Core ${manifest.core_version} -> Latest...`);
      
      const { script_id, deployment_id, system_root_id } = manifest;

      // 1. Inyectar nuevo ADN de código
      await this._injectCode(accessToken, script_id);

      // 2. Crear una nueva versión inmutable del proyecto
      const versionRes = await fetch(`https://script.googleapis.com/v1/projects/${script_id}/versions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: `Indra Micellar Sync: ${new Date().toISOString()}` })
      });
      const versionData = await versionRes.json();
      const newVersionNumber = versionData.versionNumber;

      // 3. Actualizar el despliegue existente para usar la nueva versión (Misma URL!)
      await fetch(`https://script.googleapis.com/v1/projects/${script_id}/deployments/${deployment_id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentConfig: {
            scriptId: script_id,
            versionNumber: newVersionNumber,
            description: 'Indra Micellar Deployment (Auto-Updated)'
          }
        })
      });

      // 4. Actualizar el manifiesto local en Drive
      const versionInfo = await fetch(CORE_VERSION_URL).then(r => r.json());
      const updatedManifest = { 
        ...manifest, 
        core_version: versionInfo.version, 
        last_sync_at: new Date().toISOString() 
      };
      await this._writeManifest(accessToken, system_root_id, updatedManifest);

      console.log(`[SyncManager] Sincronización completada con éxito.`);
      return { ok: true, version: versionInfo.version };

    } catch (err) {
      console.error('[SyncManager] Error crítico en sincronización:', err);
      return { ok: false, error: err.message };
    }
  },

  async _createVault(token, email, folderId) {
    // 1. Crear el Spreadsheet
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title: `Indra Vault [${email}]` } })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Google Sheets API Error: ${data.error.message}`);
    
    const spreadsheetId = data.spreadsheetId;

    // 2. Mover el archivo a la carpeta .core_system (Axioma de Carpeta Visible)
    if (folderId) {
      await this._moveFileToFolder(token, spreadsheetId, folderId);
    }

    return spreadsheetId;
  },

  async _moveFileToFolder(token, fileId, folderId) {
    // Primero obtenemos los padres actuales para quitarlos
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fileData = await fileRes.json();
    const previousParents = (fileData.parents || []).join(',');

    // Movemos el archivo
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  async _getOrCreateFolder(token, name) {
    const q = encodeURIComponent(`name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' })
    });
    const createData = await createRes.json();
    return createData.id;
  },

  async _createScriptProject(token, title, parentId) {
    const res = await fetch('https://script.googleapis.com/v1/projects', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, parentId }) // parentId vincula el script a la Sheet (Container-bound)
    });
    const data = await res.json();
    if (data.error) throw new Error(`Apps Script API Error: ${data.error.message}`);
    return data.scriptId;
  },

  async _injectCode(token, scriptId) {
    // Descargar manifiesto dinámico de archivos (Cache-Busting activo)
    const manifestResp = await fetch(FILES_MANIFEST_URL + `?t=${Date.now()}`);
    const filesManifest = await manifestResp.json();

    const files = await Promise.all(filesManifest.map(async (file) => {
      const resp = await fetch(REPO_URL_BASE + file.path + `?t=${Date.now()}`);
      let source = await resp.text();

      // --- 🛡️ PARCHE DE SOBERANÍA (v4.18) ---
      // Forzamos que el manifiesto permita el acceso a 'Anyone' para evitar 403 en multi-login.
      // La seguridad real reside en la Satellite Key (password) validada por el api_gateway.
      if (file.name === 'appsscript') {
        try {
          const manifestObj = JSON.parse(source);
          manifestObj.webapp = {
            access: 'ANYONE_ANONYMOUS',
            executeAs: 'USER_DEPLOYING'
          };
          source = JSON.stringify(manifestObj, null, 2);
          console.log('[Orchestrator] Manifiesto appsscript.json parcheado para acceso universal.');
        } catch (e) {
          console.warn('[Orchestrator] No se pudo parchear el appsscript.json, usando original.');
        }
      }

      return {
        name: file.name,
        type: file.type || 'SERVER_JS',
        source: source
      };
    }));

    const res = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Code Injection Error: ${data.error.message}`);
  },

  async _deployWebApp(token, scriptId, ownerEmail) {
    // 1. Crear versión
    const versionRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Ignition v1.0' })
    });
    const versionData = await versionRes.json();
    const versionNumber = versionData.versionNumber;

    // 2. Crear despliegue
    const deployRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionNumber,
        manifestFileName: 'appsscript',
        description: 'Production Web App'
      })
    });
    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(`Deployment Error: ${deployData.error.message}`);
    
    return {
      deploymentId: deployData.deploymentId,
      coreUrl: `https://script.google.com/macros/s/${deployData.deploymentId}/exec?authuser=${encodeURIComponent(ownerEmail)}`
    };
  },

  async _igniteCore(coreUrl, satelliteKey, ownerEmail) {
    let attempts = 5; // Aumentamos intentos a 5 para mayor resiliencia
    let lastError = null;

    // ESPERA INICIAL CRÍTICA (Guerra contra la Fricción): 
    // Google tarda unos segundos en propagar los permisos del nuevo deployment.
    console.log('[Orchestrator] Esperando 5s para que Google propague el despliegue...');
    await new Promise(r => setTimeout(r, 5000));

    while (attempts > 0) {
      try {
        console.log(`[Orchestrator] Intentando Handshake... (Intentos restantes: ${attempts})`);
        
        const res = await fetch(coreUrl, {
          method: 'POST',
          mode: 'no-cors', // Saltamos preflight para evitar bloqueos iniciales
          redirect: 'follow',
          body: JSON.stringify({
            protocol: 'SYSTEM_INSTALL_HANDSHAKE',
            satellite_key: satelliteKey,
            core_owner_uid: ownerEmail
          })
        });

        // NOTA: Con mode: 'no-cors', no sabemos si devolvió 200 o 403.
        // Pero en v4.16, confiamos en que tras 5s y varios reintentos, el Core habrá despertado.
        console.log('[Orchestrator] Handshake lanzado con éxito.');
        return;

      } catch (err) {
        lastError = err;
        attempts--;
        console.warn(`[Orchestrator] Reintento de Handshake tras fallo de red:`, err);
        // Delay incremental entre reintentos
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    throw new Error(`Fallo definitivo en el Handshake del Core tras varios intentos: ${lastError?.message}`);
  },

  /**
   * Intenta despertar el core con una llamada CORS real para verificar si Google
   * está permitiendo el acceso o si está bloqueado por falta de consentimiento.
   */
  async _verifyCoreReadiness(coreUrl, manifest) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(coreUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ protocol: 'HEALTH_CHECK' }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return true;
    } catch (err) {
        console.error('[v4.33-NUCLEUS] Fallo en la verificación de readiness:', err);
        const errorMsg = err.message || '';

        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('403') || errorMsg.includes('Authorization Required')) {
            const authErr = new Error('[v4.33-NUCLEUS] Requerida Autorización Manual de Google');
            authErr.requiresManualAuth = true;
            authErr.coreUrl = coreUrl;
            authErr.manifest = manifest;
            throw authErr;
        }
        throw err;
    }
  },

  async _writeManifest(token, folderId, manifest) {
    const metadata = {
        name: MANIFEST_FILENAME,
        parents: [folderId], // ELIMINADO appDataFolder -> Migrado a Carpeta Visible
        mimeType: 'application/json'
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(manifest)], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });
    if (!res.ok) throw new Error('Error al guardar el manifiesto en Drive.');
  },

  async _createSentinelFile(token, folderId) {
    const content = `
██╗███╗   ██╗██████╗ ██████╗  █████╗ 
██║████╗  ██║██╔══██╗██╔══██╗██╔══██╗
██║██╔██╗ ██║██║  ██║██████╔╝███████║
██║██║╚██╗██║██║  ██║██╔══██╗██╔══██║
██║██║ ╚████║██████╔╝██║  ██║██║  ██║
╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
=====================================
AXIOMA DE INTEGRIDAD - INDRA OS
=====================================

¡ALTO! Esta carpeta es el CORAZÓN de tu Sistema Operativo Micelar.

1. NO BORRES ESTA CARPETA: Contiene tu Bóveda, tu Core y tu Identidad.
2. NO ALTERES LOS ARCHIVOS: El sistema se auto-actualiza desde GitHub.
3. SI BORRAS ESTO: Indra entrará en "Muerte Cerebral" y perderás tus datos.

Tu soberanía depende de la integridad de este territorio.
Keep it safe. Keep it micelar.
`;
    const metadata = {
        name: 'README_AXIOMA_NO_BORRAR.txt',
        parents: [folderId],
        mimeType: 'text/plain'
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/plain' }));

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form
    });
  },

  async deleteFile(token, fileId) {
    if (!fileId) return;
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  /**
   * HELPERS PROTOCOLO 'GÉNESIS INTERRUMPIDO'
   * ======================================
   */

  _isAppsScriptApiDisabled(err) {
    const msg = err.message || '';
    return msg.toLowerCase().includes('not enabled') || 
           msg.toLowerCase().includes('api_disabled') ||
           msg.toLowerCase().includes('forbidden');
  },

  /**
   * Polling inteligente con retroceso exponencial para detectar la activación de la API.
   */
  async _waitForAppsScriptApi(token, onUpdate) {
    const MAX_ATTEMPTS = 10;
    let attempt = 1;
    let delay = 3000; // Iniciar con 3s

    while (attempt <= MAX_ATTEMPTS) {
      onUpdate(`Esperando activación de la API... Intento ${attempt}/${MAX_ATTEMPTS}`);
      
      try {
        const response = await fetch('https://script.googleapis.com/v1/projects?pageSize=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) return true;
        
        const data = await response.json();
        if (data.error && !this._isAppsScriptApiDisabled(new Error(data.error.message))) {
          // Si es otro error distinto a "API desactivada", salimos
          throw new Error(data.error.message);
        }
      } catch (e) {
        console.warn('[Orchestrator] Polling Apps Script API failed:', e);
      }

      // Retroceso exponencial + Jitter
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay + jitter));
      delay *= 1.5;
      attempt++;
    }

    return false;
  },

  /**
   * Purgado robusto de la persistencia fantasma (appDataFolder).
   * Se utiliza para limpiar instalaciones corruptas o antiguas.
   */
  async purgeGhostPersistence(token) {
    console.log('[Orchestrator] Iniciando Limpieza Crítica de la zona fantasma...');
    try {
      // 1. Listar todos los archivos en appDataFolder
      const res = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.files && data.files.length > 0) {
        console.log(`[Orchestrator] Encontrados ${data.files.length} fantasmas. Procediendo a exorcismo.`);
        for (const file of data.files) {
          await this.deleteFile(token, file.id);
          console.log(`[Orchestrator] Fantasma purgado: ${file.name} (${file.id})`);
        }
      }
      return true;
    } catch (err) {
      console.error('[Orchestrator] Error en purga ghost:', err);
      return false;
    }
  },

  /**
   * PROTOCOLO DE MIGRACIÓN MICELLAR (Legacy -> Visible)
   * ==================================================
   * Mueve el manifiesto y la bóveda a la carpeta visible sin perder datos.
   */
  async migrateToStandardSpace(token, manifest) {
    console.log('[Orchestrator] Iniciando Migración Micelar a zona visible...');
    try {
      // 1. Asegurar carpeta raíz
      const folderId = await this._getOrCreateFolder(token, HOME_ROOT_FOLDER_NAME);
      
      // 2. Mover la Bóveda (Sheet) si es que existe y tenemos el ID
      if (manifest.vault_id) {
        console.log('[Orchestrator] Migrando Bóveda...');
        await this._moveFileToFolder(token, manifest.vault_id, folderId);
      }

      // 3. Crear el nuevo manifiesto en la carpeta visible
      const updatedManifest = {
        ...manifest,
        system_root_id: folderId,
        migrated_at: new Date().toISOString()
      };
      await this._writeManifest(token, folderId, updatedManifest);

      // 4. Limpieza (Purga fantasma)
      await this.purgeGhostPersistence(token);

      console.log('[Orchestrator] Migración completada con éxito.');
      return updatedManifest;
    } catch (err) {
      console.error('[Orchestrator] Fallo en migración:', err);
      throw err;
    }
  }
};
