/**
 * 🧵 ISK: SPATIAL WORKER (v3.2 - Hardened)
 * Thread-side Expression Engine & Real-Time Reification.
 * Features: Internal JIT, Double Buffering (Zero-Copy), Safety Fallbacks.
 * V10.9: QuadTree Spatial Partitioning ($O(n \log n)$).
 */

// --- QUAD_TREE SPATIAL PARTITIONING (v1.0) ---
class QuadTree {
    constructor(boundary, capacity = 4) {
        this.boundary = boundary; // {x, y, w, h} (Center + half-size)
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    subdivide() {
        const { x, y, w, h } = this.boundary;
        const nw = { x: x - w / 2, y: y - h / 2, w: w / 2, h: h / 2 };
        const ne = { x: x + w / 2, y: y - h / 2, w: w / 2, h: h / 2 };
        const sw = { x: x - w / 2, y: y + h / 2, w: w / 2, h: h / 2 };
        const se = { x: x + w / 2, y: y + h / 2, w: w / 2, h: h / 2 };
        this.northwest = new QuadTree(nw, this.capacity);
        this.northeast = new QuadTree(ne, this.capacity);
        this.southwest = new QuadTree(sw, this.capacity);
        this.southeast = new QuadTree(se, this.capacity);
        this.divided = true;
    }

    insert(point) {
        if (!this._contains(this.boundary, point)) return false;

        if (this.points.length < this.capacity && !this.divided) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) this.subdivide();

        return (
            this.northwest.insert(point) ||
            this.northeast.insert(point) ||
            this.southwest.insert(point) ||
            this.southeast.insert(point)
        );
    }

    query(range, found) {
        if (!this._intersects(this.boundary, range)) return found;

        for (let p of this.points) {
            if (this._contains(range, p)) found.push(p);
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }
        return found;
    }

    _contains(rect, p) {
        return (p.x >= rect.x - rect.w && p.x <= rect.x + rect.w &&
            p.y >= rect.y - rect.h && p.y <= rect.y + rect.h);
    }

    _intersects(a, b) {
        return !(b.x - b.w > a.x + a.w || b.x + b.w < a.x - a.w ||
            b.y - b.h > a.y + a.h || b.y + b.h < a.y - a.h);
    }
}

