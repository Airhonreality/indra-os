# 🎓 LEARNING CURVE: INDRA SPATIAL KERNEL (ISK)
## El Arte de la Reificación Reactiva

> **VERSIÓN**: 1.0.0
> **AUDIENCIA**: Desarrolladores de Sistemas y Visualización

---

## 1. EL CAMBIO DE PARADIGMA
En el desarrollo web tradicional, pintamos elementos en el DOM o SVG. En el **ISK**, no pintamos elementos; **proyectamos leyes**.

*   **Paso 1**: Defines una "Ley Espacial" (DNA).
*   **Paso 2**: El motor la compila (JIT).
*   **Paso 3**: El motor la manifiesta en la GPU (Reificación).

---

## 2. EL FLOW DEL FOTÓN (Pipeline L1-L2-L3)

Para entender el ISK, debes entender cómo viaja el dato desde el Core hasta el píxel:

### 🧠 L1: La Intención (CPU / Worker)
Aquí vive el **Expression Engine**. 
1. El Core envía un estado (ej: `core.power: 80`).
2. El `SpatialWorker` recibe el estado y ejecuta las funciones compiladas (JIT).
3. Calcula las posiciones y atributos finales (x, y, radius, etc.).
4. **Beneficio**: Si el cálculo es pesado, el ratón del usuario no se traba (60fps UI).

### 🌉 L2: El Puente (Main Thread / Texture memory)
Los datos calculados en el Worker regresan al hilo principal.
1. El `ProjectionKernel` recibe los resultados.
2. Codifica estos números en una **Data Texture** (una imagen invisible de 128x128 donde cada píxel guarda datos de un objeto).
3. El `IntegrityBoundary` verifica que no falten datos cruciales.

### 🎨 L3: La Manifestación (GPU / WebGL2)
La GPU toma la textura y hace magia.
1. **Instanced Rendering**: Dibujamos 10,000 objetos con una sola orden.
2. **Intrinsic Interpolation**: Si el Worker tarda un poco, el Shader hace un "suavizado" (lerp) automático para que el movimiento sea perfecto.
3. **Vertex Shader**: Lee la textura, posiciona el objeto y lo escala.

---

## 3. CONCEPTOS CLAVE PARA EL DEV

### `SpatialLaw.json`
Es el contrato de "qué" quieres ver. No escribas JS aquí, escribe expresiones `{{ ... }}`. El motor se encarga del resto.

### `Object Pool` (Reciclaje)
Si desaparece un sensor, el ISK no borra el objeto de memoria (eso causaría tirones/GC). Simplemente lo apaga (`isActive: false`) y lo guarda para cuando aparezca un sensor nuevo.

### `IntegrityBoundary`
Si tu diseño rompe el sistema porque el Core cambió un nombre, verás una alerta en el HUD. No entres en pánico; es el firewall avisándote que el contrato de datos se ha roto.

---

## 4. CONSEJOS DE OPTIMIZACIÓN
1. **GPU-First**: Si puedes hacer una animación con un Seno/Coseno en la expresión, hazlo. La GPU es mil veces más rápida que la CPU para esto.
2. **Evita la Lógica Pesada en el DNA**: La lógica de negocio pertenece al Core. El ISK es para manifestar datos, no para decidir el destino del universo.
3. **Usa el Auditor**: Si el HUD dice `EXPLOITATION_WARNING`, significa que estás pidiendo datos al Core que no estás dibujando. Limpia tus leyes para ahorrar ancho de banda.
