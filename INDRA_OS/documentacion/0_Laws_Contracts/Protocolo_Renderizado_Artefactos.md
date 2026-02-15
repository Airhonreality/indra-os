# Protocolo de Renderizado de Artefactos (Canon v8.0)

Este documento define el proceso estandarizado para dar vida a un nuevo Artefacto en la Terminal del Dev Lab de INDRA, asegurando su correcta proyección visual y funcional mediante el sistema de **Multi-Arquetipo**.

## 1. Filosofía de Diseño (Soberanía Polimórfica)

En INDRA OS, un Artefacto NO es una sola cosa. Es una composición de capacidades.
- **Antes (v5-v7):** `ARCHETYPE: "HYBRID_STORE"` (Monolito rígido).
- **Ahora (v8.0):** `ARCHETYPES: ["ADAPTER", "VAULT", "GRID"]` (Composición flexible).

El Frontend no define "tipos especiales". El Frontend es un **Ensamblador Universal** que itera sobre la lista de arquetipos del artefacto y renderiza las vistas correspondientes como capas o pestañas.

---

## 2. Pasos para Canonizar un Nuevo Artefacto

### Paso 1: Definición del CANON (Backend Code)

En el archivo del adaptador (ej. `NewServiceAdapter.gs`), define el objeto `CANON` siguiendo la estructura Multi-Arquetipo.

```javascript
  // --- SOVEREIGN CANON V8.0 ---
  const CANON = {
      LABEL: "My New Service",
      
      // LA CLAVE DEL ÉXITO: Define qué 'caras' tiene tu artefacto.
      // - ADAPTER: Vista base (Info, Status, Config).
      // - VAULT: Navegador de archivos/carpetas.
      // - GRID: Tabla de datos.
      // - DOC: Editor de texto o Markdown.
      // - REPL: Consola de comandos interactiva.
      // - COMPUTE: Motor de cálculo (inputs/outputs puros).
      ARCHETYPES: ["ADAPTER", "REPL"], 
      
      // FALLBACK LEGACY (Obligatorio por ahora)
      ARCHETYPE: "SERVICE", 
      
      DOMAIN: "CUSTOM_DOMAIN", // SYSTEM_CORE, KNOWLEDGE, LOGIC...
      SEMANTIC_INTENT: "BRIDGE", // BRIDGE, STREAM, PROBE...
      
      // Define tus capacidades operativas
      CAPABILITIES: {
          "run_command": { 
              "io": "WRITE", "desc": "Execute custom logic",
              "inputs": { "cmd": { "type": "string" } }
          }
      },
      
      // Define métricas para la vista base (ADAPTER)
      VITAL_SIGNS: {
          "LATENCY": { "criticality": "NOMINAL", "value": "20ms" }
      },
      
      // Configura la UI (Opcional, sobreescribe defaults)
      UI_LAYOUT: {
          "SIDE_PANEL": "ENABLED",
          "TERMINAL_STREAM": "ENABLED"
      }
  };
```

### Paso 2: Limpieza de Zombies (Legacy Code)

Elimina cualquier rastro de lógica antigua que contradiga el CANON.
1. **Borra** objetos `schema = { ... }` hardcodeados gigantes.
2. **Implementa** el puente dinámico para mantener compatibilidad:

```javascript
    // Legacy Bridge (Auto-generado desde CANON)
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                // Mapeo simple de puertos
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    },
```

### Paso 3: Retorno Soberano

Asegúrate de que el factories retorne la identidad completa.

```javascript
  return {
    CANON, // <--- EXPOSICIÓN CRÍTICA
    id: "my_service",
    // ... métodos ...
  };
```

---

## 3. Verificación en Frontend (Dev Lab)

Una vez desplegado el código (`clasp push`), el `SystemAssembler` inyectará tu artefacto en el `registry`.

1. **Recarga** la Skin (F5).
2. Abre la **Terminal Dev Lab**.
3. Selecciona tu artefacto en el dropdown.
4. **Verifica:**
    - ¿Aparece el nombre correcto?
    - ¿Se muestran las pestañas correspondientes a tus `ARCHETYPES`? (Ej. Si pusiste `VAULT`, ¿ves el explorador de archivos?).
    - ¿Las capacidades aparecen en la sección "Functional Capabilities"?

---

## 4. Troubleshooting Común

| Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| El artefacto se ve genérico ("Service") sin pestañas. | El `SystemAssembler` no está leyendo el `CANON` o `ARCHETYPES` no está definido. | Verifica que `CANON` esté en el `return` del adaptador. Revisa `clasp push`. |
| Las capacidades salen vacías. | Error en el getter `schemas` o `CANON.CAPABILITIES` vacío. | Revisa el puente dinámico `get schemas()`. |
| La terminal crashea al seleccionar. | Un arquetipo declarado no tiene motor en `ComponentProjector.jsx`. | Asegúrate de usar solo arquetipos soportados: `ADAPTER`, `VAULT`, `GRID`, `DOC`, `COMPUTE`. |

---

** Autoridad:** INDRA Core Team
** Versión:** 1.0 (Poly-Archetype Standard)





