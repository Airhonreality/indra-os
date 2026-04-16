# Guía de Arquitectura Híbrida e Indra Tools (v2.5)

## 🏛️ Introducción
A partir de la versión 2.5, el **Indra Satellite Protocol (ISP)** evoluciona hacia una arquitectura híbrida donde el satélite mantiene su soberanía ligera (HTML/JS) pero puede invocar capacidades avanzadas de la Shell Madre (React) mediante el portal de resonancia.

---

## 🛰️ Resolución de la Dicotomía Visual (Handshake)
Para garantizar la **Sinceridad del Sistema**, el satélite identifica el origen de cada artefacto (esquema o flujo) mediante iconos de jurisdicción:

*   **🛰️ Satélite (Local)**: Artefactos que viven físicamente en tu repositorio local (`src/score/`). Tú tienes el control total del archivo.
*   **☁️ Nube (Core)**: Artefactos que viven en la base de datos de Indra OS. Son compartidos en el workspace.
*   **🔗 Enlace (Resonancia)**: Cuando el archivo local y el de la nube están en perfecto espejo.

---

## 🔐 Aduana de Soberanía (ADR-041: Keychain Engine)
La arquitectura v2.5 introduce la **Aduana de Scopes**. Ya no es necesario que un satélite tenga acceso total para funcionar. 

### El Handshake de Ámbito:
1.  **Emisión**: La Shell Madre (React) emite un **Token de Sinceridad** con un `scope_id` vinculado a un Workspace.
2.  **Identificación**: El satélite almacena este token en su pacto manual.
3.  **Filtrado**: El **API Gateway** intercepta cada petición. Si el `context_id` de la petición no coincide con el `scope_id` del token (y el token no es MASTER), el Core rechaza la operación con un **Error 403 (Scope Violation)**.

*Esto permite crear satélites especializados (ej: App de Inventario) que no pueden ver datos sensibles de otros Workspaces (ej: Nóminas).*

---

## 🛠️ Indra Tools: El Arsenal Universal
El satélite inyecta automáticamente una pestaña de herramientas de infraestructura para operar el Core al 100% de su capacidad.

### Herramientas Disponibles:
1.  **GÉNESIS EXPRESS**: Materializa infraestructura (Google Sheets, Notion) desde un esquema local.
2.  **SANADOR DE SINCERIDAD**: Repara divergencias entre el satélite y el core (Headers de archivos, IDs).
3.  **DUMPER DE SOBERANÍA**: Exporta datos de un silo remoto a un archivo JSON local (Backup).
4.  **INSPECTOR DE ÁTOMOS**: Abre un portal React para inspeccionar el ADN crudo de cualquier dato.
5.  **SINCRONIZADOR DE RELOJES**: Actualiza términos, léxicos y traducciones desde el Core.
6.  **VALIDADOR DE CONTRATOS**: Audita la integridad del satélite contra las reglas del `indra_contract.json`.

---

## 🏎️ Workflow Engine v2.5 (Deep Resolution)
El motor de flujos ahora soporta **Resolución Profunda**. Esto permite usar variables dinámicas en cualquier nivel de profundidad del JSON:

```json
{
  "protocol": "SYSTEM_GENESIS_SILO",
  "config": {
    "data": {
      "nested_param": "{trigger.target_id}"
    }
  }
}
```
*El motor recorrerá recursivamente el objeto `config` para inyectar los valores del gatillo.*

---

## 🌀 Protocolo UI_INVOKE (Portal al Core)
El satélite puede solicitar a la Shell Madre que renderice un módulo nativo de React sobre su propia interfaz.

**Ejemplo de llamada desde JS:**
```javascript
bridge.execute({
  protocol: 'UI_INVOKE',
  module: 'DATA_SCHEMA', // Abre el diseñador de esquemas nativo de Indra
  payload: { id: 'mi_esquema_local' }
});
```
*El satélite queda en pausa visual mientras el usuario opera en el portal de alta tecnología del Core.*
