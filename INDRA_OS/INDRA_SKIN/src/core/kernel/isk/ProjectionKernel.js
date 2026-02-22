import { JITCompiler } from './JITCompiler.js';
import { StateBridge } from '../../1_Axiomatic_Store/StateBridge.js';
import { ObjectPool } from './ObjectPool.js';
import { SpatialRenderer } from './SpatialRenderer.js';
import { InstancedShaderFactory } from './InstancedShaderFactory.js';
import { IntegrityBoundary } from './IntegrityBoundary.js';
import { SpatialBridge } from './SpatialBridge.js';
import { USSP_PersistenceBuffer } from './USSP_PersistenceBuffer.js';
import { useUSSPStateStore } from './USSP_StateStore.js';

/**
 * 🌌 ISK: PROJECTION KERNEL (L1 / L2 Orchestrator)
 * El corazón del ISK. Coordina la lógica, la memoria y el flujo hacia la GPU.
 */
export class ProjectionKernel {
    constructor() {
        this.compiler = new JITCompiler();
        this.pool = new ObjectPool();
        this.integrity = new IntegrityBoundary();
        this.bridge = new SpatialBridge(this);
        this.persistence = new USSP_PersistenceBuffer();
        this.bridge.setPersistenceBuffer(this.persistence);
        this.worker = null;

        this.laws = new Map(); // ID -> SpatialLaw
        this.compiledLaws = {}; // ID -> JIT Results

        this.state = {
            nodes: [],
            lastReification: {},
            lastUpdateTime: Date.now(),
            targetFrameRate: 60,
            integrity: { status: 'INITIALIZING' },
            sequenceId: 0,
            lastProcessedSequenceId: -1
        };

        // L2: Data Texture Pipeline
        this.textureSize = 128; // 128x128 = 16,384 nodes (1 pixel per node)
        this.dataBuffer = new Float32Array(this.textureSize * this.textureSize * 4);

        this.renderer = null; // Se inicializa con setCanvas
        this._initWorker();
    }

    /**
     * Vincula un canvas al kernel e inicializa el Renderer (L3)
     * @param {HTMLCanvasElement} canvas 
     */
    setCanvas(canvas) {
        this.renderer = new SpatialRenderer(canvas);
        this._setupArchetypes();
    }

    /**
     * Carga un conjunto de leyes espaciales (.layout.json)
     * @param {Array} spatialLaws 
     */
    loadLaws(spatialLaws) {
        this.pool.releaseAll();
        this.laws.clear();
        this.compiledLaws = {};

        const nodeCount = spatialLaws.length;
        this._ensureTextureCapacity(nodeCount);

        let index = 0;
        spatialLaws.forEach(law => {
            // 1. Registro la ley
            this.laws.set(law.identity.uuid, law);

            // 2. Compilo su fisiología (Expression Engine)
            const compiled = this._compilePhysiology(law);
            this.compiledLaws[law.identity.uuid] = {
                executors: compiled,
                index: index++
            };

            // 3. Obtengo un nodo físico del pool
            this.pool.get(law.dna.archetype, law.identity.uuid);
        });

        // 4. Sincronizo el trabajador con la nueva lógica
        this._syncWorker();

        // 5. Registro Snapshot inicial para el RefactorShield (Identity de la carga)
        // Usamos un mock de estado inicial para definir el 'blueprint' de campos esperado
        const initialMockState = { 'core.power': 0, 'time.now': 0 };
        this.integrity.createRefactorSnapshot('INITIAL_LOAD', initialMockState);

        // 6. Hidratar el USSP State Store para verdad local
        useUSSPStateStore.getState().hydrate({ nodes: {}, edges: [], metadata: {} });
    }

    /**
     * Inyecta el nuevo estado del Core para el cálculo reactivo.
     * @param {Object} coreState 
     */
    update(coreState) {
        // Ejecutar validación de integridad previa al envío al worker
        const validation = this.integrity.validateStructure(coreState, this.compiledLaws);
        this.state.integrity = validation;

        if (validation.status === 'CRITICAL') {
            console.error("ISK INTEGRITY CRITICAL:", validation.message, validation.missing);
            return; // Bloqueamos la actualización si hay fallo estructural
        }

        // Refactor Shield: Verificamos si el esquema ha cambiado desde la carga inicial
        const refactorCheck = this.integrity.checkRefactorDebt('INITIAL_LOAD', coreState);
        if (refactorCheck.status === 'REFACTOR_ALARM') {
            this.state.integrity = {
                status: 'WARNING',
                message: refactorCheck.message
            };
        }

        // Auditoría de explotación
        const audit = this.integrity.auditExploitation(coreState, this.compiledLaws);
        this.state.exploitation = audit;

        if (this.worker) {
            const currentSeq = ++this.state.sequenceId;
            this.worker.postMessage({
                action: 'UPDATE_STATE',
                payload: {
                    state: coreState,
                    sequenceId: currentSeq
                }
            });
        }
    }

    _compilePhysiology(law) {
        // En v3.2, no compilamos en el Kernel. Enviamos las expresiones originales.
        return law.dna.geometry?.expressions || {};
    }

    _initWorker() {
        // Nota: En un entorno Vite real, esto sería { type: 'module' }
        // Aquí simulamos la creación del trabajador.
        try {
            this.worker = new Worker(new URL('./SpatialWorker.js', import.meta.url));
            this.worker.onmessage = (e) => this._handleWorkerMessage(e);
        } catch (err) {
            console.warn("ISK: Worker initialization failed. Falling back to Main Thread.", err);
        }
    }

