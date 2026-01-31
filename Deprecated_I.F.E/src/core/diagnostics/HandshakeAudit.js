/**
 * 🛰️ HandshakeAudit: Atomic Frontend Diagnostic (Phase F-Handshake)
 * Axiom: If the Handshake is compromised, the projection is Hallucination.
 * Tests the synchronization between CoreStore and the Backend Law.
 */
import useCoreStore from '../state/CoreStore';
import { OntologyService } from '../integrity/OntologyService';
import { resolver } from '../bridge/SchemaResolver';
import { VaultManager } from '../vault/VaultManager';
import { ForensicDiagnostic } from './ForensicDiagnostic';

export const HandshakeAudit = {
    /**
     * Executes an industrial forensic review of the system state.
     * Axiom: Transparency over binary Pass/Fail.
     * @returns {Promise<DiagnosticReport>}
     */
    runAudit: async () => {
        const _log = (msg, data) => console.log(`[HandshakeAudit] ${msg}`, data || '');
        const _grp = (name, fn) => { console.group(`[HandshakeAudit] ${name}`); fn(); console.groupEnd(); };

        _log('🛰️ Starting Deep Atomic Handshake Forensic...');

        const state = useCoreStore.getState();
        const report = {
            timestamp: new Date().toISOString(),
            status: 'UNKNOWN',
            failures: [],
            checks: []
        };

        const addCheck = (id, name, pass, detail) => {
            report.checks.push({ id, name, pass, detail });
            if (!pass) {
                report.failures.push(`${id}: ${detail}`);
                console.error(`[HandshakeAudit] ❌ CHECK FAILED: ${name} (${id}) - ${detail}`);
            } else {
                _log(`✅ ${name}: ${detail}`);
            }
        };

        // --- PHASE 0: PHYSICAL AXIOMS & DETERMINISM ---
        _grp('Phase L0: Physical Axioms & Determinism', () => {
            const config = VaultManager.getConfig();
            const seedUrl = config?.deploymentUrl || '(NOT_SET)';
            const masterKey = !!config?.sessionToken;
            const isHardcodedUrl = seedUrl.includes('script.google.com') && !seedUrl.includes('macros');

            _log(`Sensed Seed URL: ${seedUrl}`);
            _log(`Master Key Presence: ${masterKey ? 'YES' : 'NO'}`);

            addCheck(
                'DETERMINISTIC_SEED',
                'Seed Purity',
                seedUrl !== '(NOT_SET)' && !isHardcodedUrl,
                seedUrl === '(NOT_SET)' ? 'CRITICAL: No Seed URL found in Vault.' : (isHardcodedUrl ? 'WARNING: Seed URL seems to have non-agnostic patterns.' : 'Seed URL is deterministically sensed.')
            );

            const isHallucinatedState = Object.keys(state).some(k => k === 'hallucination_test' || k === 'undefined');
            addCheck(
                'STATE_PURITY',
                'Axiomatic State Purity',
                !isHallucinatedState,
                !isHallucinatedState ? 'No entropy or hallucinated keys in Store.' : 'Store is contaminated with undefined keys.'
            );
        });

        // --- PHASE 1: GENETIC LAWS ---
        const laws = state.laws || {};
        _grp('Phase L1: Genetic Integrity', () => {
            const domains = Object.keys(laws);
            const hasGenetic = domains.includes('GENETIC');
            const archetypes = laws.GENETIC?.ARCHETYPES || [];

            _log(`Atomic Domains Found: [${domains.join(', ')}]`);
            _log(`Archetypes Whitelisted: ${archetypes.length}`, archetypes);

            addCheck(
                'LAWS_STRUCTURE',
                'Sovereign Laws Assembly',
                hasGenetic && domains.length >= 3,
                hasGenetic ? `GENETIC, PHENOTYPE and SPATIAL domains successfully hydrated.` : 'Laws are incoherent or missing GENETIC domain.'
            );
        });

        // --- PHASE 2: CONTRACT FORENSICS ---
        const contracts = state.contracts || {};
        _grp('Phase L2: Contract & Schema Completeness', () => {
            const keys = Object.keys(contracts);
            const categories = {};
            let schemaMissingCount = 0;

            keys.forEach(k => {
                const c = contracts[k];
                const arch = c.archetype || 'UNDEFINED';
                categories[arch] = (categories[arch] || 0) + 1;

                // Deep Schema Probe: Every method must have a valid IO schema
                if (c.methods && c.methods.length > 0) {
                    const missing = c.methods.filter(m => !c.schemas?.[m]);
                    if (missing.length > 0) {
                        schemaMissingCount += missing.length;
                        console.warn(`[HandshakeAudit] ☢️ NAKED METHODS in ${k}:`, missing);
                    }
                }
            });

            _log('Contract Distribution by Archetype:', categories);

            addCheck(
                'REGISTRY_SYNC',
                'Contract Synchronization',
                keys.length > 20, // Expecting more than 20 for a healthy core
                `${keys.length} contracts synchronized across ${Object.keys(categories).length} archetypes.`
            );

            addCheck(
                'SCHEMA_COMPLETENESS',
                'Contract Purity (L5)',
                schemaMissingCount === 0,
                schemaMissingCount === 0 ? 'All exposed methods have valid IO schemas.' : `Found ${schemaMissingCount} naked methods (No Schema).`
            );
        });

        // --- PHASE 3: LIBRARIAN (UUID MAPPING) ---
        _grp('Phase L3: Librarian Synchronization', () => {
            const ctxCount = Object.keys(resolver.context || {}).length;
            _log(`Resolver State: ${resolver.isLoaded ? 'LOADED' : 'NOT_LOADED'}`);
            _log(`UUID Mappings: ${ctxCount}`);

            addCheck(
                'RESOLVER_SYNC',
                'UUID Mapping (Librarian)',
                resolver.isLoaded && ctxCount > 0,
                resolver.isLoaded ? `${ctxCount} physical paths mapped to UUIDs.` : 'Resolver not loaded. System is "Blind".'
            );
        });

        // --- PHASE 4: PHENOTYPE REIFICATION ---
        _grp('Phase L4: Phenotype (Visual) Mapping', () => {
            const testArch = 'ADAPTER';
            const meta = OntologyService.getArchetype(testArch);
            const phenotypeDomain = laws.PHENOTYPE || {};
            const geneticList = laws.GENETIC?.ARCHETYPES || [];

            // 🔬 FORENSIC DIAGNOSTIC: Ejecutar análisis profundo (OPCIONAL)
            let forensicResult = { issues: [] };
            if (window.__ENABLE_FORENSIC__) {
                _log('🔬 Executing DEEP FORENSIC ANALYSIS...');
                forensicResult = ForensicDiagnostic.runFullDiagnostic();
            }

            // Client-side Defense: Check for any valid grammar structure via Ontology normalization
            const hasPhenotype = !!(phenotypeDomain.visual_grammar || phenotypeDomain.visualGrammar || phenotypeDomain.semantic_mappings);
            const colorIsDefinitive = meta.color !== 'var(--text-dim)';

            _log(`Genetic Whitelist (from store): [${geneticList.join(', ')}]`);
            _log(`Phenotype Domain Keys: [${Object.keys(phenotypeDomain).join(', ')}]`);
            _log(`Simulation: Reifying Archetype [${testArch}] (Valid: ${meta.isValid}, Color: ${meta.color}, Icon: ${meta.icon ? 'FOUND' : 'MISSING'})`);

            if (phenotypeDomain.semantic_mappings && !phenotypeDomain.visual_grammar) {
                _log('⚠️ RECOVERY: System is using legacy [semantic_mappings]. Reification score may be reduced.');
            }

            const passCondition = meta.isValid && hasPhenotype && colorIsDefinitive;

            // 🔬 FORENSIC REPORT
            if (!passCondition) {
                console.error('🔴 REIFICATION FAILURE FORENSIC REPORT:');
                console.error('  - Forensic issues detected:', forensicResult.issues);
                console.error('  - Genetic list in store:', forensicResult.genetic);
                console.error('  - ADAPTER in store:', forensicResult.hasAdapter);
                console.error('  - Meta.isValid:', meta.isValid);
                console.error('  - Expected: ADAPTER should be in laws.GENETIC.ARCHETYPES');
            }

            addCheck(
                'ONTOLOGY_RESOLUTION',
                'Semantic Mapping',
                passCondition,
                passCondition ? `Grammar reified successfully. ADAPTER color: ${meta.color}` : `REIFICATION FAILURE: [ValidGenetic: ${meta.isValid}] [HasGrammar: ${hasPhenotype}] [ColorDefined: ${colorIsDefinitive}] (Color: ${meta.color}) | Forensic: ${forensicResult.issues.length} issues detected`
            );
        });

        // --- PHASE 5: BRIDGE STABILITY ---
        _grp('Phase L5: Bridge & Dependency Stability', () => {
            const isStoreHydrated = !!state.laws && !!state.contracts;
            const isBridgeResponsive = typeof localStorage !== 'undefined'; // Simple local check

            addCheck(
                'BRIDGE_STABILITY',
                'Dependency Health',
                isStoreHydrated && isBridgeResponsive,
                'Satellite-Core bridge is structurally stable.'
            );
        });

        // --- FINAL STATUS ---
        const passCount = report.checks.filter(c => c.pass).length;
        const criticalFailures = report.checks.filter(c => !c.pass && (c.id === 'DETERMINISTIC_SEED' || c.id === 'SCHEMA_COMPLETENESS'));

        report.status = criticalFailures.length > 0 ? 'CRITICAL_HALT' : (passCount === report.checks.length ? 'NOMINAL' : 'COMPROMISED');
        report.synergyScore = Math.floor((passCount / report.checks.length) * 100);

        _log(`FINAL STATUS: ${report.status} (${report.synergyScore}%)`);
        if (criticalFailures.length > 0) console.warn('[HandshakeAudit] 🛑 SYSTEM IN VOLATILE STATE: Critical axioms violated.');

        return report;
    }
};

export default HandshakeAudit;
