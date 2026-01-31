Investigación 1
------
------


La combinación más usable para un editor de nodos denso suele ser: zoom-to-cursor, canvas 2D virtualizado (o WebGL) con culling agresivo, ortogonal para flujos L→R y splines con bundling para “spaghetti”, más badges compactos por cuenta para contexto multi‑account.[1][2][3][4]

***

## Cámara y zoom

- **Zoom-to-cursor** se percibe como más directo en espacios grandes porque el usuario siente que “acerca la lupa” sobre donde mira; es el patrón de herramientas de tablero infinito como Miro (pinch/rueda centrado en el foco táctil/cursor). Figma ha tenido peticiones explícitas para mejorar el zoom hacia el cursor, lo que indica que el centrado fijo frustra en flujos de edición fina.[4][5]
- Para UX de nodos complejos, zoom-to-center tiene sentido solo en acciones discretas (por ejemplo, “Fit to selection” o “Center on node actual”), mientras que la interacción continua con rueda/gestos debería ser zoom-to-cursor para minimizar paneos adicionales.[5][4]

- Con 30+ nodos, el cuello de botella real suele ser la cantidad de elementos DOM/React más que el cálculo de cámara. Librerías modernas de visualización introducen una capa de escena y actualizaciones reactivas para minimizar diffs de layout, reduciendo recomputaciones al cambiar escala y posición.[6]
- Para React tienes tres patrones robustos:
  - Canvas/WebGL para el “wiring layer” (todas las edges) y DOM solo para nodos interactivos.
  - Virtualización por “viewport” (solo renderizar nodos/edges dentro y justo alrededor de la cámara) con culling duro fuera de bounds.
  - Agrupar geometría en una escena reactiva que se actualiza en lote en lugar de disparar setState por nodo/edge individual.[6]

***

## Conexiones: routing y snapping

- Layouts ortogonales en cuadrícula reducen ruido visual cuando la prioridad es seguir flujos claros y minimizar cruces y dobleces, lo que encaja bien con flujos L→R tipo automatización. Son ideales cuando los nodos representan pasos discretos en pipelines y el usuario espera “esquemáticos” claros.[2]
- Splines (Bézier) son preferibles cuando las conexiones son muy numerosas y las rutas exactas importan menos que la percepción de grupos de flujo; técnicas de edge bundling sobre curvas se usan explícitamente para reducir el desorden en grafos densos. En contextos de “10+ cables cruzándose” el bundling spline ayuda a percibir “corrientes” visuales, a costa de precisión geométrica.[7][1]

- Experiencias en editores de nodos muestran radios de snapping en el rango de unos 15–20 píxeles de la manija/puerto como razonables para que la conexión “salte” sin sentirse tosca. Algunos usuarios reportan que, con handles pequeños, un radio de unos 20 px ya da la sensación de “auto‑enganche” correcto, siempre que la acción no dispare otros gestos (como añadir nodos) dentro de ese radio.[8]
- UX fina suele combinar:
  - Hitbox visual pequeña pero área de captura algo mayor (ej. handle de 8 px, hitbox de ~20 px).
  - Feedback anticipado (resaltar puerto objetivo al entrar en radio).
  - Tolerancia dependiente del nivel de zoom (en zoom lejano, radio en píxeles algo mayor para compensar precisión del puntero).  

***

## Organización: layout y densidad

- Layout ortogonal L→R reduce cruces y dobleces y tiende a generar diagramas compactos y legibles para flujos dirigidos, objetivo explícito de los motores de layout ortogonal. Los métodos tipo Sugiyama (layered) están diseñados justamente para grafos dirigidos acíclicos donde se quiere una dirección principal (por ejemplo, de izquierda a derecha) con pocas inversiones de flujo.[2][7]
- En grafos densos, combinar un layout layered (Sugiyama) con rutas ortogonales y reglas de cruce/etiquetado produce diagramas de flujo más claros que un force‑directed “puro”, que suele ser mejor para exploración de redes donde la dirección del flujo no es tan importante.[7][2]

- Herramientas como ComfyUI agrupan nodos relacionados en grupos/“node groups” con fondo compartido y título, permitiendo encapsular secciones de workflows complejos dentro de contenedores visuales. Estos grupos también pueden llevar badges de origen/ID, lo que ayuda a rastrear qué paquete o categoría de nodo se está usando en regiones densas de la gráfica.[9][3]
- Node‑RED y entornos similares usan backdrops o grupos con:
  - Rectángulo de fondo ligeramente tintado.
  - Etiqueta grande de grupo.
  - Opcionalmente, colapso/expandir el grupo para combatir el “spaghetti”.  
  Esta combinación de color + título + posibilidad de colapsar es el patrón que mejor conserva orientación cuando se escala el grafo.  

***

## Contexto multi‑account

