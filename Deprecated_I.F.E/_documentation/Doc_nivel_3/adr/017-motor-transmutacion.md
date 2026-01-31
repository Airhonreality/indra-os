# ADR-017: Motor de Transmutación de Nodos (The Node Engine)
> **Estado:** Aceptado (Amanecer Primigenio)
> **Contexto:** INDRA no es un gestor de tablas; es un motor que modela la transformación de datos (Entrada) en acciones o documentos (Salida) mediante Nodos de Proceso.

## ⚖️ Decisión
Establecer el **Contrato de Nodo Universal (UNS)**. Todo proceso en el satélite debe seguir este ciclo de transmutación:

1. **Materia Prima (Input):** Un chorro de `UniversalItems` (Partículas de Notion, Sheets, etc.).
2. **El Horno (Process):** Un Nodo con lógica pura (JS/GAS) que aplica filtros, cálculos o mapeos.
3. **El Destilado (Output):** Un nuevo conjunto de Partículas o un **Artefacto de Realidad** (PDF, Email, Trigger).

## 🧬 Componentes del Nodo
Cada Nodo en el Workspace debe poseer:
- **Puertos de Entrada:** Sockets que aceptan colecciones de partículas.
- **Lógica de Mapeo:** Un "Contrato de Traducción" que dice: `propiedad_A de Notion` -> `campo_X del PDF`.
- **Accionador de Core:** La capacidad de invocar al `IndraKernel.transport.call` para ejecutar la lógica pesada en el Orbital Core.

## ✅ Consecuencias
- **Positivas:** El sistema es infinitamente extensible. No necesitas programar una app de PDF; necesitas programar un "Nodo de Destilación" que acepte cualquier materia.
- **Negativas:** Desplaza la complejidad hacia la definición de los "Contratos de Mapeo", lo que requiere una UI de conexión de nodos (Capa LOGOS) muy robusta.
