/**
 * 🛰️ ISK: HYBRID JIT COMPILER (v1.0)
 * Transpila expresiones {{ ... }} a funciones de ejecución rápida para WebWorkers
 * e identifica fragmentos inyectables en GLSL (GPU).
 */

export class JITCompiler {
    constructor() {
        this.cache = new Map();
        // Diccionario de funciones matemáticas seguras admitidas en GLSL y JS
        this.allowedMathDocs = ['sin', 'cos', 'tan', 'abs', 'min', 'max', 'pow', 'sqrt', 'exp', 'log', 'floor', 'ceil', 'round'];
        this.aliases = new Map(); // Semantic Name -> Core Path
    }

    /**
     * Establece un mapa de alias para desacoplar el Core del ISK.
     * @param {Object} aliasMap - Ej: { intensity: 'core.power_level' }
     */
    setAliases(aliasMap) {
        for (const [alias, path] of Object.entries(aliasMap)) {
            this.aliases.set(alias, path);
        }
    }

    /**
     * Compila una expresión sistémica a una función ejecutable.
     * @param {string} expression - Ej: "{{ core.power | map(0, 100, 40, 80) }}"
     */
    compile(expression) {
        if (this.cache.has(expression)) return this.cache.get(expression);

        const cleanExpr = expression.replace(/^{{|}}$/g, '').trim();

        // Divide por pipes | para filtros
        const parts = cleanExpr.split('|').map(p => p.trim());
        const source = parts[0]; // Ej: core.power
        const filters = parts.slice(1);

        // Construcción de la función de ejecución (Worker Side)
        const executor = this._buildJSExecutor(source, filters);

        // Intento de transpilación a GLSL (GPU Side)
        const glsl = this._tryTranspileToGLSL(source, filters);

        const result = {
            executor,
            glsl,
            dependencies: [source]
        };

        this.cache.set(expression, result);
        return result;
    }

    _buildJSExecutor(source, filters) {
        let logic = `const val = state.${source};`;

        filters.forEach(filter => {
            if (filter.startsWith('map(')) {
                const params = filter.match(/\(([^)]+)\)/)[1];
                logic += `val = this._map(val, ${params});`;
            } else if (filter.startsWith('oscillate(')) {
                const params = filter.match(/\(([^)]+)\)/)[1];
                logic += `val = this._oscillate(val, ${params});`;
            }
            // Add more filters as needed
        });

        try {
            // Resolvemos el alias si existe
            const resolvedSource = this.aliases.has(source) ? this.aliases.get(source) : source;

            // SECURITY: Evitar acceso a globals (window, document, eval)
            const sanitizedSource = resolvedSource.replace(/[^a-zA-Z0-9_.]/g, '');

            // Retornamos una función que toma el estado global del sistema
            return new Function('state', 'compiler', `
        "use strict";
        let val = state["${sanitizedSource}"];
        if (val === undefined) return 0;
        ${this._buildFilterLogic(filters)}
        return val;
      `);
        } catch (e) {
            console.error("JIT Error compiling expression:", source, e);
            return () => 0;
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

    _tryTranspileToGLSL(source, filters) {
        // Solo transpilamos si los filtros son puramente matemáticos y compatibles
        let glsl = `state_${source.replace(/\./g, '_')}`;

        for (const f of filters) {
            if (f.startsWith('map(')) {
                const args = f.match(/\((.*)\)/)[1].split(',').map(a => a.trim());
                glsl = `mix(${args[2]}, ${args[3]}, clamp((${glsl} - ${args[0]}) / (${args[1]} - ${args[0]}), 0.0, 1.0))`;
            } else {
                return null; // Filtro no soportado en GLSL, forzamos CPU execution
            }
        }
        return glsl;
    }

    // LIBRERÍA DE FUNCIONES MATEMÁTICAS INTERNAS (Reutilizadas por el Executor)
    lib = {
        map: (val, inMin, inMax, outMin, outMax) => {
            return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
        },
        oscillate: (time, freq) => {
            return Math.sin(time * freq * Math.PI * 2) * 0.5 + 0.5;
        },
        lerp: (a, b, t) => a + (b - a) * t
    }
}



