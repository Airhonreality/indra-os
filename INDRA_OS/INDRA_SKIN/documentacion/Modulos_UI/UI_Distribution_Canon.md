# Canon de Distribución de Realidad UI (Indra OS)

Este documento establece la **Ley de Coexistencia Visual** para los 9 módulos originales (OMD) del ecosistema Indra. La arquitectura busca el equilibrio entre la *Soberanía del Usuario* y la *Densidad de Información*.

---

## 🏛️ 1. El Horizonte Fijo (Nivel 3: Backbone)
Los elementos del "Nivel 3" proporcionan el marco de referencia constante. No escalan, solo existen.

### [OMD-04] Neural Copilot (El Susurro)
- **Ubicación:** Centro de la `TOP_BAR_SYSTEM`.
- **Dimensiones:** Ancho variable (400px - 600px), Altura máxima 40px.
- **Comportamiento:** Comanda la atención mediante una barra de búsqueda/comandos híbrida. Es el punto de entrada para la IA.
- **Armonía:** Al estar centrado, actúa como el "tercer ojo" entre el menú de sistema y la identidad.

### [OMD-02] The Vault (La Identidad)
- **Ubicación:** Extremo derecho de la `TOP_BAR_SYSTEM`.
- **Dimensiones:** Slot de 200px.
- **Comportamiento:** Muestra el avatar de soberanía y el estado de la Wallet. Al hacer clic, se despliega un panel lateral (Drawer) sobre la Sidebar derecha.
- **Armonía:** Su posición es "terminal", indicando que es el cierre de la cadena de mando (quién autoriza).

### [OMD-06] The Trace (El Pulso)
- **Ubicación:** `TERMINAL_STATUS` (Footer).
- **Dimensiones:** Altura fija de 32px.
- **Comportamiento:** Stream horizontal de logs técnicos. En caso de error crítico (`FORCE_EXPAND`), puede subir hasta 200px.
- **Armonía:** Ancla el sistema al suelo técnico. Proporciona confianza sin robar espacio de trabajo.

---

## 📂 2. Los Miembros Operativos (Sidebars)
Ejes de interacción que pueden colapsar para maximizar el foco.

### [OMD-07] The Archivist (La Memoria)
- **Ubicación:** `SIDEBAR_PRIMARY` (Izquierda, Superior).
- **Dimensiones:** Ancho fijo de 320px.
- **Comportamiento:** Árbol de proyectos y artefactos. Es el origen de la materia.
- **Armonía:** Se sitúa a la izquierda porque el flujo de lectura occidental empieza aquí: de la memoria (archivo) a la acción (lienzo).

### [OMD-08] The Catalog (La Potencia)
- **Ubicación:** `SIDEBAR_PRIMARY` (Izquierda, Inferior o Pestaña).
- **Dimensiones:** Comparte los 320px de ancho con el Archivador.
- **Comportamiento:** Biblioteca de bloques y herramientas.
- **Armonía:** Coexiste con el Archivador. Mientras el Archivador es "lo que tengo", el Catálogo es "lo que puedo hacer".

### [OMD-05] The Senses (El Inspector)
- **Ubicación:** `SIDEBAR_SECONDARY` (Derecha).
- **Dimensiones:** Ancho fijo de 380px.
- **Comportamiento:** Aparece solo cuando hay una entidad seleccionada.
- **Armonía:** Su mayor ancho (380px vs 320px) se debe a que la edición de propiedades requiere más densidad visual que la navegación de archivos. Se sitúa a la derecha como "reacción" a lo seleccionado en el centro.

---

## 🌌 3. El Vacío Infinito (The Core Workspace)
Donde ocurre la transformación de la realidad.

### [OMD-03] The Canvas (El Maestro)
- **Ubicación:** `CANVAS_MAIN`.
- **Dimensiones:** Dinámicas (100% del espacio restante).
- **Comportamiento:** Motor de grafos y nodos.
- **Armonía:** Es el pulmón del sistema. Se expande cuando las Sidebars se colapsan, permitiendo una inmersión total en la orquestación.

### [OMD-09] The Architect (El Diseñador UI)
- **Ubicación:** Capa superior de `CANVAS_MAIN`.
- **Dimensiones:** Ocupa el mismo slot que el Canvas.
- **Comportamiento:** Se activa mediante un "Modo de Transmutación". Cambia los controles de ejecución por controles de diseño.
- **Armonía:** No choca con el Canvas; lo habita. Es una perspectiva diferente de la misma materia.

---

## 🔐 4. El Velo (Overlay)

### [OMD-01] Portal Access (La Frontera)
- **Ubicación:** `AUTH_OVERLAY`.
- **Dimensiones:** 100vw / 100vh.
- **Comportamiento:** Impide cualquier interacción hasta que la soberanía es validada.
- **Armonía:** Es el único módulo que rompe la armonía intencionalmente para forzar el foco en la seguridad.

---

---

## 🧠 5. Principios de Ergonomía Cognitiva (Auditoría Doctoral)

Para garantizar la **Soberanía Mental**, la interfaz debe respetar los límites del procesamiento humano:

### Reducción de la Carga Cognitiva (Ley de Hicks)
- **Divulgación Progresiva:** Los módulos secundarios (como el Inspector OMD-05) permanecen colapsados hasta que el usuario genera una intención clara (selección). Esto mantiene la carga de memoria de trabajo por debajo del límite de Miller (7±2 elementos).
- **Entropía Negativa:** La interfaz tiende al orden absoluto mediante el uso de slots fijos, eliminando la incertidumbre espacial.

### Optimización del Flujo (Estado de Flow)
- **Transiciones Neuronales:** Todas las animaciones de despliegue deben durar **300ms**. Este es el estándar de respuesta neuronal; una duración menor se percibe como un parpadeo (incertidumbre) y una mayor como lentitud (frustración).
- **Fóvea Central:** El Copilot (OMD-04) está centrado para minimizar los "saltos sacádicos" (movimientos oculares) entre el área de trabajo y la asistencia IA.

### Monitorización Periférica
- **Atención Pasiva:** El Trace (OMD-06) en el footer permite que la "Visión Periférica" detecte actividad del sistema sin que la "Atención Ejecutiva" tenga que abandonar el Canvas.

---

## 📐 Tabla de Dimensiones Canónicas (Refinada)

| Módulo | Slot | Ancho (W) | Alto (H) | Comportamiento Cognitivo |
| :--- | :--- | :--- | :--- | :--- |
| OMD-01 | OVERLAY | 100% | 100% | Interrupción Focalizada |
| OMD-02 | TOP_BAR | 210px | 60px | Reconocimiento de Identidad |
| OMD-03 | CANVAS | Flex | Flex | Estado de Flow Inmersivo |
| OMD-04 | TOP_BAR | 500px | 40px | Asistencia de Baja Distancia |
| OMD-05 | SIDE_SEC | 380px | 100% | Reacción a la Intención |
| OMD-06 | FOOTER | 100% | 32px | Monitorización Periférica |
| OMD-07 | SIDE_PRI | 320px | 50%* | Recuperación de Memoria |
| OMD-08 | SIDE_PRI | 320px | 50%* | Adquisición de Potencia |
| OMD-09 | CANVAS | 100% | 100% | Transmutación de Realidad |





