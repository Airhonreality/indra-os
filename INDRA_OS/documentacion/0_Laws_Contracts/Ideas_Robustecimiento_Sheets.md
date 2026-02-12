# IDEAS DE ROBUSTECIMIENTO CON GOOGLE SHEETS

**Principio:** Google Sheets como infraestructura crítica para procesos que requieren concurrencia, persistencia garantizada y acceso multi-dispositivo.

---

## 1. CACHE DE QUERIES PESADAS (Oracle Adapter)

### Problema
Buscar en internet con Oracle Adapter es lento (5-10 segundos por query).

### Solución
**Hoja:** `Oracle_Query_Cache`

**Columnas:**
- `query` (string): Texto de búsqueda
- `results` (JSON string): Resultados serializados
- `timestamp` (datetime): Cuándo se cacheó
- `cosmos_id` (string): Cosmos que hizo la query
- `hit_count` (number): Veces que se reutilizó

### Flujo
1. Usuario hace búsqueda "quantum computing papers"
2. Backend verifica si existe en Sheet con `timestamp` < 24h
3. Si existe → Devolver resultados cacheados (< 100ms)
4. Si no existe → Hacer búsqueda real, guardar en Sheet, devolver resultados

### Beneficios
- Búsquedas repetidas instantáneas
- Múltiples usuarios se benefician del mismo caché
- Reduce llamadas a APIs externas (ahorro de cuotas)

---

## 2. RATE LIMITING DE APIs EXTERNAS

### Problema
Google APIs tienen límites de cuotas (ej: 100 búsquedas de Drive por minuto, 1000 por día).

### Solución
**Hoja:** `API_Rate_Limits`

**Columnas:**
- `api_name` (string): Nombre de la API (ej: "drive.search")
- `requests_count` (number): Peticiones en la ventana actual
- `window_start` (datetime): Inicio de la ventana de tiempo
- `limit` (number): Límite máximo
- `reset_interval` (number): Segundos hasta reset (ej: 60)

### Flujo
1. Antes de llamar a API, leer fila correspondiente
2. Si `requests_count >= limit` → Encolar petición en `API_Queue` Sheet
3. Si `requests_count < limit` → Ejecutar, incrementar contador
4. Trigger cada minuto resetea contadores si pasó `reset_interval`

### Beneficios
- Previene errores de cuota (HTTP 429)
- Transparente para el usuario (ve "Procesando...")
- Permite priorizar peticiones críticas

---

## 3. SINCRONIZACIÓN DE PREFERENCIAS DE USUARIO

### Problema
Usuario cambia tema de dark a light en PC. Quiere que se refleje en móvil.

### Solución
**Hoja:** `User_Preferences`

**Columnas:**
- `user_id` (string): Email del usuario
- `preference_key` (string): Nombre de la preferencia (ej: "theme")
- `value` (string): Valor (ej: "dark")
- `last_modified` (datetime): Última actualización

### Flujo
1. Usuario cambia preferencia en dispositivo A
2. Frontend guarda en Sheet (además de localStorage)
3. Dispositivo B hace polling ligero cada 30s
4. Si detecta cambio en Sheet, actualiza localStorage y UI

### Beneficios
- Preferencias sincronizadas entre dispositivos
- No requiere backend complejo
- Funciona offline (localStorage como fallback)

---

## 4. FEATURE FLAGS DINÁMICOS

### Problema
Quieres activar/desactivar features sin redesplegar código.

### Solución
**Hoja:** `Feature_Flags`

**Columnas:**
- `flag_name` (string): Nombre del feature (ej: "fat_client_mode")
- `enabled` (boolean): Activo o no
- `rollout_percentage` (number): % de usuarios que lo ven (0-100)
- `target_users` (string): Lista de emails (ej: "user1@x.com,user2@x.com") o "*" para todos

### Flujo
1. Frontend lee Sheet al inicio de la app
2. Verifica si usuario está en `target_users` o dentro del `rollout_percentage`
3. Activa/desactiva features según flags