// --- INTERNAL JIT ENGINE (Lightweight v3.2) ---
class InternalJIT {
    constructor() {
        this.cache = new Map();
        this.lib = {
            map: (val, inMin, inMax, outMin, outMax) => (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin,
            oscillate: (time, freq) => Math.sin(time * freq * Math.PI * 2) * 0.5 + 0.5,
            lerp: (a, b, t) => a + (b - a) * t
        };
    }

    compile(expression) {
        if (this.cache.has(expression)) return this.cache.get(expression);

        try {
            const cleanExpr = expression.replace(/^{{|}}$/g, '').trim();
            const parts = cleanExpr.split('|').map(p => p.trim());
            const source = parts[0];
            const filters = parts.slice(1);

            // Sanity check for access
            const sanitizedSource = source.replace(/[^a-zA-Z0-9_.]/g, '');

            const executor = new Function('state', 'compiler', `
                "use strict";
                try {
                    let val = state["${sanitizedSource}"];
                    if (val === undefined) return 0;
                    ${this._buildFilterLogic(filters)}
                    return val;
                } catch (e) {
                    return 0; // Fallback de Seguridad
                }
            `);

            this.cache.set(expression, executor);
            return executor;
        } catch (e) {
            console.warn("[ISK-WORKER] JIT Compilation error:", e);
            return () => 0; // Constant Fallback
        }
    }

    _buildFilterLogic(filters) {
        let code = '';
        filters.forEach(f => {
            const match = f.match(/^(\w+)\((.*)\)$/);
            if (match) {
                const name = match[1];
                const args = match[2];
                code += `val = compiler.lib.${name}(val, ${args});\n`;
            }
        });
        return code;
    }
}

const jit = new InternalJIT();

// --- STATE & BUFFERS ---
let iskContext = null;
let bufferA = null;
let bufferB = null;
let velocityBuffer = null; // [vx, vy, mass, drag] per node
let currentBufferIsA = true;

// --- CACHES & INDEXES ---
let artifactIndex = new Map(); // Fast lookup ID -> Artifact Data
let panicMode = false;

// AXIOMA: Parámetros de Física (Espejo de Spatial_Physics.js)
const PHYSICS_CONSTANTS = {
    SEMANTIC_GRAVITY: 0.05,
    REPULSION_FORCE: 800,
    FRICTION: 0.92,
    TIME_STEP: 1.0
};

self.onmessage = function (e) {
    const { action, payload } = e.data;

    switch (action) {
        case 'INIT':
            iskContext = payload;
            const nodeCount = Object.keys(payload.laws).length;
            const totalSize = payload.textureSize * payload.textureSize * 4;

            bufferA = new Float32Array(totalSize);
            bufferB = new Float32Array(totalSize);
            velocityBuffer = new Float32Array(totalSize); // Reusamos estructura 4-float para vx, vy, mass, drag

            // Inicializar Masas y Velocidades
            for (const [id, law] of Object.entries(iskContext.laws)) {
                law.id = id; // Inyectamos ID para trazabilidad interna (Task 3)
                const offset = law.index * 4;
                const schema = law.schemaId || 'GENERIC';

                // Determinación de Masa Fenotípica
                let mass = 1.0;
                if (schema.includes('COSMOS')) mass = 5.0;
                else if (schema.includes('FOLDER') || schema.includes('VAULT')) mass = 3.0;
                else if (schema.includes('EMAIL')) mass = 0.8;

                velocityBuffer[offset] = 0; // vx
                velocityBuffer[offset + 1] = 0; // vy
                velocityBuffer[offset + 2] = mass;
                velocityBuffer[offset + 3] = 0.1 / mass; // Drag (A más masa, más inercia/resistencia)

                // Compilación JIT
                for (const attr in law.executors) {
                    const expr = law.executors[attr];
                    if (typeof expr === 'string') {
                        law.executors[attr] = jit.compile(expr);
                    }
                }
            }
            break;

        case 'UPDATE_STATE':
            if (!iskContext) return;
            const { state, sequenceId } = payload;

            const targetBuffer = currentBufferIsA ? bufferB : bufferA;
            const prevBuffer = currentBufferIsA ? bufferA : bufferB;

            // 1. Integración de Física (ISK Physics Engine v1.0)
            applyPhysics(prevBuffer, targetBuffer, state);

            // 2. Procesamiento de Expresiones (JIT Reification)
            processExpressions(state, targetBuffer);

            self.postMessage({
                action: 'REIFICATION_RESULT',
                results: targetBuffer,
                sequenceId
            }, [targetBuffer.buffer]);

            // Recrear buffers tras transferencia
            if (currentBufferIsA) bufferB = new Float32Array(targetBuffer.length);
            else bufferA = new Float32Array(targetBuffer.length);

            currentBufferIsA = !currentBufferIsA;
            break;

        case 'HFS_UPDATE':
            if (!iskContext) return;
            const { target_id, property, value } = payload;
            handleHFSUpdate(target_id, property, value);
            break;

        case 'SET_PANIC_MODE':
            panicMode = payload.enabled;
            break;
    }
};

function applyPhysics(prevBuffer, nextBuffer, state) {
    // Tarea 3: Actualización de Índice (Soberanía de Identidad)
    const artifactList = state.phenotype.artifacts || [];
    artifactList.forEach(art => artifactIndex.set(art.id, art));

    const laws = Object.values(iskContext.laws);
    const nodes = laws.length;
    const idsToPurge = [];

    // Tarea 1: Reconstrucción del QuadTree (v10.9) - Límites Dinámicos
    let minX = -1000, maxX = 1000, minY = -1000, maxY = 1000;
    for (let i = 0; i < nodes; i++) {
        const off = laws[i].index * 4;
        const x = prevBuffer[off];
        const y = prevBuffer[off + 1];
        if (x < minX) minX = x - 100;
        if (x > maxX) maxX = x + 100;
        if (y < minY) minY = y - 100;
        if (y > maxY) maxY = y + 100;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const halfWidth = (maxX - minX) / 2;
    const halfHeight = (maxY - minY) / 2;

    const qtree = new QuadTree({ x: centerX, y: centerY, w: halfWidth, h: halfHeight }, 4);
    for (let i = 0; i < nodes; i++) {
        const law = laws[i];
        const off = law.index * 4;
        const artifact = artifactIndex.get(law.id);
        if (artifact && !artifact._isDeleted) {
            qtree.insert({ x: prevBuffer[off], y: prevBuffer[off + 1], off });
        }
    }

    for (let i = 0; i < nodes; i++) {
        const law = laws[i];
        const off = law.index * 4;
        const artifact = artifactIndex.get(law.id);

        // Ignorar objetos eliminados lógicamente (V10.7)
        if (artifact?._isDeleted) {
            nextBuffer[off + 3] = 0.0;
            idsToPurge.push(law.id);
            continue;
        }

        let x = prevBuffer[off];
        let y = prevBuffer[off + 1];
        let mass = velocityBuffer[off + 2] || 1.0;

        let vx = velocityBuffer[off];
        let vy = velocityBuffer[off + 1];

        // --- 1. Atracción Semántica ---
        const dx = (state.centerX || 0) - x;
        const dy = (state.centerY || 0) - y;
        vx += dx * PHYSICS_CONSTANTS.SEMANTIC_GRAVITY / mass;
        vy += dy * PHYSICS_CONSTANTS.SEMANTIC_GRAVITY / mass;

        // --- 2. Repulsión (OPTIMIZADA POR QUADTREE O(n log n)) ---
        // Tarea 4: Panic Logic (Load Shedding)
        if (!panicMode) {
            const range = { x, y, w: 200, h: 200 };
            const neighbors = qtree.query(range);

            for (let j = 0; j < neighbors.length; j++) {
                const neighbor = neighbors[j];
                if (neighbor.off === off) continue;

                const rdx = x - neighbor.x;
                const rdy = y - neighbor.y;
                const distSq = rdx * rdx + rdy * rdy + 0.1;

                if (distSq < 40000) {
                    const force = PHYSICS_CONSTANTS.REPULSION_FORCE / distSq;
                    vx += rdx * force;
                    vy += rdy * force;
                }
            }
        }

        // --- 3. Integración de Euler ---
        vx *= PHYSICS_CONSTANTS.FRICTION;
        vy *= PHYSICS_CONSTANTS.FRICTION;

        velocityBuffer[off] = vx;
        velocityBuffer[off + 1] = vy;

        if (law._isDragging) {
            nextBuffer[off] = x;
            nextBuffer[off + 1] = y;
        } else {
            nextBuffer[off] = x + vx * PHYSICS_CONSTANTS.TIME_STEP;
            nextBuffer[off + 1] = y + vy * PHYSICS_CONSTANTS.TIME_STEP;
        }
    }

    // Tarea 3.1: Descarte Post-Procesamiento (Polo a Tierra)
    idsToPurge.forEach(id => {
        delete iskContext.laws[id];
        artifactIndex.delete(id);
    });
}

function processExpressions(state, buffer) {
    const laws = Object.entries(iskContext.laws);
    for (const [id, law] of laws) {
        const offset = law.index * 4;
        const executors = law.executors;
        const artifact = artifactIndex.get(id);

        if (artifact?._isDeleted) {
            buffer[offset + 3] = 0.0;
            continue;
        }

        try {
            // AXIOMA: Optimización por Dirty Flag (Task 3)
            if (!artifact || artifact._isDirty || law._isDragging || state.isLoading) {
                if (executors.x) buffer[offset] = executors.x(state, jit);
                if (executors.y) buffer[offset + 1] = executors.y(state, jit);

                buffer[offset + 2] = executors.radius ? executors.radius(state, jit) : 10;

                let visibility = executors.u_visibility ? executors.u_visibility(state, jit) : 1.0;
                if (state.isLoading) {
                    visibility = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
                }
                buffer[offset + 3] = visibility;
            }
        } catch (err) {
            buffer[offset + 3] = 0.0;
        }
    }
}

function handleHFSUpdate(targetId, property, value) {
    const law = iskContext.laws[targetId];
    if (!law) return;

    const offset = law.index * 4;
    const activeBuffer = currentBufferIsA ? bufferA : bufferB;

    switch (property) {
        case 'u_pos':
            if (Array.isArray(value)) {
                activeBuffer[offset] = value[0];
                activeBuffer[offset + 1] = value[1];
                velocityBuffer[offset] = 0; // Reset velocity on drag
                velocityBuffer[offset + 1] = 0;
                law._isDragging = true;
            }
            break;
        case 'u_drag_end':
            law._isDragging = false;
            break;
        case 'u_radius':
            activeBuffer[offset + 2] = value;
            break;
        case 'u_visibility':
            activeBuffer[offset + 3] = value ? 1.0 : 0.0;
            break;
    }

    const partial = activeBuffer.slice();
    self.postMessage({
        action: 'REIFICATION_RESULT',
        results: partial,
        isPartial: true
    }, [partial.buffer]);
}



