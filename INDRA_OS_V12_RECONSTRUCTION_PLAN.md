# 📜 PLAN MAESTRO: RECONSTRUCCIÓN ARQUITECTÓNICA INDRA OS v12.0
> **ESTADO**: PENDIENTE DE EJECUCIÓN (ASIGNADO: FIN DE SEMANA)
> **DHARMA**: DESACOPLAMIENTO BRUTAL Y SINCERIDAD COMPONENCIAL.

---

## 1. RATIO (EL PORQUÉ)
La arquitectura actual de Indra sufre de **Monolitismo de Contexto**. Los componentes de alta fidelidad (como el `FieldMapper` o el `NexusControl`) están secuestrados dentro de carpetas llamadas "Designers" (Macro Engines). Esto provoca:
1.  **Ceguera de Inferencia**: El Agente (IA) no detecta los módulos si no está trabajando específicamente en ese "diseñador".
2.  **Redundancia de código**: Se reinventan ruedas porque la lógica está "enterrada".
3.  **Rigidez Funcional**: No se puede invocar una capacidad de automatización desde un esquema sin cargar todo el peso del WorkflowDesigner.

**La Decisión**: Desintegrar los Macro-Motores y convertirlos en una **Librería de Capacidades Atómicas** (Cards) que el Dashboard monta dinámicamente.

---

## 2. EL MANIFIESTO v12.0 (MAPA DEL ALMA)
El archivo `indra.manifest.json` deja de ser un índice para ser un **Registro de Capacidades**.

```json
{
  "project": "INDRA_OS",
  "version": "12.0",
  "registry": {
    "capabilities": {
      "STORAGE_IGNITION": {
        "component": "components/features/storage/NexusControl",
        "axiom": "Asociación física de átomos a silos tabulares."
      },
      "DATA_MAPPING": {
        "component": "components/features/data/FieldMapper",
        "axiom": "Traducción de ADN entre fuentes externas y esquemas Indra."
      }
    }
  }
}
```

---

## 3. MAPA DE CARPETAS FINAL (ESTÁNDAR INDUSTRIAL)
Abandonamos los nombres de fantasía. Usamos el Estándar Dev Tradicionalista:

```text
src/
  ├── components/
  │   ├── common/              # Átomos UI (Botones, Icons, Modals genéricos)
  │   ├── layouts/             # El "Escenario" (DashboardLayout, GridSystem)
  │   └── features/            # WIDGETS DE ELITE (Ex-MacroEngines)
  │       ├── storage/         # NexusControl, FolderSelectors
  │       ├── data-mapping/    # FieldMapper, OperatorCards, MappingHooks
  │       ├── logic-visual/    # FlowCanvas, LogicNodes (Ex-Workflow)
  │       └── property-editor/ # Inspector de Atributos
  ├── hooks/                   # Lógica sin UI (useBridge, useNexus, useAuth)
  ├── services/                # Cables con el Backend (DirectiveExecutor)
  └── state/                   # Única fuente de verdad (Zustand/Context)
```

---

## 4. EL PROTOCOLO DE "PORTS" (COMUNICACIÓN ENTRE CARDS)
¿Cómo hablan dos tarjetas que no saben que la otra existe? 
1.  **Propagación por Eventos**: Las tarjetas emiten señales al Dashboard (ej. `onMappingComplete`).
2.  **Inyección por Props**: El Dashboard recibe la señal de la Card A y le inyecta el dato a la Card B.
3.  **Homeostasis**: Ninguna tarjeta "mira" el estado global de otra. Son cajas negras que procesan entradas y devuelven salidas.

---

## 5. HOJA DE RUTA PARA EL FIN DE SEMANA

### Fase 1: La Gran Extracción
- [ ] Crear la estructura de carpetas en `src/components/features`.
- [ ] Mover `FieldMapper.jsx` de `BridgeDesigner` a `features/data-mapping`.
- [ ] Mover `SchemaNexusControl.jsx` a `features/storage`.
- [ ] **REGLA DE ORO**: Actualizar todos los `import` y verificar que el linter no llore.

### Fase 2: Desmonolitización
- [ ] Eliminar la carpeta `macro_engines`.
- [ ] Convertir los antiguos "Designers" en componentes de tipo `Layout` que simplemente orquestan widgets de `features`.
- [ ] Implementar el "Dashboard de Capacidades": Una vista que cambie sus tarjetas según la `class` del átomo seleccionado.

### Fase 3: Limpieza de ADN
- [ ] Actualizar el README.md con las **"Leyes de No-Invención"**.
- [ ] Documentar cada Widget de Élite en el manifiesto.

---

## 6. DIAGRAMA DE FLUJO: INVOCACIÓN DE CAPACIDAD
1. **User** selecciona **Átomo X** en el Fractal Tree.
2. **Dashboard** consulta **Manifest.registry**.
3. **Manifest** devuelve: *"Para Átomo X, inyectar `Capability_A` y `Capability_B`"*.
4. **Layout** monta las tarjetas en el escenario.
5. **Indra** cobra vida sin latencia de carga de motores pesados.

---
**"La arquitectura es el lenguaje de la soberanía. Si el código es esclavo de su estructura, el sistema no es libre."** 🧬 🧪 🔍