- En ComfyUI, los nodos pueden mostrar badges con información de procedencia (ID, fuente, tipo de nodo), usando iconos o etiquetas cortas en la parte superior del nodo. Este patrón es transferible a multi‑account: badge pequeño, persistente, cerca del título del nodo.[3][9]
- Para un flujo con 3 cuentas de Notion, un esquema robusto suele combinar:
  - Color de badge consistente por cuenta (máx. 3–4 colores para no saturar).
  - Icono de proveedor (logo de Notion) fijo para todos, y la cuenta diferenciada por color + iniciales/alias dentro del badge.
  - Opcionalmente, un borde sutil que herede el mismo color de cuenta solo en hover o selección, para no sobrecargar la vista en zooms bajos.[3]

- En niveles de zoom muy bajos (ej. 0.2x), la semántica debe degradarse: labels de texto completos se vuelven ilegibles, por lo que técnicas de semantic zooming consisten en mostrar solo marcas agregadas (iconos, colores, contadores) en lugar de texto. En la práctica, esto implica colapsar nombres de nodos a iconos y badges mínimos por cuenta a bajas escalas, expandiendo a labels completos solo cuando el nivel de zoom supera cierto umbral.[6]

----
Investigación 2
----
Arquitectura de Interacción y Optimización de Rendimiento en Editores de Nodos de Alta Densidad: Un Análisis de Físicas UX y EscalabilidadEl diseño de interfaces para la edición de grafos y flujos de trabajo basados en nodos ha evolucionado de ser una herramienta de nicho en la ingeniería de software a convertirse en el estándar de facto para la creación visual, la automatización y la inteligencia artificial generativa. Esta transición ha impuesto demandas sin precedentes sobre la experiencia de usuario (UX) y la infraestructura técnica subyacente. En entornos donde la densidad de nodos supera las decenas o cientos de elementos interconectados, la eficiencia de la navegación, la claridad de las conexiones y el rendimiento del renderizado determinan la viabilidad de la herramienta. El presente reporte analiza exhaustivamente los pilares fundamentales que sostienen estas interfaces, desde la física del movimiento de cámara hasta la gestión de identidades en flujos multi-cuenta.Análisis del Comportamiento de Cámara y NavegaciónLa relación entre el usuario y el lienzo infinito es la base de cualquier editor de nodos exitoso. La capacidad de transitar fluidamente entre una visión global estratégica y una edición de parámetros microscópica depende de la implementación precisa de las mecánicas de zoom y desplazamiento.Estándares de Zoom: Zoom-to-Cursor frente a Zoom-to-CenterEn la investigación de herramientas líderes de la industria como Figma, Miro y Blender, se observa una convergencia hacia el modelo de Zoom-to-Cursor (zoom hacia la posición del ratón) como el estándar de oro para la manipulación de grafos. Este mecanismo utiliza la posición del puntero como el punto fijo de una transformación geométrica, permitiendo que el usuario "apunte y descienda" hacia un objetivo específico sin necesidad de realizar maniobras de paneo adicionales.1En Figma, el sistema de navegación está optimizado para la velocidad. Los usuarios disponen de atajos como Shift + 1 para ajustar el zoom a todo el contenido de la página, proporcionando una visión de conjunto instantánea, y Shift + 2 para centrarse exclusivamente en los elementos seleccionados.3 Sin embargo, la interacción más frecuente —el uso de la rueda del ratón o el gesto de pellizco en un trackpad— sigue estrictamente la posición del cursor. Esta decisión de diseño minimiza la carga cognitiva, ya que el ojo del usuario ya está enfocado en el área de interés antes de iniciar la acción de zoom.Blender ofrece una perspectiva técnica más profunda sobre las implicaciones de estas mecánicas. En sus preferencias de navegación, permite habilitar el "Zoom to Mouse Position" junto con el "Auto Depth".1 La ausencia de estas funciones puede resultar en una experiencia frustrante donde el zoom parece "bloquearse" o ralentizarse al acercarse al centro matemático de la vista 3D o del editor de nodos, incluso si el objeto de interés está todavía lejos.2 El uso de "Auto Depth" permite que el software calcule la distancia real hasta el objeto bajo el cursor, garantizando que el incremento de zoom sea proporcional a la profundidad visual, lo que evita que la cámara atraviese el objeto o se detenga prematuramente.2AplicaciónComportamiento por DefectoAtajos de AjusteOptimización de ProfundidadFigmaZoom hacia el cursorShift + 1 (Todo), Shift + 2 (Selección)No (Entorno 2D)MiroZoom hacia el cursorCtrl + 1 (Ajustar a pantalla)No (Entorno 2D)BlenderConfigurable (Preferido: Cursor)Home (Todo), Numpad. (Selección)Sí ("Auto Depth")La preferencia por el zoom hacia el cursor en editores de nodos se justifica por la naturaleza no lineal de los grafos. A diferencia de un documento de texto donde el flujo es mayoritariamente vertical, un grafo se expande orgánicamente en todas las direcciones. Centrar el zoom en el medio de la pantalla obligaría al usuario a un ciclo repetitivo de "zoom-pan-zoom", lo que interrumpe el flujo de trabajo y aumenta la fatiga motora.2Estrategias de Renderizado y Optimización en Entornos ReactCuando la complejidad de un grafo escala más allá de los 30 nodos con conexiones densas, el motor de renderizado del navegador comienza a mostrar limitaciones. En el ecosistema de React, esto se manifiesta como un retraso perceptible (lag) durante el arrastre de nodos o el paneo de la cámara. La optimización requiere un análisis de la tecnología de dibujo y las técnicas de gestión del DOM.Culling de Visión y VirtualizaciónEl "viewport culling" o descarte por campo de visión es una técnica crítica que consiste en omitir el proceso de renderizado para aquellos elementos que se encuentran fuera de las coordenadas actuales de la cámara. Librerías como React Flow implementan esto mediante la propiedad onlyRenderVisibleElements.6 Al activar esta opción, el sistema calcula el área de ocupación (bounding box) de cada nodo y conexión; si no intersecta con el rectángulo visible del viewport, el elemento se desmonta del DOM o se oculta, liberando recursos de memoria y ciclos de CPU.La virtualización, común en el manejo de listas largas, se aplica de forma más compleja en los grafos. En lugar de simplemente ocultar, la virtualización reutiliza los nodos del DOM existentes para representar nuevos datos a medida que el usuario se desplaza, minimizando la creación y destrucción de objetos, procesos que son particularmente costosos en React.7Comparativa de Tecnologías: SVG, Canvas y WebGLLa elección de la tecnología de renderizado base define el techo de rendimiento de la aplicación. Para grafos de alta densidad, las opciones presentan ventajas y compromisos claros:SVG (Scalable Vector Graphics): Es la opción por defecto en herramientas como React Flow por su facilidad de estilización mediante CSS y su integración nativa con el modelo de eventos de React. Sin embargo, dado que cada nodo y cada cable es un nodo individual en el DOM, el rendimiento decae rápidamente cuando se superan los pocos cientos de elementos.9Canvas 2D: Al renderizar el grafo como un mapa de bits único, el navegador solo gestiona un elemento en el DOM, permitiendo manejar decenas de miles de puntos sin degradación significativa del rendimiento. El costo es la pérdida de la interactividad nativa de React, lo que obliga a implementar manualmente el "hit-testing" para detectar clics y hovers.9WebGL: Utiliza la aceleración por hardware de la GPU. Es la solución definitiva para visualizaciones masivas (millones de puntos), pero su implementación para interfaces de nodos interactivas es extremadamente compleja y suele reservarse para visualizaciones de datos puros más que para editores de lógica.9Para una aplicación en React con más de 30 nodos pero con expectativas de crecimiento, la recomendación técnica es mantener los nodos interactivos en el DOM (SVG/HTML) para facilitar la edición, pero delegar el fondo y las conexiones —que son los elementos más numerosos y costosos de dibujar— a una capa de Canvas 2D puro.9TecnologíaLímite de Elementos (Fluido)Facilidad de EstilizaciónInteractividad NativaSVG< 500-1,000Muy Alta (CSS)SíCanvas 2D10,000 - 50,000Media (Imperativa)NoWebGL> 100,000Baja (Shaders)NoLímites de Escala y Zoom SemánticoLa legibilidad es el primer sacrificio de la escala. En niveles de zoom mínimos, como 0.2x o menores, las etiquetas de texto (labels) se vuelven indescifrables, convirtiéndose en "ruido" visual. El Zoom Semántico propone una solución basada en la transformación del significado visual en lugar de una simple reducción de tamaño.Mecanismos de Zoom SemánticoEl Zoom Semántico altera la estructura y el nivel de detalle de los objetos basándose en la escala espacial.13 En lugar de ver una versión miniaturizada e ilegible de un nodo, el usuario ve una representación alternativa que conserva la utilidad conceptual:Nivel de Detalle (1.0x): Visualización completa de inputs, outputs, títulos, descripciones y widgets de control.Nivel de Resumen (0.5x): Se ocultan los widgets y descripciones. Solo permanecen el título del nodo y iconos de estado.Nivel Icónico (0.2x): El nodo se convierte en un glifo o color sólido que representa su categoría (ej. azul para datos, rojo para lógica). Las etiquetas de texto se eliminan para evitar el solapamiento y el parpadeo visual.15Esta técnica se apoya en el principio de "detalles bajo demanda".13 Herramientas de investigación como Sensecape demuestran que, al hacer zoom hacia afuera, la transición de "Texto Completo" a "Resumen" y finalmente a "Palabras Clave" permite al usuario identificar estructuras de alto nivel sin perderse en la micro-información.16 La implementación técnica suele basarse en umbrales de ancho de píxeles: si un nodo mide menos de 40px en pantalla, el texto se renderiza como una línea gris (greeking) o se elimina por completo.15Pilar de Conexiones: Enrutamiento y Mitigación de RuidoLos cables o conexiones son las venas de un editor de nodos. En grafos de alta densidad, el cruce descontrolado de líneas crea el fenómeno conocido como "código espagueti", que degrada severamente la capacidad del usuario para trazar la lógica del flujo.Enrutamiento Manhattan frente a Splines de BézierLa disputa entre líneas rectas ortogonales (Manhattan) y curvas suaves (Bézier) no es solo estética, sino funcional y cognitiva.El Enrutamiento Manhattan (u ortogonal) utiliza exclusivamente segmentos horizontales y verticales con giros de 90 grados. Es la norma en el diseño de circuitos impresos y diagramas de arquitectura.18Ventajas: Mantiene una rejilla visual limpia y facilita la alineación con los bordes de los nodos. Es ideal para layouts jerárquicos donde el flujo es estrictamente unidireccional.18Desventajas: Requiere algoritmos de búsqueda de caminos (como A*) más complejos para evitar que los cables atraviesen otros nodos, lo que puede aumentar el número de "codos" o quiebres, incrementando la carga visual.22Las Curvas de Bézier (o Splines) utilizan funciones paramétricas para crear trayectorias suaves entre puertos.Ventajas: Son más rápidas de procesar visualmente para el ojo humano, que es experto en seguir trayectorias orgánicas.23 Reducen el número de puntos de inflexión visual.Desventajas: En densidades extremas, los cruces en ángulos agudos pueden hacer que sea imposible distinguir qué cable pertenece a qué puerto.24Reducción del Ruido Visual en Cruces MasivosCuando se deben cruzar 10 o más cables, se recomiendan las siguientes estrategias de diseño:Edge Bundling (Agrupamiento de bordes): Las conexiones que comparten una dirección similar se "fusionan" en un tronco común antes de separarse hacia sus destinos, similar a un mazo de cables físicos.25Crossover Hops (Puentes): En el enrutamiento Manhattan, se añade un pequeño arco en el punto de intersección de dos cables para indicar explícitamente que no hay una conexión eléctrica o lógica.20Gradientes de Dirección: El uso de un degradado de color desde el puerto de origen al de destino ayuda al ojo a seguir la dirección del flujo sin necesidad de flechas en cada segmento.27Físicas de Conexión y Port SnappingLa "atracción" de un cable hacia un puerto es un momento crítico de la física UX. Una hitbox mal calibrada puede hacer que la conexión se sienta tosca o, por el contrario, demasiado "pegajosa".El Radio de Atracción IdealBasándose en los estándares de accesibilidad de la WCAG, el tamaño mínimo para un objetivo táctil o de puntero es de 24px a 44px.28 En un editor de nodos, donde los puertos suelen ser círculos pequeños de 6px a 10px, es imperativo que la hitbox de snapping sea significativamente mayor que el activo visual.La investigación sugiere que un radio de atracción de 20px a 30px es el equilibrio ideal para el uso con ratón.29 Dentro de este radio, el extremo del cable debe realizar un "salto" magnético hacia el centro del puerto. Este comportamiento debe ir acompañado de un cambio en el estado visual del puerto (ej. un brillo o aumento de escala) para confirmar al usuario que la conexión es válida antes de soltar el botón del ratón.30Organización Algorítmica y Densidad de LayoutEl posicionamiento automático de nodos es esencial para manejar la complejidad. Existen dos familias principales de algoritmos que dominan el campo.Sugiyama Method frente a Force-Directed GraphsPara flujos de automatización que operan de izquierda a derecha (o de arriba abajo), el Método Sugiyama es la elección técnica correcta.18 Este algoritmo organiza el grafo en capas jerárquicas discretas, minimizando los cruces de líneas y asegurando que la mayoría de los cables apunten en la dirección principal del flujo.21 Es el estándar en herramientas de integración como Node-RED y motores de CI/CD.Por el contrario, los Force-Directed Graphs (grafos dirigidos por fuerzas) tratan a los nodos como partículas físicas con repulsión y a los cables como resortes.18Ideal para: Redes sociales, mapas de transporte o descubrimiento de clusters de datos donde no hay una jerarquía clara.Inadecuado para: Lógica de programación o automatización, ya que el resultado es a menudo circular y caótico, dificultando la lectura secuencial de los pasos.21AlgoritmoPropósito PrincipalEstructura ResultanteSugiyamaVisualizar procesos y jerarquíasCapas ordenadas, flujo direccionalForce-DirectedRevelar agrupaciones y simetríasOrgánica, similar a una red neuronalOrthogonalMinimizar el área y los quiebresBasada en rejilla, estilo plano eléctricoAgrupamiento Funcional: Backdrops y SubgraphsHerramientas como ComfyUI y Node-RED utilizan patrones de agrupación para combatir el "caos visual":Backdrops (Grupos): Son áreas rectangulares de color que viven detrás de los nodos. Permiten mover conjuntos de nodos como una sola unidad y proporcionan una etiqueta de alto nivel para esa sección de la lógica.35Subflows / Subgraphs: Permiten colapsar una sección compleja del grafo en un solo nodo con sus propios puertos de entrada y salida, permitiendo la reutilización y la encapsulación de la complejidad.38Pilar de Contexto: Visualización Multi-CuentaEn escenarios de automatización modernos, es común que un usuario maneje múltiples identidades del mismo proveedor (ej. tres cuentas diferentes de Notion). El reto UX es diferenciar estas identidades de forma que el error humano sea minimizado sin saturar la interfaz.Patrones de Identidad en el NodoLa investigación de sistemas de diseño como Lightning (Salesforce) y Base (Uber) ofrece patrones probados para esta diferenciación 40:Badge de Color Dinámico: El borde del nodo o una pequeña barra lateral adopta un color asociado a la cuenta (ej. Azul para la cuenta personal, Púrpura para la cuenta corporativa). El color es la señal visual más rápida de procesar.40Avatar de Cuenta + Icono de Proveedor: El patrón más robusto es colocar el icono del proveedor (Notion) como el elemento principal y superponer un pequeño avatar circular (con foto de perfil o iniciales) en la esquina inferior derecha del icono.40Identificadores de Texto Corto: En el encabezado del nodo, añadir el nombre de la cuenta o el email truncado. Aunque es muy preciso, es el que menos resiste los niveles bajos de zoom.43Patrón UXEficacia VisualResistencia al ZoomCarga CognitivaBadge de ColorAltaMuy AltaMínimaAvatar / InitialsMediaMediaBajaNombre de CuentaMuy AltaBajaAltaPara una implementación óptima en un flujo con 3 cuentas de Notion, se recomienda una combinación de borde dinámico de color (para reconocimiento periférico) y un avatar de iniciales en la esquina del icono (para confirmación de detalle).40Consideraciones Matemáticas y Físicas del Pandeo de CablesLa representación de las conexiones no es solo una línea; es un sistema físico que debe responder a la gravedad y la tensión para sentirse "natural".En las curvas de Bézier cúbicas, la trayectoria se define por la ecuación:$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in $$Donde $P_0$ y $P_3$ son los puertos de origen y destino, y $P_1, P_2$ son puntos de control que deben proyectarse horizontalmente desde el puerto para dar esa sensación de "salida recta" antes de la curva.23 Para evitar que los cables se vean tensos o demasiado flojos, la distancia de los puntos de control debe ser proporcional a la distancia horizontal entre los nodos:$$Distancia\_Control = \max( \text{Distancia\_X} / 2, \text{Valor\_Mínimo} )$$Esta física simple asegura que, incluso cuando los nodos están muy cerca, el cable no realice bucles extraños, manteniendo la legibilidad de la conexión.24Conclusiones Técnicas y RecomendacionesEl diseño de un editor de nodos de alta densidad exitoso es un ejercicio de equilibrio entre la fidelidad visual y el rendimiento computacional. Basándose en la evidencia recopilada, se concluye:Navegación: El estándar indiscutible es el Zoom-to-Cursor apoyado por una física de cámara con "Auto Depth" para evitar bloqueos en el escalado.1Rendimiento: Para grafos interactivos, la hibridación entre un DOM de React para nodos y una capa de Canvas 2D para cables y fondos es la estrategia más escalable, siempre utilizando culling de visión para reducir la carga de renderizado.6Visualización: El Zoom Semántico es vital para mantener la utilidad de la herramienta en visiones globales, transformando el texto ilegible en indicadores cromáticos o icónicos.13Topología: El enrutamiento Manhattan es superior para la claridad estructural en automatizaciones, mientras que las curvas de Bézier son preferibles para flujos creativos y orgánicos.18Identidad: En contextos multi-cuenta, la redundancia visual (color + avatar) es necesaria para prevenir errores críticos de ejecución en flujos complejos.40La implementación de estos pilares no solo mejora la eficiencia operativa del usuario, sino que reduce la fricción psicológica de trabajar con sistemas complejos, transformando el "caos de nodos" en una herramienta de orquestación lógica coherente y poderosa.


