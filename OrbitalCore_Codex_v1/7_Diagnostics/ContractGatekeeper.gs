/**
 * 7_Diagnostics/ContractGatekeeper.gs
 * DHARMA: Guardián de la Integridad Esquemática y las Leyes Axiomáticas.
 * Version: 5.0.0 (Axiom of Purity Active)
 */

/**
 * Factory para crear el ContractGatekeeper.
 * @param {object} config - Dependencias
 * @param {object} config.laws - Objeto de leyes soberanas (Layer 0)
 */
function createContractGatekeeper({ laws = {} }) {
    const axioms = laws.axioms || {};
    const constitution = laws.constitution || {};
    
    let _intelligence = null;

    const Gatekeeper = {
        label: "Contract Gatekeeper",
        description: "Guardian of schematic integrity and axiomatic laws.",
        archetype: "SYSTEM_INFRA",
        resource_weight: "low",
        
        setIntelligence: function(intelligence) {
            _intelligence = intelligence;
        },

        /**
         * Realiza una auditoría exhaustiva de la Constitución (Capa 0).
         * @returns {string[]} Lista de brechas detectadas.
         */
        collectConstitutionalGaps: function() {
            const gaps = [];
            const requiredRoots = ['anchorPropertyKey', 'driveSchema', 'sheetsSchema', 'systemLimits', 'cosmosRegistry'];
            
            // 1. Verificación de Nomenclatura CamelCase en Raíces
            requiredRoots.forEach(root => {
                if (!constitution[root]) {
                    const snake = root.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                    if (constitution[snake]) {
                        gaps.push(`[Constitución] Clave '${snake}' detectada en snake_case. Debe ser '${root}' (Consonancia L0).`);
                    } else {
                        gaps.push(`[Constitución] Clave crítica '${root}' ausente.`);
                    }
                }
            });

            // 2. Verificación de Esquemas de Hojas
            if (constitution.sheetsSchema) {
                const schema = constitution.sheetsSchema;
                if (!schema.jobQueue) gaps.push("[Constitución] sheetsSchema.jobQueue es requerido para la persistencia de procesos.");
                if (!schema.auditLog) gaps.push("[Constitución] sheetsSchema.auditLog es requerido para la trazabilidad.");
            }

            return gaps;
        },

        validateAllContracts: function(stack, configurator) {
            const executionStack = stack;
            if (!executionStack) throw new Error("[ContractGatekeeper] No execution stack provided for audit.");
            
            const results = {
                isValid: true,
                hasWarnings: false,
                errors: [],
                criticalErrors: [],
                warnings: [],
                auditedModules: 0,
                safeModeActive: configurator?.isInSafeMode ? configurator.isInSafeMode() : false
            };

            // 0. Auditoría de la Constitución
            const constitutionalGaps = this.collectConstitutionalGaps();
            constitutionalGaps.forEach(gap => results.criticalErrors.push(`[CONSTITUTION] ${gap}`));

            // AXIOMA: Usar reglas centralizadas de Capa 0
            const purityRules = axioms.PURITY_RULES || {};
            const reservedKeys = purityRules.RESERVED_KEYS || [];
            const institutionalKeys = purityRules.INSTITUTIONAL_KEYS || [];
            
            const seenSystems = new Set();
            
            Object.keys(executionStack).forEach(key => {
                // Excluir claves estructurales y claves institucionales
                if (reservedKeys.includes(key) || institutionalKeys.includes(key)) return;
                
                const module = executionStack[key];
                if (typeof module !== 'object' || module === null) return;
                if (seenSystems.has(module)) return;
                seenSystems.add(module);

                results.auditedModules++;
                const moduleErrors = [];
                this._auditModule(key, module, { errors: moduleErrors });

                if (moduleErrors.length > 0) {
                    const criticalList = axioms.CRITICAL_SYSTEMS || [];
                    const isCritical = Array.isArray(criticalList) && criticalList.includes(key);
                    moduleErrors.forEach(err => {
                        if (!results.errors) results.errors = [];
                        results.errors.push(err);
                        if (isCritical && !results.safeModeActive) {
                            if (!results.criticalErrors) results.criticalErrors = [];
                            results.criticalErrors.push(err);
                        } else {
                            if (!results.warnings) results.warnings = [];
                            results.warnings.push(err);
                        }
                    });
                }
            });

            // 4. Auditoría de Alineación L2
            if (typeof MasterLaw_Alignment !== 'undefined') {
                const alignmentAudit = MasterLaw_Alignment.runAudit();
                if (!alignmentAudit.isAligned) {
                    results.isValid = false;
                    alignmentAudit.gaps.forEach(gap => {
                        results.criticalErrors.push(`[L2 Alignment] ${gap.message}`);
                    });
                }
                alignmentAudit.warnings.forEach(warn => {
                    results.warnings.push(`[L2 Debt] ${warn.message}`);
                });
            }

            // 5. Auditoría de Identidad y Pureza - INTEGRADA en el loop principal (líneas 76-107)

            results.isValid = results.criticalErrors.length === 0;
            results.hasWarnings = results.warnings.length > 0;
            return results;
        },

        // ELIMINADO: Redundante con la validación en validateAllContracts

        checkVaultHealth: function(cipherAdapter) {
            if (!cipherAdapter) return { healthy: false, error: "Missing CipherAdapter." };
            try {
                const start = Date.now();
                const testText = "HEALTH_PROBE";
                const testKey = "INTERNAL_HEALTH_KEY";
                const encrypted = cipherAdapter.encrypt({ text: testText, key: testKey });
                const decrypted = cipherAdapter.decrypt({ cipher: encrypted, key: testKey });
                const latency = Date.now() - start;
                
                return {
                    healthy: decrypted === testText,
                    latency,
                    timestamp: new Date().toISOString()
                };
            } catch (e) {
                return { healthy: false, error: e.message, timestamp: new Date().toISOString() };
            }
        },

        _auditModule: function(moduleName, module, results) {
            const prefix = `[Module: ${moduleName}]`;
            
            this._validateIdentity(prefix, module, results);
            this._validateSecurity(prefix, moduleName, module, results);
            
            // Axioma de Inteligencia de Roles: Los adaptadores DEBEN tener esquemas IO.
            const isAdapter = module.archetype === 'ADAPTER' || moduleName.toLowerCase().includes('adapter');
            if (isAdapter) {
                if (!module.schemas || Object.keys(module.schemas).length === 0) {
                    console.log(`[Gatekeeper DEBUG] Failed Adapter: ${moduleName}`, JSON.stringify(module));
                    results.errors.push(`${prefix} Violación de Rol ADAPTER: No expone esquemas de interfaz IO.`);
                }
                if (!module.semantic_intent) {
                    results.errors.push(`${prefix} Violación de Rol ADAPTER: Falta semantic_intent (GATE/BRIDGE/STREAM).`);
                }
            }

            this._validateSchemas(prefix, module, results);
        },

        _validateIdentity: function(prefix, module, results) {
            const keys = module ? Object.keys(module) : [];
            const moduleSummary = keys.length > 0 ? `{ keys: [${keys.join(', ')}] }` : 'null';
            
            if (!module.label) {
                const alt = keys.find(k => k.toLowerCase() === 'label');
                const suggest = alt ? ` (Did you mean '${alt}'?)` : '';
                results.errors.push(`${prefix} Missing 'label'.${suggest} ${moduleSummary}`);
            }
            if (!module.description) {
                const alt = keys.find(k => k.toLowerCase() === 'description');
                const suggest = alt ? ` (Did you mean '${alt}'?)` : '';
                results.errors.push(`${prefix} Missing 'description'.${suggest}`);
            }
        },

        _validateSecurity: function(prefix, moduleName, module, results) {
            // AXIOMA: Usar reglas centralizadas de Capa 0
            const purityRules = axioms.PURITY_RULES || {};
            const forbiddenTerms = purityRules.FORBIDDEN_TERMS || [];
            const exemptArchetypes = purityRules.EXEMPT_ARCHETYPES || [];
            
            // Verificar si el módulo está exento por su arquetipo
            const isExempt = exemptArchetypes.includes(module.archetype);
            if (isExempt) return; // Arquetipos exentos pueden usar términos institucionales
            
            const combinedText = `${module.label || ''} ${module.description || ''}`.toLowerCase();
            const foundForbidden = forbiddenTerms.some(term => combinedText.includes(term.toLowerCase()));
            
            if (foundForbidden) {
                results.errors.push(`${prefix} VIOLACIÓN DE PUREZA: Término prohibido detectado en metadatos.`);
            }
        },

        _validateSchemas: function(prefix, module, results) {
            if (module.schemas) {
                Object.keys(module.schemas).forEach(methodName => {
                    const res = this.validateSchema(module.schemas[methodName], `${prefix}.${methodName}`);
                    if (!res.isValid) results.errors.push(...res.errors);
                });
            }
        },

        validateSchema: function(schema, prefix) {
            const errors = [];
            const behaviors = axioms.CORE_LOGIC?.IO_BEHAVIORS || axioms.ROLES;
            
            if (schema.io && schema.io.inputs) {
                Object.keys(schema.io.inputs).forEach(name => {
                    const input = schema.io.inputs[name];
                    const inputBehavior = input.io_behavior || input.role;
                });
            }

            return { isValid: errors.length === 0, errors };
        },

        _auditSemanticsAI: function(moduleName, label, description) {
            if (!_intelligence) return null;
            try {
                const prompt = `Analiza semánticamente el nombre y la descripción de este módulo dentro del contexto de un sistema de orquestación industrial (MCEP). Detecta impurezas institucionales (nombres prohibidos como "indra"), branding inadecuado o intenciones ocultas que violen la sobriedad técnica.
                Módulo: ${moduleName}
                Label: ${label}
                Descripción: ${description}
                
                Retorna UNICAMENTE un JSON con este formato:
                { "purity": "passed" | "failed", "reason": "...", "risk_score": 0-1 }`;
                
                const result = _intelligence.askArchitect({ 
                    prompt, 
                    model: 'llama-3.1-8b-instant', 
                    accountId: 'system' 
                });
                const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
                return null;
            }
        },

        getAffinity: function({ source, target }) {
            if (!source || !target) return { affinityScore: 0, compatible: false };
            
            const sourceRole = source.role || "unknown";
            const targetRole = target.role || "unknown";

            const affinityScore = this._calculateRoleAffinity(sourceRole, targetRole);
            const typeMatch = source.type === target.type;
            const securityWarnings = this._checkSecurityGuardrails(source, target);

            return {
                affinityScore,
                compatible: affinityScore > 0.5 && typeMatch,
                typeMatch,
                securityWarnings
            };
        },

        _calculateRoleAffinity: function(source, target) {
            if (source === target) return 1.0;
            const sParts = source.split('/');
            const tParts = target.split('/');
            if (sParts[0] === tParts[0]) return 0.75;
            const genericRoles = ['data', 'content', 'id'];
            if (genericRoles.includes(sParts[0]) && genericRoles.includes(tParts[0])) return 0.5;
            return 0.1;
        },

        _checkSecurityGuardrails: function(source, target) {
            const warnings = [];
            if (source.sensitivity === 'secret' && target.exposure === 'public') {
                warnings.push("CRITICAL: Attempting to connect SECRET data to a PUBLIC exposure port.");
            }
            return warnings;
        }
    };

    return Object.freeze(Gatekeeper);
}

/**
 * EXPORTACIÓN GLOBAL para tests y diagnósticos
 * Se inicializa con la versión soberana de las leyes si están disponibles.
 */
var ContractGatekeeper = createContractGatekeeper({ 
    laws: {
        axioms: typeof LOGIC_AXIOMS !== 'undefined' ? LOGIC_AXIOMS : {},
        constitution: typeof SYSTEM_CONSTITUTION !== 'undefined' ? SYSTEM_CONSTITUTION : {}
    } 
});
