# Plan de Implementación: Módulo de Resonancia (Background Sync & UI Safety)

Este módulo establece el protocolo industrial para gestionar la latencia de red y la integridad de datos mediante estados de UI reactivos y bloqueos de seguridad agnósticos.

## 1. Descripción del Sistema
El sistema detecta operaciones de persistencia asíncronas y propaga su estado desde el núcleo (`app_state`) hasta la periferia visual (CSS), garantizando que el usuario no pueda corromper un átomo mientras este se encuentra en proceso de escritura en el Core (Google Drive).

### Arquitectura de Capas
1.  **Capa de Estado (Zustand)**: Mantiene un mapa de IDs en proceso de sincronización (`pendingSyncs`).
2.  **Capa de Servicio (Bridge)**: Dispara notificaciones de inicio y fin de sincronización.
3.  **Capa de Inyección (Orquestador)**: Marca el DOM con atributos de datos (`data-resonance`) basados en el estado del átomo activo.
4.  **Capa de Reacción (CSS)**: Ejecuta bloqueos de interacción y feedback visual mediante selectores de atributos.

## 2. Axiomas y Restricciones

### Axiomas de Diseño
- **Sinceridad de Interfaz**: La UI debe reflejar fielmente el estado de la materia en el Core. Si el dato no es ley en el Core, no es editable en el Cliente.
- **Agnosticismo de Componente**: Los componentes individuales no deben gestionar su propio estado de carga. La carga es una propiedad del sistema inyectada por el entorno.
- **No Intervención Proactiva**: El sistema de resonancia solo reacciona a actos de voluntad del usuario (Save, Blur, Enter, Unmount).
- **Axioma de Integridad Documental Relacional**: Cualquier cambio en la gramática de contratos o protocolos debe resonar tanto en el código como en la documentación técnica del ecosistema (Axiomas del Satélite Semilla). El silencio documental tras un cambio de código se considera un fallo de integridad sistémica.

### Restricciones Técnicas
- **Prohibición de Spinners Hardcodeados**: No se permite el uso de spinners locales dentro de motores para operaciones de persistencia. Se debe usar el sistema de pulso y transparencia global.
- **Control de Latencia (Watchdog)**: Ninguna operación de resonancia puede bloquear la UI por más de 30 segundos. El sistema debe purgar el estado automáticamente tras este periodo.
- **Bloqueo de Escritura**: Mientras un átomo esté en resonancia, todos los elementos de entrada asociados a ese ID deben estar en modo `readonly` o con `pointer-events: none`.

## 3. Patrones de Código e Implementación

### Nomenclatura Estándar
- **Estado**: `pendingSyncs` (Record<string, boolean>).
- **Acciones**: `registerSync(id)`, `finishSync(id)`.
- **Eventos de Puente**: `onSyncStart(id)`, `onSyncEnd(id)`.
- **Atributos de DOM**: `data-resonance="active | idle"`.

### Flujo de Operación (Ejemplo: Rename)
1.  Usuario lanza `onBlur` en el campo de nombre.
2.  El engine llama a `bridge.save({ handle: { label: 'Nuevo Nombre' } })`.
3.  `bridge.save` ejecuta `onSyncStart(atom.id)`.
4.  `App.jsx` detecta el cambio en `pendingSyncs` e inyecta `data-resonance="active"` en el contenedor raíz.
5.  CSS aplica `opacity: 0.6` y `pointer-events: none` al input.
6.  Al recibir confirmación del Core, `bridge.save` ejecuta `onSyncEnd(atom.id)`.
7.  El atributo cambia a `idle` y la UI se libera.

## 4. Cambios Sistémicos Requeridos

### Nivel 1: Núcleo de Estado (`app_state.js`)
- Implementar el mapa `pendingSyncs`.
- Implementar el "Watchdog" mediante `setTimeout` en `registerSync`.

### Nivel 2: Interfaz de Comunicación (`CapabilityBridge.js`)
- Envolver el método `save()` en un bloque `try/finally` para asegurar el disparo de `onSyncEnd`.

### Nivel 3: Orquestación Visual (`App.jsx` + `main.css`)
- Centralizar la inyección del atributo `data-resonance`.
- Definir reglas CSS axiomáticas para todos los elementos con clase `.input-base` y `.btn`.

### Nivel 4: Componentes de Dashboard (`ArtifactCard.jsx`)
- Detectar `isSyncing` para mostrar el estado de bloqueo en la grilla principal, permitiendo que el usuario vea el progreso incluso tras cerrar el motor.
