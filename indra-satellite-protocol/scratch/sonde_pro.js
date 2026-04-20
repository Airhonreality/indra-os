/**
 * INDRA SONDE PRO (v1.0)
 * Diagnóstico End-to-End de Ignición Industrial.
 */

async function runSonde() {
    const CORE_URL = "https://script.google.com/macros/s/AKfycbzNYqBXqYereE57B3bVvJWPtd40ysYLIhHSe3G1v-5RmFGhdLS5Xy-nzkV7pfhZkx6gi/exec";
    const TOKEN = "c6c4625b-2041-450f-904c-7c0936e768e0"; // Token del usuario
    const WORKSPACE_ID = "1SloB... (Reemplazar con ID real)"; 

    console.log("🚀 Iniciando Sonde Pro: Prueba de Ignición...");

    const mockDNA = {
        id: "TEST_IGNITION",
        class: "DATA_SCHEMA", // <-- El campo que sospecho que falta
        handle: { label: "Test de Trazabilidad" },
        payload: {
            fields: [
                { id: "id", label: "ID", type: "number" },
                { id: "nombre", label: "Nombre", type: "text" }
            ]
        }
    };

    const payload = {
        protocol: "INDUSTRIAL_IGNITE",
        data: {
            blueprint: mockDNA,
            target_provider: "drive",
            workspace_id: WORKSPACE_ID
        },
        token: TOKEN
    };

    try {
        const response = await fetch(CORE_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log("📥 RESPUESTA DEL CORE:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ FALLO DE RED:", e);
    }
}

runSonde();
