# 🛰️ INDRA OS: El Manifiesto de la Lógica Fundacional

> **Versión:** 3.8 (Elevación HCI V5.3 - Transparencia Operativa)
> **Estatus:** Ley Primigenia (Sello de Invarianza Total)
> **Paradigma:** Arquitectura Transductora (Energía vs. Materia)

---

## 🏛️ 0. PRINCIPIOS AXIOMÁTICOS SUH (ADR-001)
Toda decisión técnica en INDRA OS debe ser filtrada por esta tríada sagrada:
- **Simplicidad (S):** Código atómico y legible. Prohibida la "magia" oscura; claridad sobre brevedad.
- **Universalidad (U):** Componentes agnósticos. Todo dato es una Partícula (`UniversalItem`); todo visual es un Chasis (`Entity`).
- **Armonía (H):** Desacoplamiento total entre Bóvedas (Nivel 2), Flujos (Neutrón) y Satélites (UI).

---

## 1. El Motivo Primigenio (Identidad y Fronteras)
INDRA OS no es un constructor de aplicaciones, ni un SaaS, ni un software de gestión. **INDRA es un Transductor de Realidades.**

**Definición de Identidad:** INDRA es un sistema de orquestación soberana que permite modelar flujos de datos mediante una interfaz física-cognitiva, ejecutando transformaciones en tiempo real (Satélite) y persistencia blindada en servicios de terceros (Core).

---

## 2. Los Axiomas Inmutables

### Axioma 1: Soberanía de Datos y Lobotomía del Front
El usuario es el único dueño de sus datos (GAS, Drive, Notion). El **Satélite (Frontend)** es **Amnésico por Diseño**: no posee memoria persistente propia. 
- **Cierre de Amnesia:** Cualquier dato que sobreviva a un Refresh (F5) sin provenir del Core o del `.session` (vía LocalStorage estrictamente para estados de UI) es una violación axiomática.

### Axioma 2: El Transductor (Energía vs. Materia)
- **Satélite (Energía - Transformación):** Ejecuta la lógica reactiva (0ms). Es un motor de cálculo visual.
- **Core (Materia - Anclaje):** Ejecuta la persistencia y conexión con "Anclas Reales". 
- **Poder de Veto e Integridad Auditativa:** El Core valida la energía antes de anclarla. Si la validación falla, el Core ejerce veto. 
- **Diferencia de V5.1:** El veto no implica la desaparición del dato (que causaría desorientación), sino su **Transformación en Estado Fantasma (Auditabilidad)**. El Core devuelve el error, y el Satélite proyecta el rechazo mediante el interactor físico (Shake) y la desaturación visual, manteniendo la integridad de la sesión para rectificación humana.

### Axioma 3: Ergonomía Cognitiva (La Interfaz Física)
La interfaz es funcional-kinestésica. La belleza es un subproducto de la claridad física. Todo elemento visual debe representar un estado de flujo o una conexión lógica real.

### Axioma 4: Transparencia Operativa (Autodocumentación)
El sistema debe ser auto-explicativo. El Satélite proyecta la intención técnica de cada componente a través del **Aether Ribbon**. 
- **Verdad Identitaria:** Ninguna acción debe ser un misterio. Si el código ejecuta una transmutación, la UI debe describir dicha transmutación al operador mediante el sistema de Hover.
- **Auditabilidad en Caliente:** El operador tiene derecho a ver la "fontanería" (Neutrón) sin salir de la experiencia de uso.

### Axioma 4: Canonicidad de Artefactos (La Ley de la Estrategia Maestra V1.0)
El sistema se rige por una jerarquía de archivos estancos. Ningún proceso de codificación puede crear o modificar estados fuera de esta matriz:

### Jerarquía de Existencia (La Tríada de Contexto)
1. **Workspace:** Dónde estoy (Mapa de IDs).
2. **Project:** Qué estoy editando (Canvas Visual).
3. **Session:** Estado efímero de mi interacción (Runtime).

#### La Tabla de Canonicidad (Actualizada V4.0)


