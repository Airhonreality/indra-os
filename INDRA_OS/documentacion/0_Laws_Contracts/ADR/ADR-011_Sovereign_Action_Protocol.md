# ADR-011: Protocolo de Acción Soberana (Sovereign Action Protocol)

**Estado:** ACEPTADO  
**Fecha:** 2026-02-12  
**Autor:** Antigravity (Sovereign Agent)  
**Contexto:** Sistema de Interacción Reactiva (Gilles Deleuze: "La acción precede a la percepción")

## 1. Contexto y Problema
El sistema actual padecía de una "Desconexión de Estado" (Split-Brain) donde la interfaz de usuario (UI) quedaba bloqueada o desincronizada debido a la latencia de red.
*   **Problema A (Dialogs):** El uso de `window.confirm` interrumpía el flujo cognitivo del usuario.
*   **Problema B (Latencia):** La UI esperaba la confirmación del servidor (Backend -> 200ms-2s) antes de reflejar cambios visuales, creando una sensación de lentitud ("laggy").
*   **Problema C (Zombies):** La falta de una limpieza profunda de cachés locales (`LocalStorage`, `IndexedDB`) permitía que elementos eliminados "resucitaran" al recargar, debido a la estrategia `Local-First` sin invalidación estricta.

## 2. Decisión Arquitectónica
Se establece el **Protocolo de Acción Soberana** como la Ley Suprema para todas las interacciones de usuario (UI Actions).

### Principio 1: Intención Cinética (Kinetic Intent)
*   **Decisión:** Eliminar todos los cuadros de diálogo disruptivos (`window.confirm`, `alert`).
*   **Implementación:** Utilizar componentes de "Intención Física", como botones de **Pulsación Sostenida** (Hold-to-Delete). La confirmación es implícita en el esfuerzo físico mantenido (1.5s), eliminando el click accidental sin bloquear el flujo.

### Principio 2: Optimismo Radical (The Action Precedes Perception)
*   **Decisión:** La UI debe reflejar la **intención** del usuario inmediatamente, asumiendo el éxito de la operación.
*   **Implementación:**
    1.  El componente UI solo despacha la **Intención** (`execute('DELETE_COSMOS', { id })`).
    2.  El Store (`AxiomaticStore`) ejecuta la **Mutación Visual Inmediata** (elimina el ítem de la lista en memoria).
    3.  El usuario percibe la acción terminada en <16ms (1 frame).

### Principio 3: Ejecución Soberana Asíncrona (Side Effects)
*   **Decisión:** La comunicación con el Backend ("La Burocracia") ocurre estrictamente en segundo plano, sin bloquear la UI.
*   **Implementación:**
    1.  El Store lanza la petición al `ContextClient` o `Adapter` de forma asíncrona.
    2.  El Store gestiona la **Limpieza Profunda** (Deep Clean) de todas las capas de memoria (RAM, LocalStorage L7, IndexedDB Iron Memory) para evitar inconsistencias.
    3.  **Consistencia Eventual:** Se realiza una validación silenciosa posterior. Si la realidad del servidor difiere, se actualiza la UI discretamente o se hace Rollback en caso de error catastrófico.

## 3. Consecuencias

### Positivas (+)
*   **Inmediatez:** La percepción de velocidad del sistema aumenta drásticamente.
*   **Fluidez:** Eliminación de fricción cognitiva por diálogos modales.
*   **Limpieza:** Código de componentes UI más limpio y declarativo (solo despachan, no procesan).
*   **Integridad:** Eliminación de estados "Zombie" gracias al Deep Clean centralizado en la acción.

### Negativas (-)
*   **Complejidad de Estado:** El `AxiomaticStore` debe manejar lógica de rollback y compensación de errores.
*   **Riesgo de Divergencia:** Existe una ventana de tiempo (mientras la petición viaja) donde la UI muestra un estado que el servidor aún no conoce. (Mitigado por la alta confiabilidad del backend y validación silenciosa).

## 4. Implementación Canónica

```javascript
// EN EL COMPONENTE (UI)
const handleDelete = (id) => {
    // Solo declara la intención. No espera, no confirma, no procesa.
    execute('DELETE_RESOURCE', { id });
};

// EN EL STORE (Axiomatic)
if (actionType === 'DELETE_RESOURCE') {
    const { id } = payload;
    
    // 1. MUTACIÓN VISUAL INMEDIATA
    const newList = state.items.filter(i => i.id !== id);
    dispatch({ type: 'UPDATE_LIST', payload: newList });

    // 2. EFECTO SECUNDARIO (Deep Clean + Backend)
    contextClient.deleteResource(id).then(() => {
        // 3. VALIDACIÓN SILENCIOSA
        contextClient.fetchList().then(serverList => {
             if (divergence) dispatch({ type: 'UPDATE_LIST', payload: serverList });
        });
    }).catch(err => {
        // 4. ROLLBACK (Si es crítico)
        console.error("Fallo Realidad:", err);
        dispatch({ type: 'ROLLBACK_DELETE', payload: id });
    });
}
```





