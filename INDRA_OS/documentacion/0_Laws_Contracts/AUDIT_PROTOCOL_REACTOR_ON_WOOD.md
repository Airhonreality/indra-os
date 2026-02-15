# PROCESO DE AUDITORÍA AXIOMÁTICA: ESTÁNDAR "REACTOR SOBRE MADERA"

Este protocolo define los criterios de aceptación y los puntos de control críticos para la certificación del modelo "Fat Client" sobre la infraestructura de Google Apps Script (Madera).

---

## 🟢 FASE 1: PROTOCOLO DE TRANSPORTE (Backend: CosmosEngine.gs)

**Objetivo:** Garantizar la integridad de los datos en tránsito y optimizar el payload para sortear las limitaciones de cuota de GAS.

### 📋 Checklist de Auditoría (Backend Transport)

#### 1. Envoltorio Estructural (Envelope Structure)
- [ ] **Verificación de Salida (`mountCosmos`):**
    - El método `mountCosmos` **DEBE** retornar un objeto con la estructura `{ revision_hash, payload, timestamp, encoding }`.
    - **PROHIBIDO:** Retornar el `payload` crudo directamente en la raíz de la respuesta.
    - **CRITERIO:** El `revision_hash` debe ser calculado (ej. MD5 o SHA-1 simple) sobre el contenido del `payload`.
- [ ] **Verificación de Entrada (`saveCosmos`):**
    - El método `saveCosmos` **DEBE** aceptar un argumento `expected_revision_hash`.
    - **LÓGICA DE CONFLICTO:** Si `expected_revision_hash` no coincide con el hash actual del archivo en Drive (o su metadato), la operación **DEBE FALLAR** con `CONFLICT_ERROR` (409).
    - **EXCEPCIÓN:** Si `force: true` está presente, se omite la verificación.

#### 2. Compresión y Codificación (GZIP Simulado / Base64)
- [ ] **Codificación de Salida:**
    - Si el tamaño del JSON supera los 50KB, el Backend **DEBE** comprimir (o al menos codificar en Base64 para evitar problemas de encoding de caracteres especiales) y marcar `encoding: 'BASE64'` o `encoding: 'GZIP'`.
    - **CRITERIO:** El JSON generado **NO DEBE** tener espacios en blanco innecesarios (`JSON.stringify(obj)` sin argumentos de espaciado).
- [ ] **Decodificación de Entrada:**
    - `saveCosmos` **DEBE** ser capaz de recibir un `content` que sea un string Base64 si el flag `encoded: true` está presente.
    - El Backend debe decodificarlo antes de guardarlo en Drive como `application/json` (para mantener la legibilidad/auditabilidad en Drive) O guardarlo como binario si se decide opacidad total. *Consenso: Guardar JSON legible en Drive por ahora.*

---

## 🔵 FASE 2: ROBUSTEZ DEL CLIENTE (Frontend: ContextClient.js)

**Objetivo:** Implementar una experiencia de usuario fluida ("Zero Latencia") desacoplando la UI de la persistencia lenta de GAS.

### 📋 Checklist de Auditoría (Frontend Robustness)

#### 3. Guardado Optimista (Fire & Forget)
- [ ] **Persistencia Local Inmediata:**
    - Al llamar a `saveCosmos`, los datos deben escribirse **sincronamente** en `localStorage` (o IndexedDB para tamaños grandes) con un `local_timestamp`.
    - **UI FEEDBACK:** La función debe retornar `{ success: true, optimistic: true }` inmediatamente a la UI, sin esperar a GAS.
- [ ] **Cola Asíncrona (PromiseQueue):**
    - Debe existir un mecanismo de cola (Queue) que gestione las subidas a GAS en segundo plano.
    - **CRITERIO:** Si hay 5 guardados rápidos, solo el último (el estado final) debe enviarse a la red (Debounce/Throttle de red).
    - **MANEJO DE ERRORES:** Si la subida falla, debe marcarse en la UI como "Synced Local Only" y reintentar.

#### 4. Bloqueo de Instancia Única (BroadcastChannel)
- [ ] **Canal de Exclusividad:**
    - Al instanciar `ContextClient`, se debe abrir un `BroadcastChannel('INDRA_LOCK')`.
    - **PROTOCOL:** Publicar mensaje `WHO_IS_ALIVE`. Si alguien responde `I_AM_ALIVE`, el nuevo cliente entra en modo **SOLO LECTURA** o muestra pantalla de "Sesión Duplicada".
    - **HEARTBEAT:** El cliente "Maestro" debe emitir un latido periódicamente o responder a pings.

#### 5. Compresión en Cliente
- [ ] **Compresión de Salida:**
    - Antes de encolar en la PromiseQueue, el payload debe comprimirse (usando `CompressionStream` nativo del navegador o librería `pako`).
    - **CRITERIO:** El payload enviado a `InterdictionUnit` debe ser significativamente menor que el objeto en memoria.
- [ ] **Descompresión de Entrada:**
    - Al recibir respuesta de `mountCosmos`, `ContextClient` debe verificar el flag `encoding`.
    - Si es `GZIP/BASE64`, debe descomprimir antes de hidratar el Store.

---

## 🟣 FASE 3: VALIDACIÓN Y DIAGNÓSTICO

**Objetivo:** Verificar empíricamente que el sistema cumple con las leyes físicas impuestas.

### 📋 Checklist de Auditoría (System Verification)

#### 6. Autopsia del Kernel (`debug_kernel_autopsy.gs`)
- [ ] **Test de Integridad de Hash:**
    - Crear un script de prueba que simule una condición de carrera:
        1. Leer Cosmos A (Hash X).
        2. Simular Cliente 1 guardando cambios basados en Hash X -> **ÉXITO** -> Nuevo Hash Y.
        3. Simular Cliente 2 intentando guardar cambios basados en Hash X -> **FALLO** (Conflicto de Hash).
- [ ] **Test de Compresión:**
    - Verificar que un payload gigante (>1MB) puede ser guardado y recuperado sin errores de "Exceeded memory limit" o "String too long".

---

## 🛡️ CRITERIOS DE RECHAZO (STOP THE LINE)

Se detendrá la implementación si se detecta cualquiera de los siguientes fallos axiomáticos:

1.  **Pérdida de Datos Silenciosa:** El Frontend reporta "Guardado" pero el Backend rechaza por hash y el usuario no se entera.
2.  **Corrupción de Estado:** El archivo en Drive queda guardado como string Base64 corrupto o ilegible.
3.  **Bloqueo de UI:** El hilo principal del navegador se congela durante la compresión/guardado optimista.
4.  **Fuga de Sesión:** Dos pestañas pueden editar el mismo Cosmos simultáneamente, causando "Last Write Wins" y pérdida de trabajo.

---
*Este documento sirve como Contrato de Calidad para la implementación del modelo "Reactor sobre Madera".*





