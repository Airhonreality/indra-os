# Indra Satellite Protocol: Multitenancy & Jurisdiction (v2.5)

## 🏛️ El Axioma de la Resonancia Única
En Indra, la seguridad multi-usuario no se gestiona mediante "logins" complejos dentro del satélite, sino a través de **Enlaces de Resonancia (Capabilities Links)**.

### 1. ¿Cómo funciona la multi-tenencia?
Un mismo código de satélite (ej: `erp-panaderia`) puede atender a N clientes diferentes. 
*   **Acceso**: El Core genera un Token de Resonancia único para cada combinación de `Usuario + Workspace`.
*   **Aislamiento**: Cuando el Satélite recibe este token vía `INDRA_RESONANCE_GRANT`, el Bridge bloquea la sesión a ese **ID de Contexto** único.

## 🗺️ El Axioma de la Geografía de Datos (Vórtices)
Para evitar la entropía en Google Drive, cada satélite debe reclamar un **Vórtice Soberano** (Carpeta Raíz) durante su ignición.

### 1. El Protocolo de Anclaje
Cuando un satélite ejecuta el flujo `GÉNESIS_EXPRESS`, el proceso sigue este flujo:
1.  **Declaración**: El usuario define el `target_folder` en el `IndraParamModal`.
2.  **Resolución**: El Core (API Gateway) busca la carpeta en el root del Drive.
3.  **Anclaje**: Si no existe, la crea. El ID resultante se devuelve al satélite.
4.  **Herencia**: Todos los artefactos materiales (Sheets, Docs) creados por este satélite usarán ese ID como `parentId` obligatorio.

### 2. Ubicación de la Verdad
*   **Meta-Data**: El ID de la carpeta raíz se almacena en el `indra_contract.json` bajo la propiedad `storage_root`.
*   **Seguridad**: El Satélite solo tiene visibilidad de lo que ocurre dentro de su propio Vórtice, manteniendo la soberanía de datos entre diferentes proyectos o clientes.

## 🛡️ Ley de Jurisdicción (Seguridad en el Gateway)

1.  **Paquetes Estériles**: La Shell Core (Madre) filtra el contrato antes de enviarlo al Satélite. 
2.  **Exclusión de Infraestructura**: Los esquemas de tipo `CONFIG_SCHEMA` o `SYSTEM_SCHEMA` (Notion, AI Config, etc.) son eliminados en la fuente.
3.  **Jurisdicción de Negocio**: El Satélite solo recibe esquemas de tipo `DATA_SCHEMA`. Lo que el satélite no ve, no puede ser vulnerado.

## 🔑 El Ciclo de Vida del Token Multi-Tenancy

Para evitar la **Basura Espacial de Identidad**, el satélite debe ser responsable de su desvinculación:

1.  **Ignición**: El `IdentityNode` recibe el token tras el Handshake.
2.  **Persistencia Aislada**: El Bridge guarda los tokens bajo una clave única por Workspace (`INDRA_LINK_[WID]`). Esto permite que un mismo navegador sea el satélite de múltiples organizaciones sin mezclar la soberanía.
3.  **Purga (Disengage)**: Al cerrar sesión, el satélite invoca `SYSTEM_KEYCHAIN_REVOKE`. 
    *   **Axioma de Cierre**: "La soberanía termina donde la memoria se borra. Desvincularse sin avisar al núcleo corrompe la malla."

## 🚀 Implementación Eficiente (Ignición)

Para instalar un sistema multi-usuario en un nuevo satélite indra-ready:

```javascript
import IndraBridge from './core/IndraBridge.js';
const bridge = new IndraBridge();

// Paso A: Escuchar a la Madre (Sandbox Iframe)
bridge.init(); // El init ahora gestiona el portal sandboxed

// Paso B: Actuar solo tras el Handshake
window.addEventListener("indra-ready", (event) => {
    const { workspace_id, label } = event.detail;
    console.log(`🛰️ Satélite resonando con: ${label} [${workspace_id}]`);
});
```

## ☯️ La Sinceridad del Handshake (Cristalización)

Si el Satélite detecta divergencia, ejecuta `crystallizeResonance()` (anteriormente `syncDNA`):
*   **Si es Soberano**: El Core materializa la infraestructura (filas físicas en Sheets) según el ADN del satélite.
*   **Determinismo**: En multi-usuario, el Core manda sobre la estructura para garantizar que todos los nodos hablen el mismo idioma.
