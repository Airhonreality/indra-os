# ADR 003: Soberanía de Snapshot y Sincronía por Piggybacking

*   **Estado:** Aceptado
*   **Fecha:** 2026-02-09
*   **Contexto:** La arquitectura previa basada en deltas granulares de sincronía (V10) generaba una "Brecha de Realidad" durante el arranque (BOOTING) y fragilidad ante recargas de página (F5). El sistema operativo personal (INDRA) no requiere arbitraje multiusuario, por lo que la comunicación constante para validar cada movimiento es un antipatrón de latencia y saturación para GAS.
*   **Decisión:** Adoptar un modelo de **Soberanía Circular basada en Snapshots Asíncronos**.
    *   **Prioridad Local:** El sistema confía ciegamente en la memoria de hierro local (IndexedDB) para su visualización inmediata. El usuario nunca espera a GAS para diseñar su entorno.
    *   **La Mochila de Realidad:** Los cambios espaciales y de layout no se envían individualmente. Se acumulan en un buffer local ("La Mochila").
    *   **Piggybacking:** La persistencia hacia GAS ocurre de forma oportunista. Cada vez que el sistema contacta con el backend por una acción funcional (ej: consultar una API, procesar un adapter), se adjunta la "Mochila" completa de realidad en el mismo sobre.
    *   **Génesis Silencioso:** La interdicción agresiva se relaja. Las intenciones de creación se guardan localmente y se transmiten asíncronamente sin bloquear la experiencia del usuario.
*   **Consecuencias:**
    *   **Inmunidad al F5:** Al recargar, el sistema recupera su mochila local y la proyecta, eliminando la amnesia del OS.
    *   **Eficiencia de Red:** Reducción del 90% en llamadas de sincronía espacial pura.
    *   **Robustez:** GAS actúa como un almacén de hitos (Checkpoints), no como un monitor de tiempo real.
    *   **Simplicidad:** Se elimina la complejidad de reconciliar micro-parches colisionados.

---

## Sistema de Retroalimentación Visual: "El Latido de Sincronía"

**Principio**: El usuario nunca debe preguntarse "¿se guardó?". La respuesta debe ser **visible, sutil y no intrusiva**.

### Componente: SovereignSphere Rediseñada

**Diseño Anterior**: Círculo sólido con punto central (minimalista pero inexpresivo).

**Diseño Nuevo**: **Sol de Sincronía** - Esfera de luz con blur radial que emana energía visual.

#### Estados Cromáticos (Semáforo de Salud)

| Estado | Color | Significado | Acción del Sistema |
|--------|-------|-------------|-------------------|
| **🌞 AZUL CIELO** | `#60a5fa` (blur suave) | Última respuesta del Core: `SUCCESS` | Sistema en sincronía perfecta. No se requiere acción. |
| **🌅 AMARILLO ATARDECER** | `#fbbf24` (blur cálido) | Última respuesta del Core: `FAIL` (soft error) | Inicia **Protocolo de Retry Exponencial** (5s, 10s, 30s). IndexedDB sigue guardando. |
| **🔴 ROJO SIN CONEXIÓN** | `#ef4444` (blur intenso) | Sin respuesta del Core tras múltiples intentos | Muestra Badge en Hood Secundario: **"Trabajo sin conexión"**. Persistencia local en modo agresivo. |

#### Especificación Visual

```css
/* Estado: AZUL CIELO (Sincronizado) */
.sovereign-sphere--synced {
    background: radial-gradient(circle, #60a5fa 0%, transparent 70%);
    box-shadow: 0 0 40px rgba(96, 165, 250, 0.6);
    animation: pulse-sync 3s ease-in-out infinite;
}

/* Estado: AMARILLO ATARDECER (Retry) */
.sovereign-sphere--retry {
    background: radial-gradient(circle, #fbbf24 0%, transparent 70%);
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.6);
    animation: pulse-retry 2s ease-in-out infinite;
}

/* Estado: ROJO SIN CONEXIÓN (Offline) */
.sovereign-sphere--offline {
    background: radial-gradient(circle, #ef4444 0%, transparent 70%);
    box-shadow: 0 0 40px rgba(239, 68, 68, 0.8);
    animation: pulse-offline 1.5s ease-in-out infinite;
}

@keyframes pulse-sync {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
}
```

