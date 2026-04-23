# 🛰️ INDRA SATELLITE PROTOCOL: OMEGA v17.5
> **"La inteligencia vive en la Malla, pero la soberanía del tiempo vive en el Satélite."**

Este satélite es un nodo de soberanía unificada basado en la arquitectura **Indra SUH (Sovereign Unified Hierarchy)**. Ha sido purificado de toda entropía legacy y opera bajo leyes de resonancia estricta.

## 🏛️ 1. MAPA DE SOBERANÍA (Capas del Sistema)

| Capa | Nombre | Propósito Axiomático |
| :--- | :--- | :--- |
| **L5** | **PIEL (UI)** | Materialización visual reactiva. Vive en `/src/ui` y `_INDRA_PROTOCOL_/ui`. |
| **L4** | **NEURONAS (Logic)** | Comportamiento y flujos de trabajo. Vive en `/src/score/logic`. |
| **L3** | **ADN (Schemas)** | Estructura inmutable de la materia. Vive en `/src/score/schemas`. |
| **L2** | **SISTEMA NERVIOSO**| Reactividad y Memoria Persistente. `IndraStateEngine` + `AgnosticVault`. |
| **L1** | **EL PUENTE (Bridge)**| Único canal de resonancia con el Núcleo de Indra. |

## 📂 2. MAPA DEL SITIO (Estructura de Archivos)

```text
/
├── _INDRA_PROTOCOL_/       # EL MOTOR (Soberanía del Núcleo - NO TOCAR)
│   ├── core/               # Motores de Inteligencia y Sincronía.
│   │   ├── bridge_modules/ # Vault, Cortex, StateEngine, Transport.
│   │   └── core_schemas/   # ADN base del sistema operativo.
│   ├── ui/                 # Componentes dinámicos del HUD.
│   └── indra_hub.js        # El Big Bang: Punto de ignición único.
├── src/                    # TU SOBERANÍA (Lógica de Negocio)
│   ├── score/              # El Núcleo de tu aplicación.
│   │   ├── logic/          # Workflows y Funciones.
│   │   └── schemas/        # Definiciones de ADN de tus datos.
│   ├── ui/                 # Tu interfaz personalizada.
│   └── app.js              # Cerebro de mando del satélite.
├── docs/                   # El Canon de Verdad (Manuales de Vuelo).
├── indra_config.js         # El Vínculo Físico (URL/Token).
└── satellite.manifest.json # Tu identidad ante el Ecosistema.
```

## 📚 3. LA BÓVEDA DEL CANON (Índice de Consulta)

| Archivo | Propósito | Cuándo consultarlo |
| :--- | :--- | :--- |
| **`CANON_PROTOCOLS.md`** | Lista exacta de los 74 protocolos del Core. | Para saber cómo pedir datos o acciones al Núcleo. |
| **`UI_Axioms.md`** | Leyes estéticas (Mobile-first, Agnosticismo px).| Al maquetar cualquier HTML o escribir CSS. |
| **`STRUCTURAL_BLUEPRINTS.md`**| Ejemplos de ADN (Esquemas) y Neuronas (Workflows).| Al crear nuevas estructuras de datos o lógica. |
| **`TECHNICAL_HANDSHAKE.md`**| Protocolo oficial de Ignición y Vínculo Seguro. | Para entender el proceso de enlace Core-Satélite. |
| **`Vectores de esquizofrenia`**| Lista de anti-patrones y errores de diseño. | Para realizar auditorías de código axiomático. |
| **`git_protocol.md`** | Reglas de control de versiones y sinceridad. | Antes de realizar commits o gestionar ramas. |

## 📜 4. EL DHARMA DEL DESARROLLADOR (Dos & Don'ts)

### ✅ DHARMA (Lo que da vida al Sistema)
- **Centralización Lógica**: Toda acción de negocio debe estar en `/src/score/logic`.
- **Importación Canónica**: Los esquemas se citan en la cabecera del HTML.
- **Unidades Relativas**: Mobile-first, `%`, `vh`, `vw`, `rem`.
- **Resonancia de Estado**: Suscribirse al `appState` para actualizaciones de UI.

### ❌ ANTI-DHARMA (Entropía que mata el Sistema)
- **Hardcode CSS/JS**: Escribir lógica o estilos px en el archivo HTML.
- **Bypass de Vault**: Guardar datos en variables globales `window.` sin pasar por `AgnosticVault`.
- **Esquizofrenia de Versión**: Usar protocolos o campos no listados en `CANON_PROTOCOLS.md`.
- **Direct DOM Tampering**: Modificar el DOM manualmente ignorando el ciclo de vida del Kernel.

## 📡 4. IGNICIÓN
Para iniciar la resonancia, el satélite ejecuta el **IndraHub**, que a su vez despierta el **Kernel** e inyecta la **Configuración de Ciudadanía**. A partir de ese momento, el satélite vive en sincronía con el Core.

---
*Indra OS - Unidad de Soberanía v17.5* 🛰️🏛️💎🔥
