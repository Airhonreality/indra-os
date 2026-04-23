# INDRA SYSTEM: ANALYSIS OF THE CONTRACT GAP (v5.0 → v7.0)
Responsabilidad: Documentar el cisma entre el Satélite (v5.0 compatible) y el Core (v7.0 Membrane).

## 1. IDENTIDAD Y SEGURIDAD (Identity Breach)
- **Token Key mismatch**: El Satélite enviaba `token` en el payload, mientras que el Core esperaba `satellite_token` en el envelope del Gateway.
  - *Estado*: Sincronizado (v.12.1).
- **Persistence Gap**: `IdentityNode` guardaba la sesión en `INDRA_LINK_{wid}`, mientras que `IndraBridge` la buscaba en `INDRA_SATELLITE_LINK`.
  - *Estado*: Sincronizado (v.12.1).

## 2. DESCUBRIMIENTO DE TERRITORIO (Discovery Breach)
- **Metodología de Escaneo**: El Satélite intentaba usar `ATOM_READ` sobre el ID virtual "workspaces". El Core v7.0 requiere `SYSTEM_SATELLITE_DISCOVER` para disparar el escaneo físico de Drive.
  - *Estado*: Sincronizado (v.12.1).

## 3. MOTOR DE FLUJOS (Logic Breach)
- **Axioma de Falla Ruidosa**: El `WorkflowEngine` ignoraba errores de estaciones `PROTOCOL`. El Core devolvía `metadata.status: 'ERROR'`, pero el motor continuaba la secuencia y emitía `FLOW_END: SUCCESS`.
  - *Hallazgo*: El motor operaba en un universo de "Fantasmas Exitosos".
  - *Estado*: REPARADO (v.12.1). Ahora aborta ante cualquier `status: ERROR`.

## 4. MATERIALIZACIÓN (Cristallization Breach)
- **Payload Contract**: La respuesta de `INDUSTRIAL_IGNITE` devuelve el universo en `metadata.universe`, no en `items[0].payload`. El Satélite buscaba el `silo_id` en el lugar equivocado.
  - *Estado*: Sincronizado (v.12.1).

## 5. UI Y SINCERIDAD (Visual Breach)
- **Ghost IDs**: El HUD fallaba al inicio intentando escribir en elementos de DOM inexistentes (`sat-name`, `core-url`).
  - *Estado*: REPARADO (v.12.1). Se restauraron los terminales de datos y se protegieron las referencias contra `null`.

---
*Este documento debe ser actualizado ante cada nueva resonancia fallida.*