### Ejemplo
```
| flag_name        | enabled | rollout_percentage | target_users |
|------------------|---------|-------------------|--------------|
| fat_client_mode  | true    | 100               | *            |
| oracle_cache     | true    | 50                | user1,user2  |
| new_ui_layout    | false   | 0                 | admin@x.com  |
```

### Beneficios
- A/B testing sin código
- Rollback instantáneo si algo falla
- Activación gradual de features

---

## 5. AUDIT TRAIL COMPLETO

### Problema
Necesitas saber quién cambió qué y cuándo en un Cosmos.

### Solución
**Hoja:** `Audit_Log` (extender hoja de logs existente)

**Columnas:**
- `timestamp` (datetime)
- `user` (string): Email del usuario
- `cosmos_id` (string)
- `action` (string): Tipo de acción (ej: "RENAME_COSMOS", "CHANGE_LAYOUT")
- `before` (JSON string): Estado anterior
- `after` (JSON string): Estado nuevo
- `ip_address` (string): IP del usuario (opcional)

### Flujo
1. Cada cambio estructural en Cosmos dispara log
2. Backend escribe fila en Sheet
3. Se puede consultar historial completo

### Beneficios
- Trazabilidad completa
- Útil para debugging ("¿Quién rompió el layout?")
- Compliance (GDPR, auditorías)
- Permite "deshacer" cambios

---

## 6. NOTIFICACIONES PUSH (Sin Backend Real-Time)

### Problema
Quieres notificar al usuario cuando otro usuario hace cambios en un Cosmos compartido.

### Solución
**Hoja:** `Notifications_Queue`

**Columnas:**
- `notification_id` (string): UUID
- `user_id` (string): Destinatario
- `message` (string): Texto de la notificación
- `cosmos_id` (string): Cosmos relacionado
- `read` (boolean): Si fue leída
- `created_at` (datetime)
- `type` (string): Tipo (ej: "COSMOS_UPDATED", "MENTION")

### Flujo
1. Usuario A hace cambio en Cosmos compartido
2. Backend crea fila en Sheet para Usuario B
3. Frontend de Usuario B hace polling ligero (cada 30s)
4. Si hay notificaciones no leídas, muestra toast
5. Usuario hace clic → Marca como `read = true`

### Beneficios
- Notificaciones sin WebSocket
- Sheets actúa como "message broker"
- Persistente (no se pierden si usuario está offline)

---

## 7. BACKUP INCREMENTAL AUTOMÁTICO

### Problema
Si el JSON del Cosmos se corrompe, pierdes todo.

### Solución
**Hoja:** `Cosmos_Backups`

**Columnas:**
- `cosmos_id` (string)
- `version` (number): Número de versión incremental
- `snapshot` (JSON string): Cosmos completo serializado
- `timestamp` (datetime)
- `size_bytes` (number): Tamaño del snapshot
- `user` (string): Quién hizo el cambio

### Flujo
1. Cada vez que se guarda un Cosmos, se crea una fila
2. Mantener últimas 10 versiones (eliminar versiones antiguas)
3. Si JSON se corrompe, restaurar desde Sheet

### Beneficios
- Historial de versiones gratis
- Recuperación ante desastres
- Permite comparar versiones ("¿Qué cambió?")

---

## 8. JOB QUEUE PARA GUARDADO DIFERIDO

### Problema
Si el guardado del Cosmos falla (red caída), los cambios se pierden.

### Solución
**Hoja:** `Job_Queue` (usar existente o crear pestaña en hoja de logs)

**Columnas:**
- `job_id` (string): UUID
- `type` (string): Tipo de job (ej: "SAVE_COSMOS")
- `cosmos_id` (string)
- `payload` (JSON string): Datos a guardar
- `status` (string): "PENDING", "PROCESSING", "COMPLETED", "FAILED"
- `created_at` (datetime)
- `attempts` (number): Intentos de ejecución
- `last_error` (string): Mensaje de error si falló

