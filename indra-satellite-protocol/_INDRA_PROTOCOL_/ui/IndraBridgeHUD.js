/**
 * =============================================================================
 * INDRA BRIDGE HUD (Standard Edition v8.0)
 * =============================================================================
 * Responsibility: Layout Orchestration (2-Column Dense Mode).
 * Theme: Light Mode (Industrial Alabaster).
 * =============================================================================
 */

import { FormGenerator } from './engines/FormGenerator.js';
import { WorkspaceController } from './components/WorkspaceController.js';
import { SchemaExplorer } from './components/SchemaExplorer.js';
import './widgets/IndraHUDTree.js';

const STYLES = `
    :host {
        display: block; position: fixed; top: 0; left: 0; width: 100%; z-index: 1000000; pointer-events: none;
        font-family: 'Inter', system-ui, sans-serif;
        --indra-accent: #007AFF; --indra-bg: #ffffff; --indra-surface: #f2f2f7;
        --indra-border: rgba(60, 60, 67, 0.12); --indra-text-main: #1c1c1e; --indra-text-dim: #8e8e93;
    }
    * { box-sizing: border-box; }
    .hud-container {
        pointer-events: auto; display: flex; flex-direction: column; background: var(--indra-bg); margin: 20px;
        border: 1px solid var(--indra-border); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        width: calc(100% - 40px); height: auto; max-height: 95vh; overflow: hidden;
    }
    .header { 
        padding: 16px 24px; 
        border-bottom: 1px solid var(--indra-border); 
        display: grid; 
        grid-template-columns: 200px 1fr auto; 
        align-items: center; 
        gap: 20px;
    }
    .identity { display: flex; flex-direction: column; }
    .identity h4 { margin: 0; font-size: 9px; color: var(--indra-text-dim); text-transform: uppercase; letter-spacing: 1px; }
    .name-center { text-align: center; font-size: 20px; font-weight: 800; color: var(--indra-text-main); }
    .actions { display: flex; align-items: center; justify-content: flex-end; }
    
    .main-grid { display: grid; grid-template-columns: 1fr 1fr; flex: 1; min-height: 300px; height: auto; overflow-y: auto; }
    .column { display: flex; flex-direction: column; border-right: 1px solid var(--indra-border); min-height: 400px; }
    .column:last-child { border-right: none; }
    .column-header { padding: 14px; font-size: 10px; font-weight: 800; background: var(--indra-surface); border-bottom: 1px solid var(--indra-border); color: var(--indra-text-dim); }
    .column-body { flex: 1; padding: 16px; background: #fff; }
    
    .config-area { padding: 24px; background: var(--indra-surface); display: none; border-bottom: 1px solid var(--indra-border); }
    .config-area.active { display: block; }
    
    .btn-main { background: var(--indra-accent); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px; }

    /* Estilos para el listado de Workspaces dentro de la config */
    .workspace-picker-wrapper { margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--indra-border); }
`;

