/**
 * 7_Diagnostics/ContractBuilder.gs
 * 
 * DHARMA: Automatizador de Estructuras Esquemáticas v5.5.
 * PROPÓSITO: Generar el boilerplate industrial (Contract.json) basado en el Decálogo.
 */

const ContractBuilder = {
    /**
     * Genera un esquema base para un módulo bajo el Canon v5.5.
     */
    buildBoilerplate: function(moduleInstance) {
        const boilerplate = {
            label: "Sugerencia: Nombre del Artefacto",
            description: "Sugerencia: Propósito funcional del artefacto",
            semantic_intent: "STREAM", // Seleccionar uno del Decálogo
            io_interface: {
                inputs: {},
                outputs: {}
            },
            behavior: {
                energy: "LOW_LATENCY",
                frequency: "ON_DEMAND"
            }
        };
        
        const methods = Object.keys(moduleInstance).filter(prop => 
            typeof moduleInstance[prop] === 'function' && !prop.startsWith('_') && prop !== 'schemas'
        );

        methods.forEach(methodName => {
            const fn = moduleInstance[methodName];
            const args = this._extractArgs(fn);
            
            boilerplate.io_interface.inputs = Object.assign(boilerplate.io_interface.inputs, this._buildInputSkeleton(args));
            boilerplate.io_interface.outputs[methodName + "_result"] = { 
                type: "any", 
                role: "STREAM", 
                description: "Resultado de la ejecución del método." 
            };
        });

        return boilerplate;
    },

    _extractArgs: function(fn) {
        const fnStr = fn.toString();
        const argsMatch = fnStr.match(/\(([^)]*)\)/);
        if (!argsMatch) return [];
        return argsMatch[1].split(',').map(arg => arg.trim()).filter(arg => arg !== '');
    },

    _buildInputSkeleton: function(args) {
        const inputs = {};
        args.forEach(arg => {
            if (arg.startsWith('{') && arg.endsWith('}')) {
                const innerArgs = arg.substring(1, arg.length - 1).split(',').map(a => a.trim());
                innerArgs.forEach(inner => {
                    inputs[inner] = { 
                        type: "any", 
                        role: "PROBE",
                        description: `Representa el parámetro ${inner}`
                    };
                });
            } else {
                inputs[arg] = { 
                    type: "any", 
                    role: "PROBE",
                    description: `Representa el parámetro ${arg}`
                };
            }
        });
        return inputs;
    }
};

/**
 * Utilidad v5.5: Imprime el Contract.json boilerplate.
 */
function buildModuleContract(moduleInstance) {
    const boilerplate = ContractBuilder.buildBoilerplate(moduleInstance);
    console.log("--- 🏗️ BOILERPLATE INDUSTRIAL v5.5 GENERADO ---");
    console.log(JSON.stringify(boilerplate, null, 2));
    console.log("----------------------------------------------");
    return boilerplate;
}