-----
----
INvestigaicon 3
----
Se puede pensar el lienzo como un pequeño “mundo físico” donde cada nodo es un cuerpo con puertos, y cada cable es una cuerda dirigida que se engancha por snapping a esos puertos. A nivel práctico, ese mundo se implementa con una cámara (pan+zoom), un sistema de puertos y una máquina de estados para crear y soltar cables.[1][2]

***

## Modelo mental: nodo como objeto físico

- Un nodo es un rectángulo con:
  - Posición \(x, y\) en el lienzo (sistema de coordenadas del mundo).
  - Puertos de entrada y salida (ports) en sus bordes.[1]
- Cada puerto tiene:
  - `id`, `nodeId`, tipo (`input`/`output`), posición relativa dentro del nodo.
  - Opcionalmente tipo de dato (para validar conexiones y colorear).[1]

- Un cable (edge) es:
  - Un segmento dirigido `sourceNodeId/sourcePortId → targetNodeId/targetPortId`.[1]
  - Visualmente, una polilínea o curva Bézier desde el centro del puerto origen al puerto destino.  

***

## Lógica de snapping de cables

- Flujo típico de interacción:
  - `mousedown` en un puerto de salida → se entra en estado “dragging connection”.[2][1]
  - Mientras el ratón se mueve, se dibuja una línea temporal desde el puerto origen hasta la posición del cursor, actualizándose en cada frame.[2][1]
  - En cada movimiento se comprueba si el cursor está dentro del radio de captura de algún puerto de entrada compatible; si sí, se marca como objetivo potencial (highlight).[3][2]
  - `mouseup`:
    - Si hay un puerto objetivo válido, se crea la conexión definitiva.
    - Si no, se cancela o se ofrece una acción secundaria (crear nodo intermedio, etc.).[2][1]