class IndraBridgeHUD extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._bridge = null;
        this.workspaceManager = null;
        this.localExplorer = null;
        this.remoteExplorer = null;
    }

    connectedCallback() {
        this.render();
        // ESCUCHA AXIAL: Sincronizar UI cuando el Bridge alcanza resonancia total
        window.addEventListener('indra-core-synced', () => this.sync());
        
        // HIDRATACIÓN T=0: Si el bridge ya está aquí, mostramos lo que hay
        if (this._bridge) this.sync();

        // RESONANCIA VITE (INVS-01): Escuchar confirmación de disco sin recargar
        if (import.meta.hot) {
            import.meta.hot.on('indra-sync-complete', (data) => {
                console.log(`💎 [HUD:Resonancia] Materia físicamente sellada en: ${data.file}`);
                this.shadowRoot.querySelector('#config-seal-msg').innerText = '🔒 CONFIGURATION SEALED & LIVE';
                this.shadowRoot.querySelector('#config-seal-msg').style.color = '#34C759';
            });
        }
    }

    set bridge(val) {
        this._bridge = val;
        // PROYECCIÓN INMEDIATA: No esperamos al handshake para hidratar la UI
        this.sync();
    }

    render() {
        this.shadowRoot.innerHTML = `<style>${STYLES}</style>
        <div class="hud-container">
            <header class="header">
                <div class="identity">
                    <h4>INDRA PROJECT CORE</h4>
                    <div id="sat-email-display" style="font-size:9px; color:var(--indra-text-dim); margin-top:4px; font-family:monospace; opacity: 0.8;">AWAITING HANDSHAKE...</div>
                </div>
                <div class="name-center" id="sat-name-display">ANONYMOUS NODE</div>
                <div class="actions">
                    <span id="toggle-settings" title="Configuration" style="cursor:pointer; font-size:18px; margin-right:15px; user-select:none;">⚙️</span>
                    <button class="btn-main" id="btn-save-config" style="display:none; background:#34C759; margin-right:10px;">💾 PERSIST TO DISK</button>
                    <button class="btn-main" id="btn-connect">CONNECT TO CORE</button>
                </div>
            </header>

            <div class="config-area" id="config-area">
                <div style="margin-bottom:15px; font-size:10px; color:var(--indra-accent); font-weight:800;" id="config-seal-msg">🔓 CONFIGURATION MODE</div>
                <div id="form-mount"></div>
                <div class="workspace-picker-wrapper">
                    <label style="font-size:9px; color:var(--indra-text-dim);">WORKSPACE CONTEXT</label>
                    <div id="workspace-mount" style="margin-top:8px;"></div>
                </div>
            </div>

            <main class="main-grid">
                <section class="column">
                    <div class="column-header">LOCAL SOURCE STRUCTURE</div>
                    <div class="column-body" id="col-local"><indra-hud-tree id="tree-local"></indra-hud-tree></div>
                </section>
                <section class="column">
                    <div class="column-header">REMOTE CORE RESONANCE</div>
                    <div class="column-body" id="col-remote"><indra-hud-tree id="tree-remote"></indra-hud-tree></div>
                </section>
            </main>
        </div>`;

        this.localExplorer = new SchemaExplorer(this.shadowRoot.querySelector('#col-local'), this.shadowRoot.querySelector('#tree-local'), { origin: 'local' });
        this.remoteExplorer = new SchemaExplorer(this.shadowRoot.querySelector('#col-remote'), this.shadowRoot.querySelector('#tree-remote'), { origin: 'core' });
        
        // --- LISTENERS DE SINCRONÍA DE MATERIA ---
        this.shadowRoot.querySelector('#tree-local').addEventListener('indra-export-schema', (e) => this.pushSchemaToCore(e.detail));
        this.shadowRoot.querySelector('#tree-remote').addEventListener('indra-import-schema', (e) => this.pullSchemaToLocal(e.detail));

        this.shadowRoot.querySelector('#toggle-settings').onclick = () => this.shadowRoot.querySelector('#config-area').classList.toggle('active');
        
        this.shadowRoot.querySelector('#btn-connect').onclick = () => {
            // Sincronizamos los inputs con el puente antes de conectar
            this.prepareBridge();
            this.dispatchEvent(new CustomEvent('indra-master-action', { bubbles: true, composed: true }));
        };
        
        this.shadowRoot.querySelector('#btn-save-config').onclick = () => this.persistToDisk();
        
        this.drawConfig();
    }

    drawConfig() {
        // AXIOMA: Proyección dinámica desde el ADN del Core (No Hardcoded)
        const schema = this._bridge?.capabilities?.config_schema || {
            id: 'CORE_CONFIG',
            payload: {
                fields: [
                    { id: 'sat_name', label: 'NODE ALIAS', type: 'TEXT', placeholder: 'Nombre del Satélite...' },
                    { id: 'core_url', label: 'CORE URL (GAS)', type: 'TEXT', placeholder: 'https://script.google.com/...' },
                    { id: 'core_token', label: 'SECURITY TOKEN', type: 'PASSWORD', placeholder: 'Session secret...' }
                ]
            }
        };

        const config = this._bridge?.contract || {};
        
        FormGenerator.render(schema, this.shadowRoot.querySelector('#form-mount'), {
            initialData: {
                sat_name: config.satellite_name,
                core_url: this._bridge?.coreUrl,
                core_token: this._bridge?.satelliteToken
            }
        });

        // Axioma de Estados: Si no estamos READY, permitimos edición inmediata
        const isOperational = this._bridge?.status === 'READY';
        this.lockInputs(isOperational);
    }

    lockInputs(lock) {
        const inputs = this.shadowRoot.querySelectorAll('.indra-input');
        inputs.forEach(i => i.disabled = lock);
        
        const isError = this._bridge?.status === 'ERROR';
        const sealMsg = this.shadowRoot.querySelector('#config-seal-msg');
        
        if (isError) {
            sealMsg.innerHTML = '❌ CRITICAL: CORE CONNECTION FAILED';
            sealMsg.style.color = '#FF3B30';
        } else {
            sealMsg.innerHTML = lock ? '🔒 CORE LINKED: CONFIGURATION SEALED' : '🔓 CONFIGURATION MODE (DRIFT DETECTADO)';
            sealMsg.style.color = lock ? '#34C759' : '#FF9500';
        }
        
        // El botón de guardado SOLO aparece si estamos vinculados REALMENTE (READY)
        this.shadowRoot.querySelector('#btn-save-config').style.display = (lock && !isError) ? 'block' : 'none';
        
        // El botón de conectar cambia según el estado
        const btnConnect = this.shadowRoot.querySelector('#btn-connect');
        if (isError) {
            btnConnect.innerText = 'RETRY CONNECTION';
            btnConnect.style.background = '#FF3B30';
            btnConnect.disabled = false;
        } else if (lock) {
            btnConnect.innerText = 'CONNECTED';
            btnConnect.style.background = '#34C759';
            btnConnect.disabled = true;
        } else {
            btnConnect.innerText = 'CONNECT TO CORE';
            btnConnect.style.background = 'var(--indra-accent)';
            btnConnect.disabled = false;
        }
    }

    prepareBridge() {
        if (!this._bridge) return;
        const inputs = this.shadowRoot.querySelectorAll('.indra-input');
        const data = {};
        inputs.forEach(i => data[i.id.replace('input-', '')] = i.value);
        
        // Actualizamos el puente con los valores REALES del formulario antes de iniciar
        this._bridge.coreUrl = data.core_url;
        this._bridge.satelliteToken = data.core_token;
        if (!this._bridge.contract) this._bridge.contract = {};
        this._bridge.contract.satellite_name = data.sat_name;
    }

    unlockConfig() {
        this.lockInputs(false);
    }

    syncUIValues() {
        const inputUrl = this.shadowRoot.getElementById('input-core_url');
        const inputToken = this.shadowRoot.getElementById('input-core_token');
        const coreOwnerLabel = this.shadowRoot.getElementById('core-owner-email');
        const coreVersionLabel = this.shadowRoot.getElementById('core-version');

        if (this._bridge) {
            if (inputUrl) inputUrl.value = this._bridge.coreUrl || '';
            if (inputToken) inputToken.value = this._bridge.satelliteToken || '';
            
            // PROYECCIÓN DE IDENTIDAD AXIOMÁTICA
            if (this._bridge.status === 'READY') {
                if (coreOwnerLabel) coreOwnerLabel.innerText = this._bridge.contract?.owner_email || 'Core Soberano';
                if (coreVersionLabel) coreVersionLabel.innerText = this._bridge.capabilities?.core_version || 'v10.x';
            }
        }
    }

    async persistToDisk() {
        if (!this._bridge) return;
        this.prepareBridge();
        
        const payload = {
            core_url: this._bridge.coreUrl,
            core_token: this._bridge.satelliteToken,
            satellite_name: this._bridge.contract?.satellite_name,
            workspace_id: this._bridge.activeWorkspaceId,
            timestamp: new Date().toISOString()
        };
        
        const configStr = `export const INDRA_CONFIG = ${JSON.stringify(payload, null, 2)};`;
        const bytes = new Blob([configStr]).size;
        
        console.log(`🚀 [HUD] INICIANDO SELLADO DE MATERIA (${bytes} bytes)`);
        console.log(`📡 [HUD] DESTINO: indra_config.js (Homeostasis Detectada)`);
        console.log(`💎 [HUD] CORE_URL: ${payload.core_url ? payload.core_url.substring(0, 30) + '...' : 'NONE'}`);
        
        try {
            const res = await fetch('/indra-sync/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: 'indra_identity.js',
                    content: configStr
                })
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`✅ [HUD] PERSISTENCIA CIUDADANA SELLADA. Ruta: ${data.path}`);
                this.shadowRoot.querySelector('#config-seal-msg').innerText = '🔒 CONFIGURATION SEALED & VERIFIED';
                this.shadowRoot.querySelector('#config-seal-msg').style.color = '#34C759';
                alert("Materia sellada con éxito en el sistema de archivos.");
            } else {
                throw new Error(`Servidor rechazó la materia (Status: ${res.status})`);
            }
        } catch (e) {
            console.error("❌ [HUD] FALLO CRÍTICO DE PERSISTENCIA:", e.message);
            alert("AVISO: No se pudo realizar el sellado físico.");
        }
    }

    async discoverLocalMatter() {
        // ESCANER DETERMINISTA (Sovereign API)
        const discoveredSchemas = [];
        
        try {
            const res = await fetch('/indra-sync/list-schemas');
            if (!res.ok) throw new Error('Servidor de listado no disponible');
            const files = await res.json();
            
            for (const fileName of files) {
                try {
                    // Importación dinámica con bust-caching para romper la inercia del navegador
                    // Subimos dos niveles (ui/ -> _INDRA_PROTOCOL_/ -> root) para llegar a scores/
                    const mod = await import(`../../scores/${fileName}?t=${Date.now()}`);
                    if (mod.SCHEMA) discoveredSchemas.push(mod.SCHEMA);
                } catch (e) {
                    console.warn(`[HUD:Discovery] Fallo al importar materia en ${fileName}:`, e);
                }
            }
        } catch (e) {
            console.error(`[HUD:Discovery] Fallo en el escáner de materia:`, e.message);
        }
        
        // Sincronizamos la memoria del Bridge con la realidad del disco
        this._bridge.contract.schemas = discoveredSchemas;
        console.log(`📂 [HUD:Local] ${discoveredSchemas.length} esquemas sincronizados desde disco.`);
        this.localExplorer.update(this._bridge.contract.schemas);
    }

    async sync() {
        if (!this._bridge) return;

        // Descubrimos qué hay en el disco antes de proyectar
        await this.discoverLocalMatter();

        this.syncUIValues();
        this.drawConfig(); 

        // HANDSHAKE NATURAL: Si el disco está vacío, forzamos la apertura de la UI de configuración
        if (!this._bridge.coreUrl || this._bridge.status === 'GHOST') {
            this.shadowRoot.querySelector('#config-area').classList.add('active');
        }

        this.shadowRoot.querySelector('#sat-name-display').innerText = this._bridge.contract?.satellite_name || 'ANONYMOUS';
        
        let statusText = '📡 AWAITING HANDSHAKE...';
        let statusColor = 'var(--indra-text-dim)';

        if (this._bridge.status === 'READY') {
            statusText = '💎 CORE RESONANCE ESTABLISHED';
            statusColor = '#34C759';
        } else if (this._bridge.status === 'ORPHAN') {
            statusText = '🟠 SATELLITE UNLINKED (ORPHAN MODE)';
            statusColor = '#FF9500';
        } else if (this._bridge.status === 'ERROR') {
            statusText = '⚠️ CORE OFFLINE';
            statusColor = '#FF3B30';
        }

        const emailDisplay = this.shadowRoot.querySelector('#sat-email-display');
        emailDisplay.innerText = statusText;
        emailDisplay.style.color = statusColor;

        // Re-evaluamos el bloqueo en cada sync para reaccionar a cambios de estado del Bridge
        const isOperational = this._bridge.status === 'READY';
        this.lockInputs(isOperational);

        if (this._bridge.status === 'READY') {
            this.shadowRoot.querySelector('#btn-connect').innerText = 'CONNECTED';
            this.shadowRoot.querySelector('#btn-connect').style.background = '#34C759';
            
            // Proyección de Esquemas Remotos (Vista Fractal)
            if (this._bridge.contract.remote_schemas && this._bridge.contract.remote_schemas.length > 0) {
                this.remoteExplorer.showTree();
                this.remoteExplorer.update(this._bridge.contract.remote_schemas);
            } else if (this._bridge.activeWorkspaceId) {
                // PROACTIVIDAD: Si no hay esquemas pero sí hay workspace, los pedimos
                this.loadRemote(this._bridge.activeWorkspaceId);
            }

            if (!this.workspaceManager) {
                this.workspaceManager = new WorkspaceController(this.shadowRoot.querySelector('#workspace-mount'), this._bridge, (id) => this.loadRemote(id));
                this.workspaceManager.init();
            }
        }

        if (this._bridge.contract) {
            this.localExplorer.update(this._bridge.contract.schemas);
        }
    }

    updateWorkspaceSelector() {
        const selector = this.shadowRoot.getElementById('workspace-selector');
        if (!selector || !this._bridge) return;

        selector.innerHTML = '';
        this._bridge.availableWorkspaces.forEach(ws => {
            const opt = document.createElement('option');
            opt.value = ws.id;
            opt.innerText = ws.label || ws.id;
            opt.selected = (ws.id === this._bridge.activeWorkspaceId);
            selector.appendChild(opt);
        });
    }

    async loadRemote(wsId) {
        this._bridge.activeWorkspaceId = wsId;
        this.remoteExplorer.setLoading(`Resonando con el Core: ${wsId}...`);
        
        try {
            // FASE 1: Listar identidades disponibles en el Workspace
            const res = await this._bridge.execute({ 
                protocol: 'SYSTEM_PINS_READ', 
                workspace_id: wsId 
            });
            
            const pins = res.items || [];
            console.log(`📡 [LoadRemote] ${pins.length} esquemas detectados. Iniciando hidratación masiva...`);

            // FASE 2: RESONANCIA TOTAL (Bulk Load de Materia Profunda)
            // Ya no esperamos al clic: traemos todo el ADN de golpe para máxima fluidez
            const deepSchemas = await Promise.all(pins.map(async (pin) => {
                try {
                    const atomRes = await this._bridge.execute({ 
                        protocol: 'ATOM_READ', 
                        context_id: pin.id 
                    });
                    return (atomRes.items && atomRes.items[0]) || atomRes;
                } catch (e) {
                    console.warn(`⚠️ [LoadRemote] Fallo al hidratar ${pin.id}:`, e);
                    return pin;
                }
            }));

            // Registro en Contrato de Memoria
            this._bridge.contract.remote_schemas = deepSchemas;

            // Sincronización del Visor
            this.remoteExplorer.showTree();
            this.remoteExplorer.update(this._bridge.contract.remote_schemas);
            
            // Re-vincular listener de importación (PULL)
            const treeEl = this.shadowRoot.querySelector('#tree-remote');
            treeEl.addEventListener('indra-import-schema', (e) => this.pullSchemaToLocal(e.detail));

        } catch (e) {
            this.remoteExplorer.setLoading(`Error de Handshake: ${e.message}`);
        }
    }

    async pullSchemaToLocal(schemaNode) {
        console.log(`[IndraSync] Iniciando DEEP PULL para: ${schemaNode.label || schemaNode.id}`);
        
        let deepNode = schemaNode;

        try {
            // LEY DE PROFUNDIDAD: Resonancia vía ATOM_READ (context_id es el cánon)
            const payload = {
                protocol: 'ATOM_READ',
                context_id: schemaNode.id
            };
            
            console.log("📡 [DeepPull:Wire] Enviando UQO:", JSON.stringify(payload, null, 2));

            const atomRes = await this._bridge.execute(payload);
            
            console.log("📥 [DeepPull:Wire] Respuesta recibida:", JSON.stringify(atomRes, null, 2));

            const realAtom = (atomRes.items && atomRes.items[0]) || atomRes;

            if (realAtom.handle || realAtom.id) {
                // LEY DE PUREZA: Destilamos el átomo para que sea un Blueprint soverano
                deepNode = {
                    id: realAtom.id,
                    handle: {
                        alias: realAtom.handle?.alias,
                        label: realAtom.handle?.label
                    },
                    class: realAtom.class || 'DATA_SCHEMA',
                    payload: {
                        fields: realAtom.payload?.fields || [],
                        target_silo_id: realAtom.payload?.target_silo_id,
                        target_provider: realAtom.payload?.target_provider
                    }
                };
                console.log(`✅ [DeepPull] Materia destilada: ${deepNode.payload.fields.length} campos.`);
            }
        } catch (e) {
            console.warn("[DeepPull] Fallo en resonancia profunda:", e);
        }

        // Generamos el archivo JS estándar con la materia profunda
        const content = `/**
 * INDRA SCHEMA: ${deepNode.id}
 * Alias: ${deepNode.handle?.alias || deepNode.label}
 * Origin: Core Handshake (DEEP PULL)
 */
export const SCHEMA = ${JSON.stringify(deepNode, null, 4)};`;

        // LEY DEL HANDLE: El nombre del archivo local emana de la identidad humana
        const alias = deepNode.handle?.alias;
        const label = deepNode.handle?.label?.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, ''); 

        const fileName = `${alias || label || deepNode.id}.js`;
        const filePath = `./scores/${fileName}`; 

        try {
            const res = await fetch('/indra-sync/save-file', {
                method: 'POST',
                body: JSON.stringify({ filePath, content })
            });

            if (res.ok) {
                // HIDRATACIÓN INMEDIATA (Vínculo de Memoria)
                if (!this._bridge.contract.schemas) this._bridge.contract.schemas = [];
                const existsIdx = this._bridge.contract.schemas.findIndex(s => s.id === deepNode.id);
                if (existsIdx !== -1) {
                    this._bridge.contract.schemas[existsIdx] = deepNode;
                } else {
                    this._bridge.contract.schemas.push(deepNode);
                }
                
                this.sync(); 
                alert(`✅ ÉXITO: Esquema [${schemaNode.id}] guardado físicamente en scores/${fileName}`);
            } else {
                const error = await res.json();
                alert(`❌ ERROR DE PERSISTENCIA: ${error.error}`);
            }
        } catch (e) {
            alert(`❌ ERROR DE CONEXIÓN VITE: ${e.message}`);
        }
    }

    async pushSchemaToCore(schemaNode) {
        if (!this._bridge || this._bridge.status !== 'READY') return;
        
        const hasId = !!schemaNode.id;
        const action = hasId ? 'ATOM_UPDATE' : 'ATOM_CREATE';
        
        if (!confirm(`¿${hasId ? 'ACTUALIZAR' : 'EXPORTAR'} esquema [${schemaNode.handle?.alias || schemaNode.id}] en el Core remoto?`)) return;

        console.log(`📤 [IndraSync] Ejecutando ${action} para: ${schemaNode.id}`);
        
        try {
            // LEY DE SINCERIDAD: Solo enviamos el Blueprint purificado
            const payload = {
                protocol: action,
                context_id: hasId ? schemaNode.id : this._bridge.activeWorkspaceId,
                data: {
                    class: 'DATA_SCHEMA',
                    handle: { 
                        label: schemaNode.handle?.label, 
                        alias: schemaNode.handle?.alias
                    },
                    payload: { 
                        fields: schemaNode.payload?.fields || [],
                        target_silo_id: schemaNode.payload?.target_silo_id,
                        target_provider: schemaNode.payload?.target_provider
                    }
                }
            };
            
            const res = await this._bridge.execute(payload);

            if (res.metadata?.status === 'OK') {
                alert(`✅ ÉXITO: Esquema [${schemaNode.id}] exportado y materializado en el Core.`);
                this.sync(); 
            }
        } catch (e) {
            alert(`❌ ERROR DE EXPORTACIÓN: ${e.message}`);
        }
    }
}

customElements.define('indra-bridge-v17', IndraBridgeHUD);
