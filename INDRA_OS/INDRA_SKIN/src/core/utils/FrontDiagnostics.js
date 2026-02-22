/**
 * FrontDiagnostics.js
 * DHARMA: Herramientas de Inspección Quirúrgica del Fenotipo.
 * AXIOMA: "Si no lo puedes medir, no existe; si es invisible, es un ghost."
 */

export const runFullPhenotypeAudit = (state) => {
    console.group("%c 🔍 AXION DIAGNOSTICS: Deep Phenotype Audit", "color: #3b82f6; font-weight: bold; font-size: 12px;");

    const { artifacts = {}, relationships = [], cosmosIdentity } = state.phenotype;
    const artifactsArray = Object.values(artifacts);

    console.log(`[Status] Cosmos: ${cosmosIdentity?.LABEL || 'none'} (${cosmosIdentity?.id || 'null'})`);
    console.log(`[Stats] Total Artifacts: ${artifactsArray.length}`);
    console.log(`[Stats] Total Relationships: ${relationships.length}`);

    // 1. Análisis de Fantasmas (Ghosts)
    const ghosts = artifactsArray.filter(a => a._isGhost || a.label?.includes('GHOST') || a.LABEL?.includes('GHOST') || a.label?.includes('CHAOS') || a.LABEL?.includes('CHAOS'));
    if (ghosts.length > 0) {
        console.warn(`[Audit] 👻 Found ${ghosts.length} phantom nodes!`);
        console.table(ghosts.map(g => ({
            id: g.id,
            label: g.LABEL || g.label,
            archetype: g.ARCHETYPE,
            origin: g.origin || 'null',
            isVirtual: g.isVirtual ? 'YES' : 'NO'
        })));
    } else {
        console.log("%c [Audit] No phantom nodes detected in the artifact map.", "color: #10b981;");
    }

    // 2. Análisis de Origen (Provenance)
    const provenance = artifactsArray.reduce((acc, a) => {
        const o = a.origin || 'UNKNOWN';
        acc[o] = (acc[o] || 0) + 1;
        return acc;
    }, {});
    console.log("[Audit] Provenance Distribution:", provenance);

    // 3. Análisis de Relaciones Huérfanas
    const orphanRels = relationships.filter(rel => !artifacts[rel.source] || !artifacts[rel.target]);
    if (orphanRels.length > 0) {
        console.error(`[Audit] 💀 Found ${orphanRels.length} orphan relationships!`);
        console.table(orphanRels.map(r => ({
            id: r.id,
            source: r.source,
            sourceExists: !!artifacts[r.source],
            target: r.target,
            targetExists: !!artifacts[r.target]
        })));
    } else {
        console.log("%c [Audit] All relationships are semantically anchored.", "color: #10b981;");
    }

    console.groupEnd();
};

export const clearIronMemory = async () => {
    console.warn("☢️ [Diagnostics] Clearing Iron Memory (AxiomaticDB)...");
    try {
        const AxiomaticDB = (await import('../1_Axiomatic_Store/Infrastructure/AxiomaticDB.js')).default;
        await AxiomaticDB.purge();
        console.log("✅ Iron Memory purged.");
        window.location.reload();
    } catch (e) {
        console.error("❌ Failed to purge Iron Memory:", e);
    }
};

export const purgeGhostsFromState = (state, execute) => {
    const { artifacts = {} } = state.phenotype;
    const ghosts = Object.values(artifacts).filter(a => a._isGhost || a.label?.includes('GHOST') || a.LABEL?.includes('GHOST') || a.id?.includes('headless'));

    if (ghosts.length === 0) {
        console.log("✨ No ghosts to purge.");
        return;
    }

    console.log(`🧹 Purging ${ghosts.length} ghosts...`);
    ghosts.forEach(g => {
        execute('REMOVE_ARTIFACT', { id: g.id });
    });
};
