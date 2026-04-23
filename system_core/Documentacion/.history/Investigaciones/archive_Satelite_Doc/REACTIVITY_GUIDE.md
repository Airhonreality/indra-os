# 🌊 INDRA REACTIVITY GUIDE (Protocolo T=0)

Este es el manifiesto para garantizar que tu Satélite sea instantáneo, resiliente y nunca sature la memoria del navegador.

## 1. El Axioma del suscriptor
**No "Pidas" datos, "Suscríbete" a ellos.**
En Indra, no existe el concepto de "esperar al fetch". Usamos suscripciones reactivas para manejar el tiempo.

### El Patrón Canónico (Ignite):
```javascript
export async function ignite(bridge, kernel) {
    // 1. Te suscribes al Vault (El Vault te dará el pasado y el futuro)
    bridge.vault.subscribe('inventario', (data) => {
        myUI.render(data); // Se ejecutará 2 veces: con caché (T=0) y con sync (T+n)
    });

    // 2. Disparas la hidratación en segundo plano
    kernel.hydrateSchema('inventario'); 
}
```

## 2. Gestión de Materia (5MB Limit)
Indra implementa un sistema **Peristáltico** para evitar errores `QUOTA_EXCEEDED_ERR`.

*   **POLÍTICA CRITICAL**: Datos de identidad y nexo. Nunca se borran.
*   **POLÍTICA VOLATILE**: Catálogos y tablas masivas.
*   **LRU EVICTION**: Si el almacenamiento local llega a 4MB, Indra eliminará automáticamente el catálogo que menos hayas usado recientemente para hacer espacio al nuevo.

## 3. Estados de la Realidad
Al programar tu UI, considera estos estados del `bridge.status`:
1.  **GHOST**: Sin conexión al Core. El satélite vive solo de su memoria local.
2.  **IGNITING**: Buscando resonancia.
3.  **READY/LOCAL_READY**: Tienes ADN local cargado. La UI debe ser funcional.
4.  **STABLE**: La verdad global ha llegado y el Ledger físico es consistente.

---
**REGLA DE ORO PARA AGENTES IA**:
Si vas a crear una nueva vista, busca primero si el esquema ya está en el Vault. Si no está, suscríbete ANTES de llamar a `hydrateSchema`. Esto garantiza que la UI reaccione al primer bit de datos que llegue sin importar el orden de la red.