- Radio de captura:
  - El puerto puede verse pequeño (ej. círculo de 8 px) pero su hitbox para snapping debe ser mayor, típicamente 15–20 px, para que el cable “salte” de forma natural al acercarse.[4][3]
  - Conviene hacerlo dependiente del zoom: a 0.2x puedes aumentar el radio en píxeles para compensar menor precisión visual.  

***

## Dirección del cable y sensación de flujo

- La dirección lógica viene del tipo de puerto:
  - De `output` (generalmente en la derecha o abajo del nodo) hacia `input` (izquierda o arriba del siguiente).[1]
- Para que se “sienta” direccional:
  - Usa curvas que salen horizontalmente desde el puerto origen y llegan horizontalmente al destino; esto refuerza de manera visual el sentido L→R.[5]
  - Añade una ligera asimetría al grosor o un triángulo/flecha discreta hacia el final del cable, visible solo en cierto nivel de zoom.  

- En la implementación:
  - Calculas el punto de salida como el centro del puerto más un offset hacia fuera (ej. 6–8 px).
  - La curva Bézier se define con control points desplazados en X en la dirección del flujo (ej. `c1.x = start.x + k`, `c2.x = end.x - k`), lo que crea una curva suave que “tira” hacia adelante.  

***

## Comportamiento físico del nodo (drag, colisión suave)

