# ADR-009: Protocolo de Comunicación Neutrón
> **Estado:** Aceptado
> **Contexto:** El sistema necesita una forma estandarizada y agnóstica de hablar con el backend (Orbital Core en GAS).

## ⚖️ Decisión
Estandarizar todas las transacciones de datos bajo el **Protocolo Neutrón**:

1. **Formato de Petición:** Un único endpoint POST que recibe un objeto JSON con tres claves:
   - `executor`: El adaptador de backend (notion, drive, sheets, etc.).
   - `method`: La función a ejecutar.
   - `payload`: El objeto de datos necesario para la ejecución.
2. **Normalización de Salida:** El Kernel debe "desenvolver" (unwrap) recursivamente la respuesta para eliminar anidamientos innecesarios (`result.result`) y normalizarla al tipo `UniversalItem`.
3. **Transporte Seguro:** Centralizado en `IndraKernel.transport.call`, prohibiendo el uso de `fetch` directo desde los componentes.

## ✅ Consecuencias
- **Positivas:** Desacoplamiento total del backend. El Satélite puede cambiar de motor de base de datos sin alterar su lógica interna. Facilita el "Mocking" de datos.
- **Negativas:** Introduce una pequeña sobrecarga de serialización/deserialización JSON.
