# ADR 050: Arquitectura Micelar y Puertos JIT (Just-In-Time)

## Contexto
Indra OS ha evolucionado de un sistema de "Ledger Central" (Monolítico) hacia un ecosistema de **Nodos Soberanos Relacionales** (Micelar). El crecimiento del sistema requiere un método eficiente y seguro para gestionar el acceso a múltiples fuentes de datos distribuidas.

## Axiomas de la Arquitectura v6.0

### 1. El Puerto JIT (Just-In-Time)
La existencia de un dato está condicionada a la apertura de su puerto dinámico.
- **Efímero:** Las monturas de volúmenes (Ledgers de Workspaces) solo existen durante el tiempo de ejecución de la petición.
- **Agnóstico:** Al Core no le importa dónde vive el dato, siempre que el `MountManager` pueda resolver su puerto JIT.

### 2. El Manifiesto de Célula (Membrana de Identidad)
Cada Workspace es una "Célula" con:
- **Local Ledger:** Su propia Google Sheet de registros (Cerebro local).
- **Manifest.json:** Su ADN relacional. Describe capacidades y vínculos.

### 3. Protocolo de Gossip (Descubrimiento Relacional)
En lugar de un índice central absoluto, Indra utiliza el descubrimiento por proximidad.
- El Core descubre nuevas celdas a través de los punteros guardados en las celdas que ya conoce.
- Cada acceso a una celda actualiza el mapa de navegación (`Navigation Mesh`) del Core.

### 4. Coherencia Yoneda (Grafo de Relaciones)
Un Átomo se define por sus relaciones con otros Átomos.
- Se implementa la tabla `RELATIONS` en cada Ledger para capturar Bordes (Edges) de grafos.
- El `Handle` de un átomo es el puente relacional hacia el resto de la malla.

## Implementación Técnica
- **MountManager:** Motor de monturas volátiles JIT.
- **Provider_System_Ledger:** Constructor de núcleos micelares con soporte para tablas de relación.
- **Identidad:** Soberanía por registro en ACL nativas de cada célula.

---
*Indra OS v6.0 — "La relación es el dato."*