- Drag de nodo:
  - `mousedown` sobre el cuerpo del nodo → estado “dragging node”.
  - Mientras arrastras, actualizas la posición del nodo y recalculas las posiciones de los puertos; los cables conectados se redibujan porque sus extremos siguen a los puertos.[1]

- Sensación de “objeto físico”:
  - Inercia visual mínima: pequeñas animaciones (interpolación) al terminar un drag para que el nodo “asiente”.
  - Snapping entre nodos: al arrastrar un nodo cerca de otros, puedes activar un “snap to visible nodes” para alinear bordes o centros, como hacen editores de nodos tipo Houdini.[6]

***

## Arquitectura práctica básica

- Datos:
  - `nodes[]` con posición, tamaño, lista de puertos.
  - `edges[]` con referencias a puertos y tipo de conexión.[1]
- Estado de interacción:
  - `mode` = `"idle" | "dragging-node" | "dragging-connection"`.
  - `activeNodeId`, `activePortId`, `hoverPortId`, etc.[3]

- Render:
  - Nodos en DOM/SVG para facilitar interacción (click, hover).
  - Cables en SVG o Canvas (una sola capa) para rendimiento, con una “connection line” temporal mientras arrastras, como hace React Flow.[2]

Con esto tienes un lienzo donde cada nodo es un cuerpo físico con puertos, y los cables se comportan como cuerdas dirigidas que se enganchan por proximidad, con feedback claro y coherente con la dirección del flujo.