---

## Protocolo de Retry Exponencial (Resiliencia Automática)

**Trigger**: Cuando `stabilizeAxiomaticReality` devuelve `success: false`.

### Secuencia de Intentos

```
Intento 1: Inmediato (T+0s)   → FAIL
Intento 2: T+5s                → FAIL
Intento 3: T+15s (5+10)        → FAIL
Intento 4: T+45s (5+10+30)     → FAIL
Estado Final: OFFLINE MODE
```

**Implementación**:
- `InterdictionUnit` mantiene un contador `failedSyncAttempts`.
- Cada fail dispara un `setTimeout` con delay exponencial.
- La SovereignSphere se actualiza en cada transición.

### Badge "Trabajo sin conexión"

**Ubicación**: Hood Secundario (esquina superior derecha)
**Estilo**: Transparencia 85%, tipografía `Outfit 10px`, color `#9ca3af`
**Comportamiento**: Aparece solo en estado ROJO. Desaparece al recuperar conexión.

```jsx
{syncStatus === 'OFFLINE' && (
    <div className="offline-badge">
        Trabajo sin conexión
    </div>
)}
```

---

## Persistencia Resiliente: "Nunca Perder la Verdad"

### Prioridades de Persistencia

1. **Prioridad Máxima**: IndexedDB (`PHENOTYPE_CACHE`)
   - Se guarda SIEMPRE tras cualquier mutación del estado.
   - Sobrevive al cierre del navegador.
   - Solo se borra con limpieza manual del usuario (esperado y natural).

2. **Prioridad Media**: localStorage (Fallback Legacy)
   - Solo para llaves críticas (`INDRA_REVISION_HASH`, `LAST_ACTIVE_COSMOS_ID`).
   - Límite de 5MB, pero suficiente para metadatos.

3. **Prioridad Baja**: GAS Drive (Backup Oportunista)
   - Se envía vía piggybacking solo cuando:
     - Hay una acción funcional en curso (ej: consultar API).
     - O cuando el retry protocol está activo.

### Persistencia en Cierre del Navegador

**Evento**: `window.onbeforeunload`

```javascript
window.addEventListener('beforeunload', async (e) => {
    const snapshot = SyncOrchestrator.prepareSnapshot();
    if (snapshot && snapshot.artifacts.length > 0) {
        // Intento urgente de enviar snapshot al Core
        navigator.sendBeacon('/api/emergency-sync', JSON.stringify(snapshot));
        
        // Garantizar guardado en IndexedDB (síncrono)
        await AxiomaticDB.setItem('EMERGENCY_SNAPSHOT', snapshot);
    }
});
```

**Nota**: `navigator.sendBeacon` es asíncrono y no garantiza entrega si el navegador se cierra muy rápido. La **verdad absoluta** siempre está en IndexedDB.

---

## Axiomas de Resiliencia

1. **El Front es Soberano**: La realidad del usuario está en RAM e IndexedDB. El Core es un espejo opcional.
2. **Nunca Bloquear**: Si el Core falla, el usuario continúa trabajando sin fricción.
3. **Feedback Sutil**: El Latido de Sincronía comunica el estado sin distraer.
4. **Retry Inteligente**: No saturar al Core, pero ser persistente (exponential backoff).
5. **Persistencia Obsesiva**: Guardar en IndexedDB tras cada mutación, sin importar el estado de la red.

---

## Persistencia Selectiva: Convenciones de Snapshot

**Principio**: El snapshot solo debe persistir la "Identidad y Geometría" de INDRA, nunca el "Contenido Dinámico" de Terceros.

### Arquitectura de Responsabilidades

