> **Versión:** 5.4 (Sello de Invarianza Total - Elevación HCI)

---

## 🏛️ I. LOS MANDAMIENTOS DEL ORBITAL

1.  **Soberanía del Neutrón:** Un Orbital NUNCA invocará `fetch` directamente. Toda intención debe ser canalizada por el Sacerdote Neutrón (`callCore`).
2.  **Ritual de Dos Tiempos:** El arranque es sagrado. Primero el Contexto Físico (`System_Context.sys.json`), luego el Manifiesto de Capabilidades (`Core_Manifest.sys.json`).
3.  **Agnosticismo de Datos:** El Core entrega "Almas de Datos" (objetos ya parseados). El Orbital no ensucia sus manos con `JSON.parse` de respuestas estándar.

---

## 🏛️ II. EL RITUAL DE IGNICIÓN (BOOTSTRAP)

Para que el arranque sea seguro en el entorno de producción, el Orbital utiliza las **Verdades Hardcodeadas** de la implementación específica:

```javascript
// CONFIGURACIÓN DE IMPLEMENTACIÓN REAL - INDRA OS
const INDRA_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec',
    CANONIC_FILES_FOLDER_ID: 'YOUR_FOLDER_ID_HERE'
};
```

### La Secuencia Inmutable
1.  **Tiempo 1 (Físico):** El Orbital invoca al Neutrón para traer el `System_Context.sys.json`. Esto mapea las bóvedas del usuario.
2.  **Tiempo 2 (Lógico):** Con el mapa físico cargado, el Orbital pide el `Core_Manifest.sys.json` para saber qué nodos puede renderizar en el Reactor.
3.  **Tiempo 3 (Materia):** Hidratación inicial del Cosmos.

> [!IMPORTANT]
> **Permiso de Prototipado Indispensable (V5.4):** 
> Dada la asincronía en el desarrollo del Core, se autoriza al Satélite a utilizar el ejecutor `flowRegistry` (método `listFlows`) como canal de hidratación inicial mientras el `MATERIA_ADAPTER` (Borehole Architecture) sea consolidado. Esta desviación es mandataria para mantener la señal del Satélite activa.

---

## 🏛️ III. EL NEUTRÓN CANÓNICO (`conection_point.js`)

Este código implementa el protocolo de comunicación seguro para el entorno INDRA:

```javascript
/**
 * ORBITAL NEUTRON v2.1 - Implementación para Producción
 * Canaliza la intención del Orbital al Core con fe absoluta.
 */
async function callCore(executor, method, payload = {}) {
    console.log(`Neutrón -> Core: ${executor}.${method}`);
    const requestBody = { executor, method, payload };
    return await _fetchINDRA(requestBody);
}

async function _fetchINDRA(bodyObject) {
    try {
        const response = await fetch(INDRA_CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(bodyObject),
            redirect: 'follow'
        });
        
        if (!response.ok) {
             throw new Error(`Error HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Validación de la firma del Core
        if (data && data.success === false) {
            const msg = data.error?.message || "Error desconocido en el Core.";
            // [V5.1] Disparar Feedback de Veto (Shake + Rojo)
            throw new Error(`[CORE_REJECT] ${msg}`);
        }

        // [V5.1] Consolidación de Realidad: El dato se vuelve 'Master' en el UI
        return data.hasOwnProperty('result') ? data.result : data;
    } catch (error) {
        console.error('Fallo Crítico de Comunicación:', error);
        throw new Error(`Pacto de Confianza Roto: ${error.message}`);
    }
}
```

---

## 🏛️ IV. EL MANIFIESTO DEL CORE (`Core_Manifest.sys.json`)

Este archivo es la **Constitución Funcional**. El Satélite lo procesa de forma agnóstica:
1.  **Auto-Generación de Nodos:** Por cada entrada en el JSON, el Graph Editor crea un nodo visual.
2.  **Mapeo de Puertos:** Los `methods` se convierten en puntos de entrada/salida dinámicos del nodo.
3.  **Inyección de Documentación:** El Satélite utiliza el campo `hoverDoc` (si existe) para alimentar el **Aether Ribbon**.

> **Nota de Auditoría:** Si un desarrollador añade un nuevo `Adapter` en GAS, solo necesita actualizar este JSON. El Satélite "descubrirá" la nueva herramienta en el próximo reinicio (BIOS Step 2), eliminando la deuda técnica de despliegue en el Frontend.

---
*Fin del Protocolo - Sellado por la Ley del Neutrón.*