--
---
INVESTIGACION 4
---
---

Arquitectura de Interacción y Físicas UX en Editores de Nodos: El Modelo de "Mundo Físico" y Escalabilidad de Datos
El diseño de interfaces para grafos de alta densidad ha trascendido la mera representación visual para convertirse en un sistema de diseño basado en principios de física aplicada. En este modelo, el lienzo no es una superficie estática, sino un "mundo físico" donde los nodos actúan como cuerpos rígidos con puertos de anclaje, y los cables funcionan como cuerdas dirigidas sujetas a fuerzas de atracción y tensión. Este enfoque permite que flujos complejos, con cientos de conexiones, se sientan intuitivos y manejables para el usuario.

1. El Modelo Mental: El Nodo como Cuerpo Físico
Para que un editor de nodos sea predecible, cada elemento debe seguir reglas espaciales consistentes. Bajo este modelo, un nodo se define como un objeto con propiedades físicas y geométricas claras:

Coordenadas del Mundo: Cada nodo posee una posición (x,y) en el sistema de coordenadas global del lienzo, independiente del nivel de zoom de la cámara.

Anclajes Relativos (Puertos): Los puertos de entrada y salida no son elementos aislados, sino puntos de conexión con una posición relativa fija respecto al origen del nodo. Cada puerto hereda metadatos del nodo padre, como el nodeId, el tipo (input/output) y el tipo de dato para validación lógica.

