# ADR_028 — BLUEPRINT_LIBRARY_MARKETCELL: Estrategia de Distribución de Activos

> **Versión:** 0.1 (Experimental)
> **Estado:** PROPUESTO / PENDIENTE
> **Relacionado con:** ADR_001 (Data Contracts), ADR_020 (Induction Engine)

---

## 1. CONTEXTO

Con la expansión de Indra OS hacia ecosistemas multi-usuario (como NOMON), surge la necesidad de compartir configuraciones complejas (Blueprints) que incluyen Schemas, Workflows y componentes de UI pre-diseñados. Actualmente, estas configuraciones son "Soberanas" (viven solo en el Core del creador) y no existe un método nativo para empaquetarlas y distribuirlas a otros usuarios.

## 2. EL PROBLEMA TÉCNICO

Distribuir una "solución completa" en Indra implica mover:
1.  **Estructura de Datos:** Definiciones JSON de Schemas.
2.  **Lógica Operativa:** Definiciones JSON de Workflows.
3.  **Infraestructura:** Creación de las Google Sheets vinculadas a esos Schemas.
4.  **UI:** Mapeo de componentes React (`class` -> `Component`).

Hacer esto de forma manual es propenso a errores y requiere conocimientos técnicos profundos del sistema de IDs de Google Drive.

---

## 3. VIAS DE IMPLEMENTACIÓN EXPLORADAS

### Vía A: Biblioteca de Activos en Drive (Manual/Social)
Consiste en crear una carpeta compartida en Google Drive donde los usuarios suben los archivos `.json` de sus átomos.
*   **Pros:** Cero desarrollo de código. Usa la infraestructura nativa de Google.
*   **Contras:** Proceso de instalación manual (copiar/pegar IDs). No resuelve la creación automática de Sheets ni la vinculación de Workflows.

### Vía B: Marketcell Centralizado en GitHub (Automático)
Consiste en un repositorio (ej. `indra-blueprints`) con un `registry.json`. El Core de Indra "descarga" el Blueprint y lo autoinstala.
*   **Pros:** Instalación en un clic. Escalable a miles de usuarios. Permite control de versiones.
*   **Contras:** Requiere desarrollar un protocolo de "Cirugía a Corazón Abierto" en el Kernel (`BLUEPRINT_INSTALL`) para crear infraestructura programáticamente via Apps Script.

### Vía C: El Modelo "Silo Local" (Híbrido)
Indra permite exportar un Workspace completo como un archivo de "Backup/Blueprint" que otro usuario puede importar.
*   **Pros:** Mantiene la soberanía. No depende de una nube central.
*   **Contras:** Difícil de descubrir para nuevos usuarios.

---

## 4. DECISIÓN PROPUESTA

Se decide **congelar temporalmente** la implementación del motor automático (`Vía B`) para evitar la complejidad de la manipulación del Kernel en esta fase de estabilidad.

**Acción Inmediata (Fase Alpha):**
1.  Adoptar la **Vía A** (Biblioteca en Drive/Local) para intercambio manual de archivos entre aliados.
2.  Documentar los contratos de datos en la carpeta `/Documentacion/Blueprints de Indra/` como guías de referencia ("Blueprints de Papel").
3.  El usuario/aliado deberá recrear la estructura manualmente siguiendo el blueprint documentado.

---

## 5. REQUISITOS PARA LA EVOLUCIÓN (Hito 2)

Para poder pasar a la **Vía B (Marketcell)**, el Kernel de Indra debe implementar primero:
1.  **`SYSTEM_BLUEPRINT_INGEST`**: Un parser que valide un JSON de blueprint antes de tocar nada.
2.  **`SYSTEM_INFRA_AUTO_PROVISION`**: Capacidad de crear subcarpetas y Sheets vacías basadas en un Schema previo.
3.  **`ID_REMAPPING_ENGINE`**: Lógica para sustituir IDs temporales del blueprint por los IDs reales generados durante la instalación en el Drive del nuevo usuario.

---

## 6. CONSECUENCIAS

*   **Positivas:** Estabilidad total del sistema. Fomento del aprendizaje (el usuario aprende a crear sus schemas leyendo el blueprint).
*   **Negativas:** Mayor fricción para el usuario final "no-técnico" que solo quiere una app funcionando.
*   **Riesgo:** Si el blueprint es muy complejo, el re-mapeo manual de IDs de Sheets en los Workflows puede ser frustrante.

---
*Documento registrado para discusión futura sobre la escalabilidad del ecosistema.*
