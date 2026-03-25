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

    try {
      // --- PASO 1: LA BÓVEDA (Registro Akashiko) ---
      notify('Creando Bóveda de Realidades (Google Sheet)... Tus datos se almacenarán de forma privada solo para tus ojos.', 10);
      const vaultId = await this._createVault(accessToken, userEmail);

      // --- PASO 2: EL TERRITORIO (.core_system) ---
      notify('Anclando Territorio... Buscando o creando carpeta de sistema en tu Drive.', 25);
      const folderId = await this._getOrCreateFolder(accessToken, HOME_ROOT_FOLDER_NAME);

      // --- PASO 3: EL MOTOR (Script Project) ---
      notify('Forjando Motor de Apps Script... Esta es la inteligencia propia que residirá en tu cuenta.', 40);
      const scriptId = await this._createScriptProject(accessToken, 'Indra Core', vaultId);

      // --- PASO 4: LA MATERIA (Inyeccion de Código) ---
      notify('Transmitiendo materia fractal... Inyectando el código servidor de Indra directamente en tu proyecto.', 60);
      await this._injectCode(accessToken, scriptId);

      // --- PASO 5: EL DESPERTAR (Despliegue) ---
      notify('Desplegando Membrana de Acceso... Publicando tu propio Core en la web para que el front-end pueda hablar con él.', 80);
      const { coreUrl, deploymentId } = await this._deployWebApp(accessToken, scriptId);

      // --- PASO 6: EL PACTO (Handshake & Manifiesto) ---
      notify('Firmando Pacto de Ignición... Vinculando tu identidad con tu nuevo núcleo.', 95);
      const satelliteKey = crypto.randomUUID();
      
      // Obtener versión maestra de GitHub
      const versionInfo = await fetch(CORE_VERSION_URL).then(r => r.json()).catch(() => ({ version: '0.4.0' }));

      // Handshake inicial con el Core desplegado
      await this._igniteCore(coreUrl, satelliteKey, userEmail);

      // Escribir el manifiesto en Drive para autodescubrimiento
      const manifest = {
        schema: 'indra-manifest-v4',
        core_id: userEmail,
        core_url: coreUrl,
        satellite_key: satelliteKey,
        script_id: scriptId,
        vault_id: vaultId,
        system_root_id: folderId,
        deployment_id: deploymentId, // Crucial para auto-actualización
        core_version: versionInfo.version,
        installed_at: new Date().toISOString()
      };
      
      await this._writeManifest(accessToken, folderId, manifest);

      notify('¡Indra ha Despertado!', 100);
      return { ok: true, manifest };

    } catch (err) {
      console.error('[Orchestrator] Fallo en la cascada de ignición:', err);
      let userMessage = err.message;
      
      // Error crítico muy común que requiere guía al usuario
      if (err.message.includes('not enabled') || err.message.includes('API_DISABLED')) {
        userMessage = 'Debes activar la "Google Apps Script API" en tu cuenta (https://script.google.com/home/settings) para que Indra pueda forjar tu núcleo.';
      }
      
      return { ok: false, error: userMessage };
    }
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

  async _createVault(token, email) {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title: `Indra Vault [${email}]` } })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Google Sheets API Error: ${data.error.message}`);
    return data.spreadsheetId;
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
    // Descargar manifiesto dinámico de archivos
    const manifestResp = await fetch(FILES_MANIFEST_URL);
    const filesManifest = await manifestResp.json();

    const files = await Promise.all(filesManifest.map(async (file) => {
      const resp = await fetch(REPO_URL_BASE + file.path);
      const source = await resp.text();
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

  async _deployWebApp(token, scriptId) {
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
      coreUrl: `https://script.google.com/macros/s/${deployData.deploymentId}/exec`
    };
  },

  async _igniteCore(coreUrl, satelliteKey, ownerEmail) {
    let attempts = 3;
    let lastError = null;

    while (attempts > 0) {
      try {
        console.log(`[Orchestrator] Intentando Handshake... (Intentos restantes: ${attempts})`);
        
        // Pequeño delay para dejar que Google propague el despliegue
        await new Promise(r => setTimeout(r, 2000));

        const res = await fetch(coreUrl, {
          method: 'POST',
          mode: 'no-cors', // Algunos navegadores bloquean el POST a GAS por falta de preflight
          redirect: 'follow',
          body: JSON.stringify({
            protocol: 'SYSTEM_INSTALL_HANDSHAKE',
            satellite_key: satelliteKey,
            core_owner_uid: ownerEmail
          })
        });

        // NOTA: Con mode: 'no-cors', no podemos leer la respuesta JSON, 
        // pero la ignición se ejecutará en el servidor. 
        // Para Indra v4.5, asumimos éxito si la red no explota.
        console.log('[Orchestrator] Handshake lanzado con éxito.');
        return;

      } catch (err) {
        lastError = err;
        attempts--;
        console.warn(`[Orchestrator] Reintento de Handshake tras error:`, err);
      }
    }

    throw new Error(`Fallo definitivo en el Handshake del Core tras varios intentos: ${lastError?.message}`);
  },

  async _writeManifest(token, folderId, manifest) {
    const metadata = {
        name: MANIFEST_FILENAME,
        parents: ['appDataFolder'], // El manifiesto se guarda en la ZONA FANTASMA
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
  }
};