### Flujo
1. Frontend intenta guardar Cosmos
2. Si falla, crea fila en Sheet con `status = PENDING`
3. Trigger de Apps Script (cada minuto) lee filas pendientes
4. Intenta ejecutar job
5. Si éxito → `status = COMPLETED`
6. Si falla → `attempts++`, reintenta hasta 5 veces

### Beneficios
- Garantiza que ningún guardado se pierda
- Funciona incluso si usuario cierra la app
- Transparente (usuario no necesita hacer nada)

---

## 9. TELEMETRÍA DE USO AGREGADA

### Problema
Quieres saber qué features se usan más para priorizar desarrollo.

### Solución
**Hoja:** `Usage_Telemetry`

**Columnas:**
- `event_name` (string): Nombre del evento (ej: "VAULT_NAVIGATE")
- `user_id` (string)
- `cosmos_id` (string)
- `timestamp` (datetime)
- `metadata` (JSON string): Datos adicionales

### Flujo
1. Frontend dispara eventos de telemetría
2. Se envían en batch cada 5 minutos a Sheet
3. Se pueden analizar con Google Data Studio

### Beneficios
- Insights de uso real
- Detectar features no usadas (candidatas a eliminar)
- Optimizar UX basado en datos

---

## 10. LOCK DE EDICIÓN DISTRIBUIDO

### Problema
Dos usuarios editan el mismo Cosmos simultáneamente → Conflictos.

### Solución
**Hoja:** `Edit_Locks`

**Columnas:**
- `cosmos_id` (string)
- `locked_by` (string): Email del usuario
- `locked_at` (datetime)
- `expires_at` (datetime): Auto-liberar después de 5 minutos

### Flujo
1. Usuario A abre Cosmos para editar
2. Frontend intenta crear fila en Sheet
3. Si ya existe fila con `expires_at > now()` → Modo solo lectura
4. Si no existe → Crear fila, permitir edición
5. Al cerrar Cosmos, eliminar fila
6. Trigger limpia locks expirados cada minuto

### Beneficios
- Previene conflictos de escritura
- Transparente (usuario ve "Editando..." o "Solo lectura")
- Auto-recuperación si usuario cierra sin liberar

---

## RESUMEN DE VENTAJAS DE USAR SHEETS

1. **Concurrencia Nativa:** Múltiples usuarios pueden leer/escribir sin conflictos
2. **Persistencia Garantizada:** Google se encarga de backups y disponibilidad
3. **Acceso Multi-Dispositivo:** Mismo dato visible en PC, móvil, tablet
4. **Triggers Automáticos:** Apps Script puede procesar datos en background
5. **Visualización Gratis:** Google Data Studio para dashboards
6. **Sin Infraestructura:** No necesitas servidor, base de datos, ni Redis
7. **Escalabilidad:** Hasta 10 millones de celdas por Sheet

---

## LIMITACIONES A CONSIDERAR

1. **Latencia:** ~200-500ms por lectura/escritura (vs. 10ms de Redis)
2. **Cuotas:** 100 lecturas/escrituras por minuto por usuario
3. **Tamaño:** Máximo 10 MB por celda, 10 millones de celdas por Sheet
4. **No es Real-Time:** Polling necesario (no hay push nativo)

---

## RECOMENDACIÓN DE USO

**Usar Sheets para:**
- ✅ Datos que cambian poco (preferencias, flags, logs)
- ✅ Procesos asíncronos (queues, backups)
- ✅ Datos compartidos entre usuarios (cache, notificaciones)

**NO usar Sheets para:**
- ❌ Datos que cambian cada segundo (ej: posición del mouse)
- ❌ Datos sensibles sin encriptar (ej: passwords)
- ❌ Operaciones que requieren transacciones ACID

---

**Fin del Documento**