| Extensión | Dharma (Propósito Sagrado) | Requerimiento Axiomático (La Ley) | Límite de Entrada (Input) | Límite de Salida (Output) | Nota para el Desarrollador (Dev-Note) |
|-----------|----------------------------|-----------------------------------|---------------------------|---------------------------|---------------------------------------|
| **.workspace** | **Universo Físico (Contexto):** Mapa de Resolución de Identidad. | **Invarianza de Contenido:** Solo contiene un mapa JSON `{ "uuid": "drive_id" }`. NUNCA contiene lógica de negocio ni estado visual. | Manifiesto del Core. | Direcciones de Memoria Física. | Es el "GPS" del sistema. No es una carpeta, es un mapa de coordenadas. |
| **.project** | **Lienzo Visual (Canvas):** Estado persistente del grafo de nodos. | **Persistencia de Autoría:** Guarda la posición (x,y), conexiones y configuración de nodos. | Interacciones de Diseño en Reality. | Archivo `.project.json` en Drive. | Es lo que el usuario llama "Mi Automatización". Contiene la Verdad Visual. |
| **.session** | **Conciencia Efímera:** Estado runtime (Cosmos). | **Volatilidad Mandataria:** Vive solo en memoria (Amnesia). Se hidrata desde el `.project` al cargar. | Input de Usuario (Ratón, Teclado). | Feedbacks Visuales (Hover, Selección). | Si cierras la tab, muere. No debe guardar nada crítico. |
| **.sys** | **Constitución:** Hardware lógico y leyes físicas. | **Génesis Auto-Sanadora:** Si el archivo no existe, el Kernel debe proyectarlo desde sus Defaults. | Definiciones de contrato y catálogos de métodos. | Gobierna la validación sintáctica del Kernel. | Archivos protegidos. La UI solo tiene permiso de lectura (BIOS). |
| **.layout** | **Eidos Fractal:** Manifestación física y puntos de contacto. | **Dharma de Permiso:** Cada slot debe definirse como READ (Eidos), WRITE (Soma) o EXECUTE (Logos). | Geometría milimétrica (mm) y Mapeo de Atributos. | Proyecta la interface interactiva y documentos. | El 100% de la visualización depende de este archivo. |
| **.flow** | **Lógica Compilada:** El resultado ejecutable del Proyecto. | **Desacoplamiento Visual:** NO contiene coordenadas x,y. Solo la secuencia lógica para el Orquestador (Neutron). | Compilación del `.project`. | Ejecución en Core. | El usuario diseña Proyectos; el sistema ejecuta Flows. |
| **.logic** | **Cerebro Agnóstico:** Criterios de verdad y síntesis. | **Ceguera Funcional:** Invarianza de Predicado. Solo conoce los argumentos de su firma. **Prohibido el acceso a datos externos o APIs.** | Reglas de comparación y fórmulas matemáticas. | Devuelve booleanos o valores sintetizados (KPIs). | Es una librería reutilizable. Un `.logic` puede servir a 100 `.layouts`. |
| **.recipe** | **Átomo de Negocio:** Plantillas de Materia Estructurada. | **Invarianza de Definición:** Prohibido incluir lógica de decisión. Solo describe "qué es" el objeto (BOM). | Listas de IDs, Cantidades y Atributos estáticos. | Configuración de entrada para Nodos Adaptadores. | Evita usar un `.flow` para representar materia estática. Es el ADN del objeto. |
| **.cache** | **Rastro de Memoria:** Aceleración de la manifestación. | **Verdad Desechable:** El sistema debe operar al 100% si este archivo es eliminado (Re-hidratación). | Pares ID/Nombre y Timestamps de resolución. | Hidratación instantánea de identidades humanas. | Posee un "Shadow Cache" local para garantizar legibilidad en modo offline. |

#### Axioma 4.1: Desacoplamiento de Persistencia (Project != Flow)
El error histórico de conlfictuar "Lógica" con "Visualización" queda erradicado.
- El **.project** guarda dónde pusiste el nodo en la pantalla.
- El **.flow** es el código máquina que ejecuta la automatización.
- El **.session** es tu cursor moviéndose ahora mismo.

### Axioma 5: Anticipación (Carga en Cascada)
Para destruir la "Estática Gris" del lag, el sistema implementa la **Pre-carga Progresiva**. 
- **Sincronía Silenciosa:** En cuanto se abre un Workspace, el Core inicia el envío de índices (IDs y nombres) al Satélite en segundo plano. 
- **Efecto de Verdad:** Esto permite que la búsqueda y el autocompletado operen a **120Hz (instantáneo)** sobre el caché de identidades, mientras el dato pesado (Materia) permanece anclado en el Core hasta su invocación explícita.

