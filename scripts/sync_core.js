/**
 * =============================================================================
 * ARTEFACTO: scripts/sync_core.js
 * RESPONSABILIDAD: Sincronización Soberana del Núcleo (Core DNA).
 * JURISDICCIÓN: Satélite Semilla.
 * 
 * Este script permite actualizar el código del Núcleo (sistema_core/core)
 * sin afectar la lógica de negocio del Satélite (src/).
 * =============================================================================
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const NUCLEUS_PATH = 'system_core/core';
const REMOTE_TARGET = 'origin/main';

console.log("\n🌞 [INDRA OS] Iniciando Protocolo de Sincronización de Núcleo...");

/**
 * Verifica si el directorio del núcleo existe para evitar corrupciones.
 */
function verifyTopology() {
    if (!fs.existsSync(NUCLEUS_PATH)) {
        console.warn(`⚠️  [Aviso] No se detectó el directorio en ${NUCLEUS_PATH}. ¿Es una instalación limpia?`);
    }
}

/**
 * Ejecuta la sincronización mediante el comando sagrado de Git.
 * Solo trae los archivos del núcleo de la rama remota.
 */
function syncNucleus() {
    try {
        console.log(`📡 Solicitando ADN del Núcleo desde ${REMOTE_TARGET}...`);
        
        // Comando Axiomático: Solo actualiza el subdirectorio específico del Núcleo
        const command = `git checkout ${REMOTE_TARGET} -- ${NUCLEUS_PATH}`;
        execSync(command, { stdio: 'inherit' });

        console.log(`\n✅ [Éxito] El Núcleo en ${NUCLEUS_PATH} ha sido sincronizado.`);
        console.log(`🚀 El Satélite en 'src/' se mantiene intacto y soberano.`);
        
    } catch (error) {
        console.error(`\n❌ [Fallo] La sincronización ha colapsado: ${error.message}`);
        console.log("Asegúrate de haber hecho un 'git fetch' antes de sincronizar.");
    }
}

// EJECUCIÓN DEL RITUAL
verifyTopology();
syncNucleus();
