/**
 * 🧵 ISK: SPATIAL WORKER (v3.2 - Hardened)
 * Thread-side Expression Engine & Real-Time Reification.
 * Features: Internal JIT, Double Buffering (Zero-Copy), Safety Fallbacks.
 */

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
let context = null;
let bufferA = null;
let bufferB = null;
let currentBufferIsA = true;

self.onmessage = function (e) {
    const { action, payload } = e.data;

    switch (action) {
        case 'INIT':
            context = payload; // laws: { id: { executors: { x: "{{...}}", ... }, index: n } }
            const totalSize = payload.textureSize * payload.textureSize * 4;

            // Double Buffering allocation
            bufferA = new Float32Array(totalSize);
            bufferB = new Float32Array(totalSize);

            // Pre-compilación de leyes
            for (const law of Object.values(context.laws)) {
                for (const attr in law.executors) {
                    const expr = law.executors[attr];
                    if (typeof expr === 'string') {
                        law.executors[attr] = jit.compile(expr);
                    }
                }
            }
            break;

        case 'UPDATE_STATE':
            if (!context) return;
            const { state, sequenceId } = payload;

            // Escribimos en el buffer inactivo
            const targetBuffer = currentBufferIsA ? bufferB : bufferA;
            processState(state, targetBuffer);

            // Enviamos el buffer como Transferable
            const results = targetBuffer;
            self.postMessage({
                action: 'REIFICATION_RESULT',
                results: results,
                sequenceId
            }, [results.buffer]);

            // IMPORTANTE: Al transferir, perdemos la referencia del buffer. 
            // Debemos recrearlo para el siguiente ciclo.
            if (currentBufferIsA) {
                bufferB = new Float32Array(results.length);
            } else {
                bufferA = new Float32Array(results.length);
            }

            currentBufferIsA = !currentBufferIsA;
            break;

        case 'HFS_UPDATE':
            if (!context) return;
            const { target_id, property, value } = payload;
            handleHFSUpdate(target_id, property, value);
            break;
    }
};

function processState(state, buffer) {
    const laws = context.laws;
    for (const [id, law] of Object.entries(laws)) {
        const offset = law.index * 4;
        const executors = law.executors;

        try {
            // Mapeo canónico v3.2
            buffer[offset] = executors.x ? executors.x(state, jit) : 0;
            buffer[offset + 1] = executors.y ? executors.y(state, jit) : 0;
            buffer[offset + 2] = executors.radius ? executors.radius(state, jit) : 10;

            // u_visibility / Active flag (Canal W / Alpha)
            const visibility = executors.u_visibility ? executors.u_visibility(state, jit) : 1.0;
            buffer[offset + 3] = visibility;
        } catch (err) {
            buffer[offset + 3] = 0.0;
        }
    }
}

function handleHFSUpdate(targetId, property, value) {
    const law = context.laws[targetId];
    if (!law) return;

    const offset = law.index * 4;
    const activeBuffer = currentBufferIsA ? bufferA : bufferB;

    switch (property) {
        case 'u_pos':
            if (Array.isArray(value)) {
                activeBuffer[offset] = value[0];
                activeBuffer[offset + 1] = value[1];
            }
            break;
        case 'u_radius':
            activeBuffer[offset + 2] = value;
            break;
        case 'u_visibility':
            activeBuffer[offset + 3] = value ? 1.0 : 0.0;
            break;
    }

    // Feedback visual inmediato (Copia parcial)
    const partial = activeBuffer.slice();
    self.postMessage({
        action: 'REIFICATION_RESULT',
        results: partial,
        isPartial: true
    }, [partial.buffer]);
}
