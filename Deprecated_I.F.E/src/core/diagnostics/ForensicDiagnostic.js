/**
 * 🔬 FORENSIC DIAGNOSTIC SUITE
 * Deep structural analysis of the Core-Satellite data pipeline
 */

import useCoreStore from '../state/CoreStore';

export const ForensicDiagnostic = {
    /**
     * Ejecuta un análisis forense completo de la transmisión de datos
     */
    runFullDiagnostic() {
        console.group('🔬 FORENSIC DIAGNOSTIC: GENETIC TRANSMISSION PIPELINE');

        const store = useCoreStore.getState();
        const laws = store.laws || {};

        // ========================================
        // NIVEL 1: ESTRUCTURA COMPLETA DEL STORE
        // ========================================
        console.group('📦 NIVEL 1: Store State Analysis');
        console.log('Store keys:', Object.keys(store));
        console.log('Laws object exists:', !!laws);
        console.log('Laws keys:', Object.keys(laws));
        console.log('Laws type:', typeof laws);
        console.log('Laws is array:', Array.isArray(laws));
        console.groupEnd();

        // ========================================
        // NIVEL 2: DOMINIO GENETIC
        // ========================================
        console.group('🧬 NIVEL 2: GENETIC Domain Analysis');
        const genetic = laws.GENETIC;
        console.log('GENETIC exists:', !!genetic);
        console.log('GENETIC type:', typeof genetic);
        console.log('GENETIC keys:', genetic ? Object.keys(genetic) : 'N/A');

        if (genetic) {
            console.log('GENETIC.ARCHETYPES exists:', !!genetic.ARCHETYPES);
            console.log('GENETIC.ARCHETYPES type:', typeof genetic.ARCHETYPES);
            console.log('GENETIC.ARCHETYPES is array:', Array.isArray(genetic.ARCHETYPES));

            if (genetic.ARCHETYPES) {
                console.log('GENETIC.ARCHETYPES length:', genetic.ARCHETYPES.length);
                console.log('GENETIC.ARCHETYPES content:', JSON.stringify(genetic.ARCHETYPES, null, 2));

                // Test específico para ADAPTER
                const hasAdapter = genetic.ARCHETYPES.includes('ADAPTER');
                console.log(`%c${hasAdapter ? '✅' : '❌'} ADAPTER in GENETIC.ARCHETYPES: ${hasAdapter}`,
                    hasAdapter ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
            }

            // Verificar si hay una estructura anidada incorrecta
            if (genetic.GENETIC) {
                console.warn('⚠️ ANOMALY DETECTED: GENETIC.GENETIC exists (double nesting)');
                console.log('GENETIC.GENETIC.ARCHETYPES:', genetic.GENETIC.ARCHETYPES);
            }
        }
        console.groupEnd();

        // ========================================
        // NIVEL 3: DOMINIO PHENOTYPE
        // ========================================
        console.group('🎨 NIVEL 3: PHENOTYPE Domain Analysis');
        const phenotype = laws.PHENOTYPE;
        console.log('PHENOTYPE exists:', !!phenotype);
        console.log('PHENOTYPE keys:', phenotype ? Object.keys(phenotype) : 'N/A');

        if (phenotype) {
            console.log('Has visual_grammar:', !!phenotype.visual_grammar);
            console.log('Has visualGrammar:', !!phenotype.visualGrammar);
            console.log('Has semantic_mappings:', !!phenotype.semantic_mappings);

            const grammar = phenotype.visual_grammar || phenotype.visualGrammar;
            if (grammar) {
                console.log('Grammar keys:', Object.keys(grammar));
                console.log('Grammar.ARCHETYPES exists:', !!grammar.ARCHETYPES);

                if (grammar.ARCHETYPES) {
                    const adapterDef = grammar.ARCHETYPES.ADAPTER;
                    console.log('ADAPTER definition:', adapterDef);
                }
            }
        }
        console.groupEnd();

        // ========================================
        // NIVEL 4: ONTOLOGY SERVICE SIMULATION
        // ========================================
        console.group('🔍 NIVEL 4: OntologyService Simulation');

        // Simular exactamente lo que hace OntologyService.getArchetype()
        const testArch = 'ADAPTER';
        const geneticList = laws.GENETIC?.ARCHETYPES || [];
        const phenotypeDomain = laws.PHENOTYPE || {};

        console.log('Step 1 - Extract genetic list:');
        console.log('  laws.GENETIC?.ARCHETYPES:', geneticList);
        console.log('  Type:', typeof geneticList);
        console.log('  Is Array:', Array.isArray(geneticList));
        console.log('  Length:', geneticList.length);

        console.log('\nStep 2 - Check ADAPTER presence:');
        const isValid = geneticList.includes(testArch);
        console.log(`  geneticList.includes('ADAPTER'):`, isValid);
        console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

        console.log('\nStep 3 - Extract phenotype:');
        const visualGrammar = phenotypeDomain.visual_grammar || phenotypeDomain.visualGrammar || {
            ARCHETYPES: phenotypeDomain.semantic_mappings || {}
        };
        const phenotypeDef = visualGrammar.ARCHETYPES?.[testArch] || {};
        console.log('  Visual Grammar:', visualGrammar);
        console.log('  ADAPTER phenotype:', phenotypeDef);

        console.log('\nStep 4 - Color resolution:');
        const color = phenotypeDef.border_color || phenotypeDef.color || (geneticList.includes(testArch) ? '#00ffaa' : 'var(--text-dim)');
        console.log('  Resolved color:', color);
        console.log('  Color is definitive:', color !== 'var(--text-dim)');

        console.groupEnd();

        // ========================================
        // NIVEL 5: RAW JSON DUMP
        // ========================================
        console.group('📄 NIVEL 5: Raw JSON Structure');
        console.log('Complete laws object (stringified):');
        try {
            const lawsJson = JSON.stringify(laws, null, 2);
            console.log(lawsJson);
        } catch (e) {
            console.error('Failed to stringify laws:', e);
        }
        console.groupEnd();

        // ========================================
        // NIVEL 6: COMPARACIÓN CON CORE
        // ========================================
        console.group('🔄 NIVEL 6: Core vs Satellite Comparison');
        console.log('Expected from Core (based on test_genetic_transmission.gs):');
        console.log('  - Total archetypes: 14');
        console.log('  - ADAPTER present: YES');
        console.log('  - Structure: MasterLaw.GENETIC.ARCHETYPES');

        console.log('\nActual in Satellite:');
        console.log('  - Total archetypes:', geneticList.length);
        console.log('  - ADAPTER present:', geneticList.includes('ADAPTER') ? 'YES' : 'NO');
        console.log('  - Structure path used: laws.GENETIC?.ARCHETYPES');

        if (geneticList.length !== 14) {
            console.error(`❌ MISMATCH: Expected 14 archetypes, got ${geneticList.length}`);
        }

        if (!geneticList.includes('ADAPTER')) {
            console.error('❌ CRITICAL: ADAPTER missing in Satellite despite being present in Core');
        }
        console.groupEnd();

        // ========================================
        // RESUMEN FINAL
        // ========================================
        console.group('📊 DIAGNOSTIC SUMMARY');
        const issues = [];

        if (!laws.GENETIC) issues.push('GENETIC domain missing');
        if (!laws.GENETIC?.ARCHETYPES) issues.push('GENETIC.ARCHETYPES missing');
        if (!Array.isArray(laws.GENETIC?.ARCHETYPES)) issues.push('GENETIC.ARCHETYPES is not an array');
        if (laws.GENETIC?.ARCHETYPES?.length !== 14) issues.push(`Expected 14 archetypes, got ${laws.GENETIC?.ARCHETYPES?.length || 0}`);
        if (!laws.GENETIC?.ARCHETYPES?.includes('ADAPTER')) issues.push('ADAPTER not in archetypes list');

        if (issues.length === 0) {
            console.log('%c✅ NO STRUCTURAL ISSUES DETECTED', 'color: green; font-weight: bold; font-size: 14px');
            console.log('The data structure is correct. The problem must be in the validation logic.');
        } else {
            console.log('%c❌ ISSUES DETECTED:', 'color: red; font-weight: bold; font-size: 14px');
            issues.forEach(issue => console.error('  - ' + issue));
        }

        console.groupEnd();
        console.groupEnd();

        return {
            laws,
            genetic: geneticList,
            hasAdapter: geneticList.includes('ADAPTER'),
            issues
        };
    }
};

// Auto-ejecutar en desarrollo
if (import.meta.env.DEV) {
    window.ForensicDiagnostic = ForensicDiagnostic;
    console.log('💡 Forensic Diagnostic available. Run: ForensicDiagnostic.runFullDiagnostic()');
}
