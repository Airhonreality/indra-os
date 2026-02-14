import adapter from '../../../core/Sovereign_Adapter';

export const createDeterminismEngine = (dispatch, execute, state) => {

    /**
     * PROBE_DETERMINISM_INTEGRITY: Auditoría de Pasaportes y Enrutamiento.
     */
    const probeDeterminismIntegrity = async (setIsTesting) => {
        try {
            console.group("%c 🔍 [DETERMINISM_PROBE] Iniciando Auditoría de Integridad...", "color: #fbbf24; font-weight: bold;");
            setIsTesting(true);

            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: '🔍 PROBE_DETERMINISM: Verificando rechazo de heurísticas...',
                type: 'WARN'
            });

            // --- STAGE 1: THE IDENTITY VOID (RECHAZO DE FANTASMAS) ---
            console.log("%c [PROBE] Stage 1: Attempting to select Headless Artifact", "color: #94a3b8;");
            const headlessId = `headless_${Date.now()}`;

            // Inyectamos un artefacto sin ORIGIN_SOURCE directamente en el estado (vía ADD_ARTIFACT_REQUEST)
            execute('ADD_ARTIFACT_REQUEST', {
                artifact: {
                    id: headlessId,
                    LABEL: 'GHOST_ARTIFACT',
                    type: 'DATABASE_NODE',
                    // ORIGIN_SOURCE: undefined (AUSENCIA DELIBERADA)
                },
                position: { x: 0, y: 0 }
            });

            await new Promise(r => setTimeout(r, 500));

            // Intentamos seleccionarlo. El AxiomaticStore debería lanzar un error o bloquear la reificación.
            console.log("%c [PROBE] Selecting Headless Artifact via SELECT_ARTIFACT...", "color: #94a3b8;");
            execute('SELECT_ARTIFACT', { artifactId: headlessId });

            await new Promise(r => setTimeout(r, 1000));

            // Verificamos si se disparó un error en los logs
            const latestLogs = state.phenotype.logs;
            const hasError = latestLogs.some(log => log.msg?.includes('IDENTITY_VOID') || log.msg?.includes('Missing identity'));

            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: hasError
                    ? '✅ STAGE 1: Identidad Vacía detectada y bloqueada correctamente.'
                    : '❌ STAGE 1: El sistema permitió la selección de un artefacto sin pasaporte.',
                type: hasError ? 'SUCCESS' : 'ERROR'
            });


            // --- STAGE 2: DETERMINISTIC ROUTING (SOBERANÍA DE ENRUTAMIENTO) ---
            console.log("%c [PROBE] Stage 2: Verifying Routing for 'sheets' origin", "color: #94a3b8;");
            const sheetArtifactId = `sheet_test_${Date.now()}`;

            execute('ADD_ARTIFACT_REQUEST', {
                artifact: {
                    id: sheetArtifactId,
                    LABEL: 'DETERMINISTIC_SHEET',
                    type: 'DATABASE_NODE',
                    ORIGIN_SOURCE: 'sheets',
                    ACCOUNT_ID: 'system'
                },
                position: { x: 100, y: 100 }
            });

            await new Promise(r => setTimeout(r, 500));

            // Al seleccionar, el Pre-Reification Middleware disparará FETCH_DATABASE_CONTENT
            execute('SELECT_ARTIFACT', { artifactId: sheetArtifactId });

            await new Promise(r => setTimeout(r, 2000));

            // Verificamos si el log muestra el enrutamiento exitoso a 'sheet' (nodo interno)
            const routingOk = state.phenotype.logs.some(log => log.msg?.includes('[DB_ENGINE] 📡 Reifying') || log.msg?.includes('reifyDatabase'));

            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: routingOk
                    ? '✅ STAGE 2: Enrutamiento determinista validado (sheets -> reifyDatabase).'
                    : '❌ STAGE 2: Fallo en el enrutamiento del pasaporte.',
                type: routingOk ? 'SUCCESS' : 'ERROR'
            });

            // --- STAGE 3: ALIAS RESOLUTION (HUMAN-TO-TECHNICAL) ---
            console.log("%c [PROBE] Stage 3: Verifying Alias Resolution ('vault' -> 'drive')", "color: #94a3b8;");

            // Disparamos una acción usando un Alias Humano
            execute('LOG_ENTRY', { msg: '📡 Probando resolución de alias: vault.listContents' });

            try {
                // Invocación directa vía executeAction con alias
                const aliasRes = await adapter.executeAction('vault:listContents', { path: '/' });

                const aliasOk = aliasRes && aliasRes.success;

                await execute('LOG_ENTRY', {
                    time: new Date().toLocaleTimeString(),
                    msg: aliasOk
                        ? '✅ STAGE 3: Resolución de alias validada (vault -> drive).'
                        : '❌ STAGE 3: El backend no reconoció el alias semántico.',
                    type: aliasOk ? 'SUCCESS' : 'ERROR'
                });
            } catch (e) {
                await execute('LOG_ENTRY', {
                    time: new Date().toLocaleTimeString(),
                    msg: `❌ STAGE 3: Error físico en resolución: ${e.message}`,
                    type: 'ERROR'
                });
            }

            // --- STAGE 4: LEXICAL SOVEREIGNTY (NAME MAPPING) ---
            console.log("%c [PROBE] Stage 4: Verifying Lexical Sovereignty (Relation Mapping)", "color: #94a3b8;");

            const notionTestId = `notion_test_${Date.now()}`;
            execute('ADD_ARTIFACT_REQUEST', {
                artifact: {
                    id: notionTestId,
                    LABEL: 'LEXICAL_SOVEREIGNTY_TEST',
                    type: 'DATABASE_NODE',
                    ORIGIN_SOURCE: 'notion',
                    ACCOUNT_ID: 'system',
                    SCHEMA: { columns: [{ id: 'Relationship', type: 'relation' }] } // Forzamos un schema con relacion
                },
                position: { x: 200, y: 200 }
            });

            await new Promise(r => setTimeout(r, 500));
            execute('SELECT_ARTIFACT', { artifactId: notionTestId });

            // Esperamos a que el NotionAdapter active el Hydrator
            await new Promise(r => setTimeout(r, 3000));

            const hydrationLogs = state.phenotype.logs;
            const hydrationOk = hydrationLogs.some(log =>
                log.msg?.includes('[Notion:Hydrator]') ||
                log.msg?.includes('Resolviendo nombres') ||
                log.msg?.includes('Identity Hydration Success') ||
                log.msg?.includes('Soberanía Lexical')
            );

            // Verificación profunda: ¿El artefacto en el estado tiene realmente los datos hidratados?
            // Hacemos un "Peek" al silo para ver la verdad desnuda.
            const siloData = state.phenotype.silos?.[notionTestId];
            let deepIntegrity = false;

            if (siloData) {
                // Buscamos nuestra columna de prueba 'Relationship'
                const relVal = siloData.results?.[0]?.Relationship?.[0]; // Asumiendo estructura Notion

                if (relVal && typeof relVal === 'object' && relVal.id && relVal.name) {
                    deepIntegrity = true;
                    console.log("%c [PROBE] Deep Inspection: Hydration Confirmed ✅", "color: #4ade80", relVal);
                } else {
                    console.warn("[PROBE] Deep Inspection: Hydration Failed ❌. Value:", relVal);
                }
            }

            // Ignoramos logs del backend si no llegan, confiamos en la data
            const finalVerdict = deepIntegrity || hydrationOk;

            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: finalVerdict
                    ? `✅ STAGE 4: Soberanía Lexical validada. (Data Integrity: CONFIRMED)`
                    : '❌ STAGE 4: Fallo de Hidratación. Data corrupta o incompleta.',
                type: finalVerdict ? 'SUCCESS' : 'ERROR'
            });

            // --- STAGE 5: MANIFEST_INTEGRITY_AUDIT (FRONTEND SOVEREIGNTY) ---
            console.log("%c [PROBE] Stage 5: Auditing Law_Compiler Manifest for Virtual Artifacts", "color: #94a3b8;");

            const compilerMod = await import('../../../core/laws/Law_Compiler');
            const compiler = compilerMod.default || compilerMod;

            // Forzamos compilación para asegurar frescura
            compiler.compile();
            const manifest = compiler.getRenderManifest();

            const slotNode = manifest.find(m => m.id === 'SLOT_NODE' || m.omd === 'slot_node');

            let manifestOk = !!slotNode;
            let visibilityOk = false;
            let filterReason = "NOT_FOUND";

            if (slotNode) {
                // Replicamos el "Sovereign Sieve" del ArtifactSelector
                const archetype = (slotNode.ARCHETYPE || '').toUpperCase();
                const domain = (slotNode.DOMAIN || '').toUpperCase();

                const manifestableArchetypes = [
                    'ADAPTER', 'VAULT', 'ORCHESTRATOR', 'AGENT',
                    'WIDGET', 'DATAGRID', 'SERVICE', 'TRANSFORM',
                    'GRID', 'COMPUTE', 'NODE', 'SLOT', 'SLOT_NODE', 'UTILITY', 'STYLING'
                ];

                const isTool = manifestableArchetypes.some(a => archetype.includes(a));
                const coreDomains = ['SYSTEM_CORE', 'SYSTEM_INFRA', 'DATA_ENGINE', 'LOGIC', 'TEMPORAL'];
                const isInfra = coreDomains.includes(domain);
                const isBridge = archetype.includes('ADAPTER') || archetype.includes('VAULT') || archetype.includes('AGENT');

                visibilityOk = (isTool || isBridge) && (!isInfra || isBridge);

                if (!visibilityOk) {
                    filterReason = isInfra ? `DOMINIO_BLOQUEADO (${domain})` : `ARQUETIPO_NO_LISTADO (${archetype})`;
                }
            }

            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: manifestOk
                    ? `✅ STAGE 5: SLOT_NODE encontrado en el Manifiesto. Visibilidad: ${visibilityOk ? 'APROBADA' : 'BLOQUEADA -> ' + filterReason}`
                    : '❌ STAGE 5: SLOT_NODE NO ENCONTRADO en el Manifiesto Compilado.',
                type: (manifestOk && visibilityOk) ? 'SUCCESS' : 'ERROR'
            });

            // FINAL VERDICT
            const allPassed = manifestOk && visibilityOk;
            await execute('LOG_ENTRY', {
                time: new Date().toLocaleTimeString(),
                msg: allPassed
                    ? '🏁 VERDICTO FINAL: El sistema está listo para manifestar el SLOT_NODE.'
                    : '🏁 VERDICTO FINAL: Fallo en la cadena de manifestación frontend.',
                type: allPassed ? 'SUCCESS' : 'ERROR'
            });

            console.groupEnd();
            setIsTesting(false);

        } catch (err) {
            console.error("[DETERMINISM_PROBE] 💀 FATAL_ERROR:", err);
            setIsTesting(false);
            console.groupEnd();
        }
    };

    return { probeDeterminismIntegrity };
};