### Axioma 6: Separación Radical de Presentación (Renderer Node Architecture)
El sistema distingue **dos categorías de nodos** con responsabilidades completamente diferentes:

#### Categoría A: Nodos de Lógica/Procesamiento
- **Dharma:** Procesar, transformar, filtrar, validar datos
- **Ubicación:** Viven SOLO en **Reality** (Graph Editor)
- **Naturaleza Visual:** Cajas configurables con puertos y campos editables
- **Visibilidad en Output:** **NINGUNA**. Son invisibles para el usuario final
- **Ejemplos:** notionAdapter, driveAdapter, errorHandler, flowRegistry, configurator
- **Analogía:** El "backend invisible" del flujo de datos

#### Categoría B: Renderer Node (Nodo Diseñador Universal)
- **Dharma:** Transformar datos en presentación visual (Formularios y Documentos)
- **Naturaleza:** Motor de diseño gráfico tipo **Figma** embebido
- **Operación:** Doble-click en el nodo → Abre canvas interno 2D con:
  - Sistema de capas jerárquico
  - Auto-layout engine (flexbox)
  - Data binding dinámico (`{{expression}}`)
  - Componentes: Text, Input, Shape, Image, Table
  - Reglas milimétricas, guías magnéticas
  - Paginación automática

**Capacidad Dual del Renderer:**
1. **Modo Formulario (INPUT Layer):**
   - Diseñas formularios interactivos
   - Se guardan como `.layout`
   - Eidos los ejecuta en runtime cuando el usuario hace click en el `.layout`

2. **Modo Documento (OUTPUT Layer):**
   - Diseñas PDFs/reportes/certificados
   - Se exportan a Drive/Notion
   - **NO** se renderizan en Eidos

**Regla de Oro Renderer:** 
- **TODO el diseño visual** (grids, fonts, colors, spacing) vive ÚNICAMENTE dentro del Renderer Node
- Reality NO tiene lógica de diseño gráfico
- Eidos NO diseña; solo ejecuta formularios ya diseñados

**Flujo de Trabajo Típico:**
```
1. Reality: Usuario crea Renderer Node
2. Doble-click → Abre canvas tipo Figma
3. Diseña formulario "RegistroCliente" con inputs y dropdowns
4. Guarda como "RegistroCliente.layout"
   ↓
5. Source Explorer shows "RegistroCliente.layout"
6. Usuario hace click en "RegistroCliente.layout"
   ↓
7. EIDOS se activa mostrando el formulario interactivo
8. Usuario llena datos → Capturados en Amnesia
   ↓
9. Datos alimentan otro Renderer (para PDF)
10. PDF se genera y exporta a Drive
```

### Axioma 15: Universalidad del Dato (Dharma del Protocolo V5.0)
> **"Un Solo Protocolo para Gobernarlos a Todos."**
El sistema prohíbe la fragmentación de lógicas de datos entre módulos. 
- **El Tejedor Central (`DataBinder.js`):** Existe un único motor matemático agnóstico que resuelve expresiones `{{...}}`. 
- **Consumo Universal:** El `Renderer Node` (Firma Visual), el `GmailTerminal` (Comunicación) y el `SheetTerminal` (Persistencia) deben usar exactamente el mismo hook (`useDataBinder`) para resolver la realidad.
- **Diferencia Crítica:** Un nodo no es "especial" por cómo procesa el dato, sino por cómo lo manifiesta (Email vs. Gráfico). La resolución de la variable es sagrada e idéntica en todo el Cosmos.

---

## 3. Perfil del Usuario: El Autor de Realidades
INDRA está diseñado para el Usuario de Herramientas de Autoría. Requiere capacidad de modelado lógico (estilo Blender/TouchDesigner), no sintaxis de código.
- **Autoría Declarativa:** El usuario conecta intenciones y modela flujos. Se prohíbe el scripting imperativo o la ejecución de algoritmos arbitrarios en el Satélite.

---

## 4. Ancla de Invarianza (Protocolo de Rechazo)
Toda propuesta de desarrollo será **rechazada** si:

1.  Intenta mover la persistencia al Satélite.
2.  **Desacoplamiento de Plano:** Crea elementos de interfaz en el Satélite que no estén mapeados a una propiedad en un artefacto canónico definido en la matriz de la Estrategia Maestra.
3.  Intenta que el Core realice tareas de renderizado o lógica reactiva de UI.

---
*Fin de la v3.6 - Validada por el Investigador Escéptico (Cierre de Diamante)*
