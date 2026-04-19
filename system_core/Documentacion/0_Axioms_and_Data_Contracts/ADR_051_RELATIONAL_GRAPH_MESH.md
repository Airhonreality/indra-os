# ADR 051: Del Ledger Tabular a la Malla de Grafos Relacionales

## Estado
Propuesto (v6.0)

## Contexto
En la fase v5.x, Indra OS consolidó su persistencia en el **Master Ledger (Sheets)**, lo que permitió una indexación rápida y centralizada. Sin embargo, este modelo sigue siendo "plano" (Tabular). Las relaciones entre átomos (ej: autoría, jerarquía, dependencia) viven de forma implícita o enterradas en el `payload_json`. 

Para alcanzar la **Trazabilidad Yoneda**, Indra necesita que el vínculo sea un ciudadano de primera clase en el sistema.

## Decisión
Evolucionar la estructura de cada Ledger (Core y Células) para incluir una tabla nativa de **RELACIONES** (Bordes). El sistema dejará de ser una base de datos relacional tradicional para convertirse en un **Grafo de Conocimiento Distribuido**.

### Estructura de la Tabla `RELATIONS`:
- `uid`: Identificador único del vínculo.
- `source_gid`: GID del átomo origen.
- `target_gid`: GID del átomo destino (puede ser de otro Silo).
- `type`: Semántica del vínculo (`PARENT_OF`, `REFERENCES`, `DEPENDS_ON`, `MEMBER_OF`).
- `strength`: Peso o importancia de la relación (0.0 a 1.0).
- `payload_json`: Metadatos adicionales del vínculo (ej: fecha de expiración, contexto).

## Consecuencias
1. **Navegación Fractal:** El sistema puede descubrir rutas de datos siguiendo hilos relacionales a través de múltiples silos abiertos vía JIT.
2. **Polimorfismo Semántico:** Un átomo puede "cambiar de función" según sus relaciones.
3. **Complejidad de Consulta:** Las lecturas ahora requieren un paso adicional de "Escaneo de Relaciones" para construir el mapa de consciencia del objeto solicitado.
4. **Resiliencia Relacional:** Los vínculos pueden sobrevivir aunque el objeto destino esté temporalmente offline, manteniendo la integridad del mapa de navegación.

## Impacto en el Core
- Refactorización de `provider_system_ledger.gs` para gestionar el CRUD de vínculos.
- Inyección de lógica relacional en el `protocol_router.gs`.

---
*Indra OS v6.0 — Definiendo el tejido de la realidad.*