Inercia y Snapping de Cuerpo: Al arrastrar un nodo, la implementación de una inercia visual mínima o una interpolación suave al soltarlo ("asentamiento") refuerza la sensación de masa. Herramientas de alto nivel como Houdini permiten el snapping entre nodos para alinear bordes automáticamente, reduciendo el desorden visual en el layout.

2. Físicas de Conexión y Lógica de Snapping
El momento en que un usuario intenta conectar dos nodos es el punto de mayor fricción táctil. Una física de "atracción" (snapping) bien calibrada es fundamental para mitigar la fatiga motora.

El Estado de "Dragging Connection"
La interacción se gestiona mediante una máquina de estados que transita de idle a dragging-connection. Durante este estado, se genera una línea temporal desde el puerto de origen hacia la posición del cursor, la cual se actualiza en cada frame del ciclo de renderizado.

Radio de Captura Dinámico
Aunque un puerto se represente visualmente como un círculo pequeño (8px), su área de interacción (hitbox) debe ser significativamente mayor para facilitar el enganche.

Radio Estándar: Se recomienda un radio de 15px a 20px para que el cable "salte" magnéticamente al centro del puerto objetivo.

Compensación por Zoom: Una técnica avanzada consiste en hacer este radio dependiente del zoom. En niveles de zoom bajos (0.2x), el radio en píxeles de pantalla puede aumentarse para compensar la falta de precisión visual del usuario.

3. Sensación de Flujo y Dirección de Cables
La dirección lógica del grafo debe ser evidente sin necesidad de un análisis consciente. Esto se logra mediante la asimetría y el comportamiento físico de los cables.

Entrada y Salida Horizontal: Para flujos que van de izquierda a derecha (L→R), los cables deben salir y entrar horizontalmente de los puertos. Esto se logra calculando el punto de salida con un pequeño offset hacia afuera (aprox. 6–8px) antes de iniciar la curva.

Puntos de Control de Bézier: La curvatura se define proyectando los puntos de control P 
1
​
  y P 
2
​
  en el eje X. Esto crea una sensación de que el cable "tira" hacia adelante, reforzando la direccionalidad.

Indicadores Visuales: El uso de gradientes que fluyen del origen al destino o flechas discretas que solo aparecen en ciertos niveles de zoom ayuda a rastrear conexiones en redes densas (evitando el "código espagueti").

4. Arquitectura Práctica para el Rendimiento en React
Con más de 30 nodos y múltiples conexiones, la gestión del DOM se vuelve crítica. La arquitectura recomendada divide las responsabilidades de renderizado para maximizar los FPS:

Capa	Tecnología	Razón Técnica
Nodos y Widgets	DOM / SVG	Facilita la interactividad nativa de React (eventos de clic, formularios, hover) y el uso de componentes personalizados.
Cables (Edges)	Canvas 2D / SVG	Los cables son los elementos que más se redibujan durante el pan y el drag. Una capa de Canvas permite manejar miles de líneas con un solo nodo en el DOM.
Línea Temporal	SVG / Canvas	Al ser un único elemento que cambia en cada frame, debe estar optimizado para no disparar re-renders en todo el árbol de nodos.
Optimización por Virtualización y Culling
Para evitar el lag de renderizado, es vital implementar el viewport culling. Solo los nodos y cables que intersectan con el rectángulo visible de la cámara deben ser procesados. React Flow y otras librerías modernas utilizan esta técnica para mantener la fluidez incluso cuando el grafo crece exponencialmente.

5. Navegación Avanzada y Zoom Semántico
La cámara debe actuar como el ojo del usuario en este mundo físico. El estándar de la industria (Figma, Blender) es el Zoom-to-Cursor, donde el punto bajo el ratón permanece fijo mientras el lienzo escala.

Para mantener la legibilidad, se aplica el Zoom Semántico:

Zoom > 0.8x: Se muestran todos los detalles, etiquetas y widgets internos del nodo.

Zoom 0.5x - 0.8x: Se ocultan widgets secundarios; solo se muestran títulos y estados de los puertos.

Zoom < 0.2x: El texto desaparece. Los nodos se convierten en glifos de colores que representan su función, permitiendo al usuario ver la "topografía" general del flujo sin ruido visual.

6. Diferenciación Multi-Cuenta (Contexto)
En flujos donde interactúan múltiples cuentas de un mismo servicio (ej. 3 cuentas de Notion), el "mundo físico" debe proporcionar pistas visuales de identidad rápidas:

