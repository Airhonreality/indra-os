# ADR_018 — PULSE NETWORK: Sistema de Encolado y Automatización Soberana

> **Versión:** 1.0 (Axiomática)  
> **Estado:** PROPUESTO  
> **Contexto:** [ADR_012 (MCEP)](./ADR_012_MCEP_PROTOCOL.md), [ADR_017 (Cognitive Processes)](./ADR_017_COGNITIVE_BUSINESS_PROCESSES.md)  
> **Dharma:** Ejecución desatendida sin sacrificar la latencia de respuesta.

---

## 1. CONTEXTO Y FILOSOFÍA

Hasta ahora, INDRA ha operado principalmente bajo el modelo de **"Petición-Respuesta"**. Sin embargo, la automatización industrial requiere que el sistema pueda recibir señales externas (Webhooks) o temporales (Crons) y ejecutarlas en segundo plano (Background Jobs).

Dado que Google Apps Script (GAS) tiene un límite de ejecución de 6 minutos y no permite hilos asíncronos reales, el sistema debe "hackearse" a sí mismo para comportarse como un servidor de alta disponibilidad.

### Axiomas de la Red de Pulsos:
1.  **Axioma de Liberación Inmediata:** Toda señal externa debe ser reconocida y respondida en <200ms, delegando la carga al Ledger.
2.  **Axioma de Soberanía Tabular:** La persistencia de la cola debe ser legible y auditable por el usuario, utilizando el motor de Google Sheets como base de datos de alta concurrencia.
3.  **Axioma de Auto-Ignición (The Boomerang):** El sistema es su propio disparador. Para procesos asíncronos, el Core se invoca a sí mismo para iniciar un nuevo hilo de ejecución limpio.

---

## 2. ARQUITECTURA TÉCNICA: THE PULSE LEDGER

Se abandona la idea de colas en JSON por su alta entropía y riesgos de corrupción. Se establece el **Pulse Ledger** como el corazón de la Red.

### 2.1 El Almacenamiento (Physical Layer)
- **Silo:** Google Sheet oculta en `.core_system/JobQueue`.
- **Operación:** Uso estricto de `appendRow()` para registro e `updateCell()` para cambio de estado.
- **Estados del Pulso:** `PENDING`, `IGNITED`, `EXECUTING`, `COMPLETED`, `FAILED`.

### 2.2 El Mecanismo de Ignición (Internal Boomerang)
Para webhooks que disparan procesos pesados (ej: Inteligencia Cognitiva):
1.  **Gateway (doPost):** Recibe el Webhook → Valida Contrato → Escribe en Ledger (`PENDING`).
2.  **Trigger:** El Gateway lanza un `UrlFetchApp.fetch(SELF_URL)` con el header `X-Indra-Ignite: true`.
3.  **Response:** El Gateway responde `202 Accepted` al emisor original.
4.  **Process:** El Boomerang (el fetch interno) llega al Gateway, éste detecta el flag de ignición, lee la tarea más antigua del Ledger y la entrega al `workflow_executor`.

---

## 3. INTEGRACIÓN CON UI: EL CASCARÓN HUECO

Siguiendo el principio de que el Front-end es solo una proyección, la interfaz no "gestiona" la cola, sino que entra en **Resonancia** con ella.

### 3.1 El Monitor de Pulsos (Columna III)
En la columna de **Manifestación**, aparecerá un nuevo módulo de sistema:
- **Nombre:** `PulseMonitor`.
- **Funcionamiento:** Realiza un `SYSTEM_QUEUE_READ` (Protocolo nuevo).
- **Proyección:** Cada fila del Ledger se visualiza como un `AtomGlif` dinámico.
    - **Brillo Violeta:** Pulso en ejecución (`EXECUTING`).
    - **Flash Rojo:** Pulso fallido (`FAILED`) con botón de `RE-IGNITE`.
    - **Check Verde:** Pulso terminado.

### 3.2 El Diseñador de Workflows (Nivel 3)
El `WorkflowDesigner` deja de ser un sandbox simulado:
- **Recruitment:** Se habilita la sección `TRIGGER_DNA`.
- **Configuración:**
    - **HTTP_WEBHOOK:** Genera una URL única que el sistema reconoce vía `api_gateway.js`.
    - **TIME_TICK:** Permite definir intervalos (Ej: "Cada hora"). El Core instala el trigger de GAS automáticamente al guardar el Átomo.

---

## 4. REGLAS DE ORO (INDRA CONSTITUTION)

1.  **Nada se pierde:** Si un Boomerang falla (Timeout), el Ledger conserva el registro. El trigger de mantenimiento (`RESURRECTION_PULSE`) lo encontrará en la siguiente ronda.
2.  **Inmunidad del Gateway:** El Gateway nunca debe esperar a que un proceso termine. Su única misión es **Legitimar** y **Encolar**.
3.  **Sinceridad del Log:** Cada ejecución en el Ledger debe guardar el `trace_id` para que el usuario pueda ver exactamente por qué falló su IA a las 3:00 AM.

---

## 5. CONCLUSIÓN AXIOMÁTICA

Este diseño convierte a INDRA de una herramienta interactiva a un **Sistema Operativo Agéntico Autónomo**. El usuario "siembra" intenciones en el Designer, y la Red de Pulsos se encarga de manifestarlas en el Ledger sin intervención humana constante.

---
**Firmado:** Antigravity AI Architect.  
**Fecha:** 2026-03-16
