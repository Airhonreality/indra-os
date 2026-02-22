# Sistema de Transformación Semántica (The Law Compiler)

El **Law_Compiler** es el motor de transmutación que convierte los datos crudos del Core en leyes visuales y funcionales para la interfaz.

## 1. Aspectos Axiomáticos (Según ADR-022)

*   **Axioma de Mapeo Universal:** Todo dato emitido por un adaptador debe ser resoluble en un signo visual (`Icon`), una capacidad técnica (`Capability`) o un indicador de salud (`VitalSign`). 
*   **Axioma de Integridad de Arquetipo:** El arquetipo (VAULT, DATABASE, NODE) es el contrato sagrado que define la "física" del objeto en el grafo.
*   **Axioma de Semántica Fluida:** La transformación no es estática; el compilador debe inyectar dinámicamente capacidades basadas en el contexto de la sesión actual.

---

## 2. Análisis: Coherencia de IOS 8 vs Realidad Empírica

### El Modelo Documentado (Ideal)
En la documentación de `Coherencia de IOS 8`, se asume una **Reificación en Cascada** donde los datos fluyen de forma lineal:
`Core -> Result -> Artifacts -> UI`.

### El Modelo Real (Adapters v2.2)
Los logs actuales revelan una estructura de **Envoltorio Complejo (Envelope 2.2)**:
```json
{
  "success": true,
  "result": [
    {
      "envelope_version": "2.2",
      "payload": {
        "artifacts": [...],
        "relationships": [...]
      }
    }
  ]
}
```

### Discrepancia Técnica
El **Law_Compiler** original estaba diseñado para buscar `result.artifacts` o `data.artifacts`. La realidad es que los datos viven un nivel más profundo, dentro de la clave `payload` del primer elemento del array `result`. Esta desalineación es lo que provoca la "Ceguera del Compilador" (Founding 0 raw artifacts).

---

## 3. Reflexión sobre la Simplificación del Mapeo Funcional

Para simplificar la carga de mapeo funcional y evitar la ceguera futura, el desarrollo del transformador semántico debe evolucionar hacia la **Autodescubrimiento Orientado a Claves (Key-Driven Discovery)**:

1.  **Eliminación de la Rigidez de Ruta:** En lugar de codificar rutas como `data.result[0].artifacts`, el compilador debe emplear un buscador recursivo de "Essence Collections" (claves `artifacts` o `nodes` en cualquier nivel del sobre).
2.  **Aplanamiento Semántico Proactivo:** El compilador debe normalizar la "Materia Oscura" antes de procesarla, asegurando que sin importar el `envelope_version`, la salida siempre sea un mapa plano de identidades.
3.  **Desacoplamiento del Transporte:** Separar la lógica de "Cómo llega el dato" (InterdictionUnit/Connector) de "Qué significa el dato" (Law_Compiler). El compilador no debería saber nada de HTTP o Envelopes; debería recibir solo la médula ósea del mensaje.

### Conclusión para la Evolución:
Simplificar el mapeo significa que el `Law_Compiler` deje de ser un "validador de rutas" y se convierta en un auténtico **Ontólogo**, que reconoce un artefacto por su estructura interna (`id`, `ARCHETYPE`, `LABEL`) y no por el lugar que ocupa en el JSON del servidor.