    _syncWorker() {
        if (!this.worker) return;

        // En v3.2, enviamos la estructura completa de leyes (con expresiones raw)
        // El Worker se encargará de la compilación JIT interna.

        this.worker.postMessage({
            action: 'INIT',
            payload: {
                laws: this.compiledLaws,
                textureSize: this.textureSize
            }
        });
    }

    _handleWorkerMessage(e) {
        const { action, results, sequenceId, isPartial } = e.data;
        if (action === 'REIFICATION_RESULT') {
            if (!isPartial && sequenceId <= this.state.lastProcessedSequenceId) return;
            if (!isPartial) this.state.lastProcessedSequenceId = sequenceId;

            // REIFICACIÓN CERO-COPIA BÁSICA
            this.dataBuffer.set(results);

            // AXIOMA V12: Histéresis Visual basada en Soberanía Local (_isDirty)
            const axStore = StateBridge.getState();
            const artifactsMap = axStore?.phenotype?.artifacts || {};
            const pendingIds = new Set(Object.values(artifactsMap).filter(a => a._isDirty).map(a => a.id));
            const now = Date.now();

            if (!this._hysteresisMap) this._hysteresisMap = new Map();

            let index = 0;
            for (const [id, law] of this.laws) {
                const offset = index * 4;
                const isPending = pendingIds.has(id);

                if (isPending) {
                    this._hysteresisMap.set(id, now); // Refrescar marca de "última vez pendiente"
                    this.dataBuffer[offset + 3] = 0.75;
                } else {
                    const lastPendingTime = this._hysteresisMap.get(id) || 0;
                    if (now - lastPendingTime < 300) {
                        // Aún en periodo de gracia de Histéresis
                        this.dataBuffer[offset + 3] = 0.75;
                    } else {
                        this.dataBuffer[offset + 3] = 1.0;
                    }
                }
                index++;
            }

            this.state.lastUpdateTime = Date.now();
        }
    }

    /**
     * Ciclo de renderizado principal. Llama al L3 con la interpolación calculada.
     */
    tick() {
        if (!this.renderer) return;

        const now = Date.now();

        // Tarea 4: Monitor de FPS (Panic Logic - V10.9)
        if (!this._fpsLastTime) {
            this._fpsLastTime = now;
            this._fpsFrames = 0;
            this.panicMode = false;
        }
        this._fpsFrames++;
        if (now - this._fpsLastTime > 1000) {
            const fps = (this._fpsFrames * 1000) / (now - this._fpsLastTime);
            this._fpsLastTime = now;
            this._fpsFrames = 0;

            if (fps < 30 && !this.panicMode) {
                console.warn(`[ProjectionKernel] 🚨 PANIC MODE: FPS dropped to ${Math.round(fps)}. Throttling physics.`);
                this.panicMode = true;
                this._syncPanicState();
            } else if (fps > 45 && this.panicMode) {
                console.log(`[ProjectionKernel] ✅ STABILIZED: FPS recovered to ${Math.round(fps)}. Restoring physics.`);
                this.panicMode = false;
                this._syncPanicState();
            }
        }

        // Calculamos el factor de interpolación (t) entre 0 y 1
        // Basado en el tiempo transcurrido desde la última reificación (WebWorker update)
        const elapsed = now - this.state.lastUpdateTime;
        const frameTime = 1000 / this.state.targetFrameRate;
        const t = Math.min(elapsed / frameTime, 1.0);

        this.renderer.render(this.dataBuffer, this.laws.size, t);
    }

    _syncPanicState() {
        if (this.worker) {
            this.worker.postMessage({
                action: 'SET_PANIC_MODE',
                payload: { enabled: this.panicMode }
            });
        }
    }

    _setupArchetypes() {
        if (!this.renderer) return;

        // Registro de los arquetipos estándar
        this.renderer.initArchetype('arc',
            InstancedShaderFactory.getBaseVertexShader(),
            InstancedShaderFactory.getArcFragmentShader()
        );
        this.renderer.initArchetype('circle',
            InstancedShaderFactory.getBaseVertexShader(),
            InstancedShaderFactory.getCircleFragmentShader()
        );
    }

    _applyReificationToNodes() {
        // L2 -> L3: Preparación de buffers
        let index = 0;
        for (const [id, node] of this.pool.activeNodes) {
            const reif = this.state.lastReification[id];
            if (reif) {
                // Actualizamos los datos para el buffer
                const offset = index * 4;
                this.dataBuffer[offset] = reif.x || 0;
                this.dataBuffer[offset + 1] = reif.y || 0;
                this.dataBuffer[offset + 2] = reif.radius || 0;
                this.dataBuffer[offset + 3] = node.isActive ? 1.0 : 0.0;

                node._internal.dirty = true;
            }
            index++;
        }
    }

    _ensureTextureCapacity(count) {
        let size = 128;
        while (size * size < count) {
            size *= 2;
        }

        if (size !== this.textureSize) {
            console.log(`ISK: Re-scaling Data Texture to ${size}x${size} for ${count} nodes.`);
            this.textureSize = size;
            this.dataBuffer = new Float32Array(this.textureSize * this.textureSize * 4);
            if (this.renderer) {
                this.renderer.resizeDataTextures(this.textureSize);
            }
        }
    }
}




