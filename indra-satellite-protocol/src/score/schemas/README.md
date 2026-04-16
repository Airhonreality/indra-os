# 🧬 LA ESPINA DORSAL : ESQUEMAS DE NEGOCIO

Este es el punto de origen de toda la vida en el Satélite. Según el **Axioma de la Espina Dorsal**, ninguna interfaz o automatización puede existir si no tiene un esquema definido en esta carpeta.

---

## 🚦 REGLAS DE IGNICIÓN PARA IAs Y HUMANOS

1.  **PRIMERO EL ESQUEMA**: Si vas a añadir una funcionalidad (ej: Pedidos, Alumnos, Tareas), lo primero es crear un archivo `.json` en esta carpeta.
2.  **NOMENCLATURA CANÓNICA**: El nombre del archivo debe ser el `alias` del esquema (ej: `clientes.json`).
3.  **ESTRUCTURA OBLIGATORIA (v3.0)**:
    Todo archivo aquí debe cumplir con el contrato definido en `_INDRA_PROTOCOL_/SYSTEM_CORE_DATA_CONTRACTS.md`.
    *   Debe tener un `handle` con `alias` y `label`.
    *   Debe tener un `class: "DATA_SCHEMA"`.
    *   Debe tener un `payload.fields` (Array).

## 🛰️ DIÁLOGO CON EL CORE
Cuando el satélite arranca, este directorio es escaneado por el **IndraBridge**. 
*   Los esquemas aquí residentes son enviados al **API Gateway** mediante el protocolo `SYSTEM_RESONANCE_CRYSTALLIZE`.
*   El Core valida estos esquemas y genera el reporte de integridad.

## 🛑 PROHIBICIÓN DE ALUCINACIÓN
No inyectes campos directamente en los componentes de la UI. La UI debe ser un **reflejo reactivo** de lo que esté escrito en estos JSONs. Si el campo no está aquí, no existe en el ecosistema.

---
**Recuerda**: El Satélite es el espejo; esta carpeta es la realidad.
