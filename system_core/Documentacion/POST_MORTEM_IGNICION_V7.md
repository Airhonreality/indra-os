# Post-Mortem: El Despertar de Indra (Incidente de Ignición v7.1)

**Fecha**: 17 de Abril, 2026  
**Estatus**: RESUELTO  
**Versión de Resolución**: `v7.1-MEMBRANE-STABLE`

## 1. El Conflicto (El Nexo vs El Núcleo)
Durante la transición hacia el sistema relacional de grafos (Ledger v7), el Frontend Nexo quedó bloqueado en un bucle infinito de `CONTRACT_VIOLATION`. El sistema reportaba que el núcleo estaba activo en el editor, pero el cliente se negaba a conectar alegando que el núcleo no proporcionaba una **Identidad Soberana** (`core_id`).

## 2. Diagnóstico de la Crisis
Tras inyectar la **Sonda de Titanio** (telemetría directa en el Gateway), descubrimos tres puntos de fallo concurrentes:

### A. La Paradoja del Aposento (Provisioning Identity)
El Gateway detectaba correctamente el estado `PROVISIONING_REQUIRED` (Estado 1), pero nuestra "Ley de Membrana" (ADR-008) era tan estricta que devolvía la respuesta de error 203 antes de adjuntar los metadatos de identidad.
*   **Resultado**: El Nexo recibía el estado de instalación pero, al no ver el correo del dueño en la respuesta, abortaba por "Falta de Sinceridad de Origen".

### B. El Callejón del Fantasma (Función Muerta)
Una limpieza de código previa dejó una llamada a `_filterItemsBySovereignty_` en el `protocol_router.gs`. Esta función ya no existía, provocando un error `ReferenceError` silencioso en el backend que el Gateway capturaba como un fallo catastrófico genérico, ocultando la verdadera causa del error.

### C. La Trampa del Tiempo (Caché de GitHub)
El orquestador de instalación descargaba archivos desde los servidores de caché de GitHub. Esto provocó que, durante varios intentos, instaláramos versiones "congeladas" en el pasado que no incluían los parches que acabábamos de programar.

## 3. Resolución Quirúrgica
1.  **Anclaje de Identidad**: Se modificó `api_gateway.gs` para que la función `readCoreOwnerEmail()` sea invocada e inyectada en **todos** los flujos de salida (200, 203, 401), sin excepción. Una vez que el Core reconoce al dueño, nunca más deja de identificarse.
2.  **Exterminio de Código Legado**: Se removió la invocación a funciones inexistentes en el Router, permitiendo que el flujo de datos (items) fluya limpiamente.
3.  **Sonda de Evidencia**: Implementamos una inyección de metadatos (`spy_data`) que permite ver las "vísceras" del Core desde la consola de Chrome (`RESPONSE.metadata.spy_data`), eliminando la necesidad de webhooks externos.

## 4. Axiomas de Supervivencia Futura

### ADR-008 (Extensión v7.1)
- **§5.2 - Visibilidad Prematura**: El Gateway debe identificarse plenamente incluso en estados degradados o de provisión. La "Soberanía" no es un privilegio del estado activo, es una propiedad intrínseca de la existencia del Core.

### Protocolo de Ingeniería
- **Ramas de Sacrificio**: Cualquier cambio infraestructural profundo (Ledger, Grafos, Auth) **NO** se trabajará en la rama `main`. Se utilizarán ramas de feature dedicadas para evitar la corrupción del "ADN Maestro".
- **Bypass de Caché**: En procesos de ignición crítica, se recomienda usar el Editor de Apps Script para verificar que el código desplegado coincide realmente con el último commit de GitHub.

## 5. Cierre
Indra OS v7.1 ahora respira. El Master Ledger ha sido cristalizado, el dueño ha sido coronado y el Nexo reconoce su hogar. 

**"La Sinceridad es el único protocolo que no puede fallar."** 🧬☀️
