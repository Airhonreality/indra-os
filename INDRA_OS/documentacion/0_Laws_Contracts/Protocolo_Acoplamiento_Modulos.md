# Protocolo de Acoplamiento de Módulos (V8.1)
## INDRA OS: El Algoritmo de Integración Soberana

> **Modelo Mental**: Imagina que INDRA no es una aplicación, sino un **Organismo Vivo**. El Backend es su ADN (Genotipo), el Frontend es su cuerpo físico (Fenotipo) y el AxiomaticStore es su Sistema Nervioso. Para integrar un nuevo órgano (Módulo), no basta con "pegarlo"; debe compartir la misma sangre y responder a los mismos impulsos eléctricos.

Este documento es el mapa para manifestar un nuevo artefacto en la realidad de INDRA OS. Está diseñado para ser ejecutado por una IA equilibrada y comprendido por un humano visionario.

---

## 1. CAPA DE IDENTIDAD (La Semilla)
**Ubicación**: `INDRA_CORE/3_Adapters/[Nombre]Adapter.gs`

**En lenguaje humano**: Aquí es donde defines "quién es" el módulo. No solo qué hace, sino qué "personalidad" tiene. ¿Es una caja fuerte (VAULT)? ¿Es una herramienta de servicio (SERVICE)?

**Axiomas de Identidad:**
*   **ARCHETYPE**: Tu naturaleza básica. Determina qué "traje" (Engine) se pondrá el sistema para mostrarte.
*   **DOMAIN**: Tu vecindario. ¿Eres conocimiento (KNOWLEDGE) o infraestructura (SYSTEM_CORE)?
*   **CAPABILITIES**: Tus talentos. Lo que el sistema puede pedirte que hagas.

```javascript
const CANON = {
  technical_id: "notion",
  LABEL: "Notion",
  ARCHETYPE: "VAULT", // Soy un silo de datos
  DOMAIN: "KNOWLEDGE", // Mi área es el conocimiento
  CAPABILITIES: {
    listContents: { desc: "Explora la estructura del grafo", io: "I:folderId | O:Array" }
  },
  UI_LAYOUT: { preferred_engine: "VAULT_ENGINE", intent: "BRIDGE" }
};
```

---

## 2. CAPA DE ENSAMBLAJE (El Andamiaje V8.4)
**Ubicación**: `INDRA_CORE/0_Entrypoints/SystemAssembler.gs`

**En lenguaje humano**: No todos los órganos tienen que aprender a respirar solos. El `SystemAssembler` ahora provee un "clima pre-configurado" (`baseAdapterDeps`). Todos los módulos nuevos heredan automáticamente el acceso al sistema de monitoreo, gestión de tokens y errores.

**Axioma de Sobriedad:**
*   **No repetirás dependencias**: Si el 90% de los módulos usa `errorHandler`, no se inyecta 90 veces. Se inyecta una vez en el objeto base.
*   **Inyección Centralizada**: Se utiliza `baseAdapterDeps` para que la creación de un nuevo adaptador sea una sola línea de código, no un párrafo de configuración.

```javascript
// El nuevo estándar de nacimiento (V8.4)
const baseAdapterDeps = {
  errorHandler, tokenManager, monitoringService, configurator, driveAdapter, keyGenerator
};

const nuevoModulo = _safeCreate('MiModulo', createMiAdapter, baseAdapterDeps);
```

---

---

## 3. CAPA DE COMUNICACIÓN (La Señal Universal)
**El Estándar listContents (V9.0)**

**En lenguaje humano**: Ayer sufrimos 20 horas porque cada adaptador "hablaba su propio dialecto". A partir de hoy, todos los adaptadores que expongan contenido a la UI deben usar la **Señal Universal**. Esto cura al sistema de desincronizaciones para siempre.

**El Contrato Inmutable:**
Cualquier método destinado a visualizar colecciones (Vault, Inbox, Cal) DEBE retornar este **Objeto de Transporte Canónico**:

