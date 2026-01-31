# ADR-019: El Workspace como Compilador de Realidad
> **Estado:** Aceptado
> **Contexto:** En lugar de pestañas estáticas, INDRA utiliza un canvas infinito (Thorne) donde la disposición espacial de los nodos define la lógica de ejecución (Computación Visual).

## ⚖️ Decisión
1. **Modelado de Flujo:** La conexión física entre una Partícula de Datos y un Nodo de Proceso crea una "Suscripción Dinámica".
2. **Previsualización de Destilado:** Cuando una partícula entra en el campo de gravedad de un Nodo (ej: PDF), el HUD debe mostrar una previsualización táctica del resultado sin necesidad de ejecutar la acción final.
3. **Acción Stark:** El botón de "Ejecutar" (SOMA) colapsa todas las relaciones espaciales en una orden de `IndraKernel.transport.call` que se envía al Core.

## ✅ Consecuencias
- **Positivas:** El usuario "ve" su negocio. La automatización deja de ser una lista de pasos abstractos y se convierte en un modelo físico.
- **Negativas:** Requiere una gestión de "Cables" (LOGOS) extremadamente optimizada para no degradar el rendimiento visual.
