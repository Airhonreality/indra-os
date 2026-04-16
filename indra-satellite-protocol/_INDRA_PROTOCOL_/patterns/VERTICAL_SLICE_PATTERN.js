/**
 * ARTEFACTO: PATRÓN DE REBANADA VERTICAL (VERTICAL SLICE)
 * CAPA: Proyección de Negocio (Soberanía)
 * DESCRIPCIÓN: Plano maestro para conectar un esquema con la UI mediante el Bridge.
 */

// 1. IMPORTACIÓN DEL EMBAJADOR
import IndraBridge from '../../_INDRA_PROTOCOL_/core/IndraBridge.js';
const bridge = new IndraBridge();

/**
 * 2. FUNCIÓN DE PROYECCIÓN (RENDER)
 * Misión: Recibir la materia del Bridge y dibujarla en el DOM.
 * REGLA: No debe contener lógica de "fetching", solo de dibujo.
 */
function projectSlice(items) {
    const container = document.getElementById('slice-container');
    container.innerHTML = items.map(atom => `
        <div class="indra-atom-card" data-id="${atom.id}">
            <h3>${atom.handle.label}</h3>
            <p>${atom.payload.descripcion || 'Sin descripción'}</p>
        </div>
    `).join('');
}

/**
 * 3. ACTO DE RESONANCIA
 * Misión: Pedir los datos al Core usando el ALIAS del esquema.
 */
async function igniteModule() {
    try {
        const response = await bridge.execute({
            protocol: 'ATOM_READ',
            context_id: 'mi_alias_del_esquema' // Debe existir en src/score/schemas/
        });
        
        projectSlice(response.items);
    } catch (error) {
        console.error("[Resonancia Fallida]", error);
    }
}

// 4. IGNICIÓN AL CARGAR
window.addEventListener('indra-ready', igniteModule);