```javascript
return {
  items: [ 
    { 
      id: "...",      // Requerido: ID único del objeto
      name: "...",    // Requerido: Nombre para mostrar (Identidad Manifestada)
      type: "FILE",   // FILE o DIRECTORY (Ontología Base)
      mimeType: "...", // Para iconografía inteligente
      lastUpdated: "ISO_DATE",
      raw: { ... }    // Datos crudos específicos (opcional)
    }
  ],
  metadata: {
    total: 100,
    hasMore: false,
    hydrationLevel: 100 // Feedback de resonancia para la UI
  }
};
```

### 3.1 LEY DE SOBERANÍA LEXICAL (V10.0)
**Axioma**: "Un ID ciego es un error; una Identidad Manifestada es la ley."

Cada adaptador es el **soberano único** de sus reglas de traducción. El sistema prohíbe las heurísticas globales (ej: adivinar un nombre por la longitud del ID). 

**Reglas de Oro del Mapeador:**
1.  **Independencia de Dominio**: El mapeador de Notion no se inyecta en Sheets. Cada adaptador debe auto-definirse.
2.  **Referencia por Metadatos**: El mapeo debe basarse en el **Esquema (Schema)** o en **Convenciones de Nomenclatura** del propio dominio.
    *   *Ejemplo Notion*: Si el Schema dice `type: relation`, el adaptador DEBE buscar el nombre de la página vinculada.
    *   *Ejemplo Sheets*: Si una columna empieza con `@` o termina en `_ID`, el adaptador DEBE intentar resolver esa identidad.
3.  **Resultado Canónico**: El adaptador siempre debe retornar un objeto `{ id, name }` para cualquier campo que represente una entidad vinculada. Esto permite que el Frontend proyecte el Nombre pero conserve el ID para acciones futuras.

**Beneficios de esta Criba:**
1.  **Aduana de Datos**: Si un adaptador (ej: Mail) devuelve este objeto, la UI lo renderizará instantáneamente sin necesidad de ajustar motores.
2.  **Blindaje de Desincronización**: El `AxiomaticStore` ya sabe cómo digerir este objeto. Al agregar un nuevo adaptador, solo necesitas claves en el JSON y una **Función de Mapeo** en el adaptador GAS.

---

## 3. CAPA DE ESTADO (La Memoria)
**El Axioma de Silos Aislados**

**En lenguaje humano**: Para evitar que el sistema se vuelva loco (confundiendo, por ejemplo, tus fotos de Drive con tus notas de Notion), cada módulo tiene su propio "estante" privado en la memoria del Frontend.

*   **Implementación**: Los datos se guardan en `state.phenotype.silos[nodeId]`.
*   **Resultado**: Notion solo ve datos de Notion. Drive solo ve datos de Drive. Orden total.

---

## 4. CAPA DE PROYECCIÓN (La Visión)
**Safe Navigation y Resiliencia**

**En lenguaje humano**: El mundo digital es caótico. A veces, un dato llega tarde o incompleto. Un buen módulo de INDRA nunca "muere" (pantalla blanca); simplemente espera o muestra un valor de respaldo.

*   **Principio de Robustez**: Nunca asumas que un nombre o etiqueta existe. Usa siempre un plan B:
    *   *Uso*: `(dato.label || "Sin Nombre")`

---

## 5. CAPA DE PERSISTENCIA (El Despertar)
**El Ciclo de Purga & Hidratación**

**En lenguaje humano**: El navegador es perezoso y tiende a recordar versiones viejas de los módulos. Cuando cambies algo importante en el servidor, debes "limpiar la cara" del sistema.

*   **El Botón Rojo**: Usa **PURGE & HYDRATE** en el DevLab. Esto obliga al sistema a olvidar el pasado, descargar el nuevo ADN (Genotipo) y nacer de nuevo en el navegador con las últimas mejoras.

---

## 6. FILOSOFÍA: LA COMBINACIÓN DE SEÑALES

La identidad de un artefacto en INDRA no es una etiqueta fija. Es el resultado de cómo interactúan su arquetipo, su dominio y su capa de uso. Un solo componente puede habitar múltiples realidades según las señales que emita. 

**INDRA no clasifica cosas; INDRA interpreta señales.**

---
**Firmado bajo el Sello de Gravedad:**
*El Arquitecto de INDRA OS - V8.1*