Badges de Color: Un borde dinámico o una barra lateral en el nodo vinculada a un color específico de cuenta.

Avatares en Puertos: Colocar el avatar del usuario en los puertos de salida o junto al icono del proveedor (Notion) para confirmar visualmente quién es el "dueño" de los datos que fluyen por ese cable.

Conclusiones Técnicas
Para construir un editor de nodos robusto en 2026, la implementación debe centrarse en:

Fisicidad: Tratar el arrastre y la conexión con reglas de snapping magnético y pesos visuales.

Hibridación: Usar el DOM para la lógica compleja del nodo y Canvas para la masa crítica de cables.

Direccionalidad: Diseñar las curvas de Bézier para que comuniquen el flujo de datos de forma pasiva.

Escalabilidad: Implementar culling y zoom semántico como requisitos no negociables desde el inicio del desarrollo.


----
Investigación 5
----


# Abstracción Funcional: Principios de "RendererVectorPro" y Estandares Core
> **Fuentes:** 
> - `docs/RendererVectorPro/Investigaciones`
> - `_documentation/Doc_nivel_3/adr/004-spatial-engine-thorne.md`
> - `_documentation/Doc_nivel_3/adr/008-arquitectura-borehole.md`
> **Objetivo:** Adoptar estándares de rendimiento, física visual y coherencia lógica para la fase "The Loom".

Esta sección abstrae los hallazgos técnicos y las decisiones de arquitectura (ADRs) para aplicarlos estrictamente a la topología de INDRA.

## 1. Arquitectura Borehole (ADR-008)
Para mantener 60 FPS con grafos densos, prohibimos el renderizado ingenuo en DOM. Adoptamos el patrón **Borehole**:
- **Capa Stage (Canvas/SVG):** El "Loom" o telar de cables. Dibuja la totalidad de los flujos de datos de forma masiva y estática.
- **Capa Borehole (React DOM):** Nodos interactivos que "perforan" el canvas. Solo los nodos visibles o bajo interacción directa consumen recursos del DOM.
- **Sincronización:** La posición de los puertos (React) dicta la geometría del cable (Canvas) mediante la **Proyección Thorne**.

## 2. Espacio Métrico Thorne (ADR-004)
El lienzo NO es una rejilla de píxeles. Es un espacio físico definido en **milímetros (mm)**.
- **Soberanía:** La lógica del cable (longitud, tensión) se calcula en `mm`.
- **Proyección:** Se convierte a píxeles solo en el último milisegundo antes de renderizar (96 DPI base), permitiendo zoom infinito sin pérdida de precisión lógica. `IndraKernel` es la autoridad de esta conversión.

## 3. Flujo Lógico (Herencia de Datos)
 Un cable NO es solo una línea curva. Es la representación visual de una **Sentencia Lógica**:
 > *"El Nodo B hereda el contexto y los datos del Nodo A".*

- **Prioridad Semántica:** Antes de dibujar un píxel, el sistema debe validar la compatibilidad lógica (Tipos de datos MasterLaw) entre el Puerto A y el Puerto B.
- **Direccionalidad:** La curva visual representa el flujo del tiempo y datos. No es decoración; es información de herencia.

## 4. Físicas de Curvas (Bézier Direccional)
Para reflejar la herencia de datos L→R (Izquierda a Derecha), las curvas deben tener "Tensión hacia adelante" (Forward Tension).
- **Fórmula de Control:**
  - `P0` (Source): Puerto Salida + Offset Thorne (ej. 10mm proyectados).
  - `P3` (Target): Puerto Entrada - Offset Thorne.
  - **Puntos de Control:** Calculados para maximizar la legibilidad del flujo de información, no la estética pura.

## 3. Presupuesto de Rendimiento (Frame Budget)
- **Target:** 60 FPS (16.6ms por frame).
- **Estrategia de Renderizado:**
  - **Idle:** Solo redibujar si hay cambios (dirty flag).
  - **Dragging:** Usar `requestAnimationFrame` para actualizar solo la geometría de los cables afectados.
  - **Snapping:** Radio de captura de 20px (tolerancia) para evitar frustración motora.

## 4. Zoom Semántico (LOD - Level of Detail)
El renderizado debe degradarse con elegancia según el zoom (`k`):
- **High (k > 0.8):** Render completo (Texto, Iconos, Inputs, Sombras).
- **Medium (0.4 < k < 0.8):** Ocultar inputs y descripciones. Solo Títulos + Iconos de estado.
- **Low (k < 0.4):** "Modo Mapa". Solo cajas de color (Archetype Color) y líneas de conexión. Texto eliminado.

## 5. Tiempos de Respuesta (Psicofísica)
- **Hover:** 150ms (percepción instantánea pero evita parpadeo accidental).
- **Selección:** 300ms (transición suave de estado).
- **Snapping Feedback:** < 16ms (debe sentirse físico e inmediato).