```
┌─────────────────────────────────────────┐
│  DataConventions.js (Front)             │  ← Registro canónico de reglas
│  - PERSISTENCE_RULES                    │  - Define qué campos persisten
│  - cleanArtifactForSnapshot()           │  - Sin dependencia del Backend
└─────────────────────────────────────────┘
              ↓ (usa)
┌─────────────────────────────────────────┐
│  SyncOrchestrator.js (Front)            │  ← Administrador de snapshots
│  - prepareSnapshot()                    │  - Aplica limpieza automática
│    → aplica cleanArtifactForSnapshot()  │  - Genera snapshot completo
└─────────────────────────────────────────┘
              ↓ (invoca)
┌─────────────────────────────────────────┐
│  InterdictionUnit.js (Front)            │  ← Ejecutor de piggybacking
│  - _flushBatch()                        │  - Inyecta snapshot en batch
│    → inyecta snapshot en batch          │  - Monitorea respuesta del Core
│    → monitorea success/fail             │  - Dispara retry si falla
└─────────────────────────────────────────┘
              ↓ (envía HTTP)
┌─────────────────────────────────────────┐
│  CognitiveSensingAdapter.gs (Backend)   │  ← Receptor y persistor
│  - stabilizeAxiomaticReality()          │  - Guarda en Drive
│    → guarda en Drive                    │  - Registra en AuditLogger
│    → registra en AuditLogger            │  - Devuelve confirmación
└─────────────────────────────────────────┘
```

### Campos Persistidos vs Volátiles

| Categoría | Campos | Razón |
|-----------|--------|-------|
| **Persistidos Siempre** | `id`, `type`, `identity`, `position`, `layer`, `config`, `capabilities`, `userContent` | Estructura y geometría de INDRA |
| **Nunca Persistidos** | `_liveData`, `_cache`, `_fetching`, `_error`, `_isDirty`, `_simulated`, `_tombstoned` | Datos volátiles de terceros o flags de UI |
| **Condicionales** | Según tipo de artefacto (ej: `annotations` solo para NOTE) | Contexto específico |

### Por qué NO usar BlueprintRegistry (Backend)

1. **Separación de Responsabilidades**: Blueprint valida estructura, DataConventions dicta comportamiento de persistencia.
2. **Soberanía Local**: El Front debe poder preparar snapshots sin consultar al Backend (offline-first).
3. **Contexto Semántico**: Blueprint = "qué es", DataConventions = "cómo se comporta".
4. **Escalabilidad**: Diferentes contextos (Drive, Debug, Export) pueden tener reglas distintas.

---

## Solución a la Paradoja de Indra: Protocolo Local-First

**La Paradoja**: ¿Cómo puede el sistema ser soberano si debe esperar a que el Backend (L8) valide su realidad para poder mostrarla? Si el Front espera, no es soberano. Si el Front no espera, corre el riesgo de divergencia (Indra Drift).

**La Solución**: **Autoridad Local con Consenso Asíncrono**.

### 1. Hidratación Prospectiva (<10ms)
Al iniciar o cambiar de universo, el sistema aplica la **Regla del Primer Pulso**:
- **Paso 1**: El `AxiomaticStore` busca la realidad en el `AxiomaticDB` (IndexedDB).
- **Paso 2**: Si existe, se monta e hidrata de forma **INSTANTÁNEA**. El usuario puede interactuar con sus nodos antes de que la primera señal de red salga del navegador.
- **Paso 3**: El spinner de carga (`Loading`) se desactiva basándose en la realidad local.

### 2. Sincronía de Fondo (Consenso)
Mientras el usuario ya está trabajando, se lanza una petición silenciosa al Core:
- El Core envía su versión de la realidad.
- **Caso A (Identidad)**: Si el `_revisionHash` es igual, no ocurre nada.
- **Caso B (Drift Positivo)**: Si el Core tiene una versión más nueva (ej: cambios realizados desde otro dispositivo), el Front integra los cambios sutilmente.
- **Caso C (Conflicto)**: El Front siempre tiene la última palabra sobre las mutaciones no sincronizadas, empujando su estado vía **Piggybacking Redundante**.

### 3. Persistencia Obsesiva y Continua
Ya no existe el concepto de "Guardar". La persistencia es un efecto secundario de la existencia:
- **L2 Inmediato**: Cada mutación (mover nodo, conectar cable, cambio de zoom) se graba en IndexedDB en el mismo ciclo de ejecución.
- **L8 Oportunista**: La "Mochila" se envía al Core aprovechando cualquier tráfico funcional o en periodos de calma (debounced).

---

**Última Actualización**: 2026-02-10 (Cierre de Paradoja V12)
