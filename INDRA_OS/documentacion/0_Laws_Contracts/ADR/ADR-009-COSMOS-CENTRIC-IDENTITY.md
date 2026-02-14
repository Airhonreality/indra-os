# ADR-009: Determinismo de Identidad en el Modelo Atmosférico (Cosmos-Centric)

## Estatus
Propuesto / En Implementación

## Contexto
Históricamente, Indra OS dependía de un proceso de "Sensing" (detección) heurístico en el backend (`CognitiveSensingAdapter`) para identificar el origen de los artefactos (Google Sheets, Notion, etc.). Este proceso era propenso a errores, latencia y "alucinaciones de identidad", donde un artefacto de Notion podía ser identificado erróneamente como una Google Sheet debido a fallbacks genéricos.

## Decisión
Se establece el modelo de **Soberanía de Linaje (Sovereign Lineage)**. La identidad de un artefacto no se "induce" ni se "adivina", sino que se **declara y hereda** desde el origen.

1.  **Firma de Nodo (Backend Signature)**: El `PublicAPI` (Gateway) firma automáticamente cada respuesta con un sello `ORIGIN_SOURCE` basado en el adaptador que procesó la solicitud.
2.  **Identidad Determinista en el Cosmos**: Cada nodo dentro del grafo del Cosmos persiste esta firma de forma inmutable. El Cosmos es la Única Fuente de Verdad (SSoT) para la resolución de orígenes.
3.  **Herencia de ADN**: El Frontend (`AxiomaticStore`) hereda el origen directamente de la firma del backend para nuevos artefactos, y lo guarda en el Cosmos, eliminando cualquier necesidad de heurística o Regex.
4.  **Eliminación de Fallbacks Zombie**: Se prohíbe el uso de fallbacks genéricos (ej: defaulting to 'sheet'). Si un origen no puede ser determinado por el Cosmos o la firma del backend, el sistema debe emitir un error de `IDENTITY_VOID`.

## Consecuencias
- **Positivas**:
    - Latencia Cero en la resolución de orígenes.
    - Escalabilidad total: añadir un nuevo adaptador (Airtable, SQL, etc.) no requiere cambios en la lógica de resolución del Front.
    - Eliminación de "alucinaciones de identidad" por fallbacks genéricos.
- **Negativas**:
    - Requiere que todos los adaptadores sean registrados formalmente en el `SystemAssembler` para poseer un linaje válido.


## Ley de Impedancia Relacionada
"El mapa ES el territorio. Un nodo sin origen no es una unidad de realidad, es entropía."
