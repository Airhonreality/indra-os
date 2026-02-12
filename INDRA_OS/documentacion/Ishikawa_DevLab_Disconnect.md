# Diagrama de Ishikawa: Desconexión de Vistas en DevLab

Este diagrama analiza por qué el `NodeEngine` y `DatabaseEngine` no están mostrando la interfaz o los datos esperados en el entorno de pruebas.

```mermaid
graph TD
    A[Problema: Vistas Incorrectas / Datos Faltantes] --> B(Causa Raíz: Mapeo de Arquetipos)
    A --> C(Causa Secundaria: Estructura de Mocks)
    
    B --> B1[DevLab Fallback]
    B1 -->|Fuerza 'SERVICE'| B2(Proyección de ServiceEngine)
    B2 -->|Oculta Puertos| B3[Usuario ve 'Ghost Node']
    
    C --> C1[Database Mock Incompleto]
    C1 -->|Faltan Rows/Cols| C2(DatabaseEngine Render)
    C2 -->|Sin Datos Tabulares| C3[Tabla Vacía / Error]

    subgraph "Flujo Incorrecto (Caso NODE)"
    D[targetId: NODE] --> E{¿Mock Existe?}
    E -- NO --> F[Generar Fantasma]
    F --> G[Asigna ARCHETYPE: SERVICE]
    G --> H[Registry: SERVICE -> ServiceEngine]
    H --> I[Resultado: Vista de Dashboard (No Nodos)]
    end

    subgraph "Flujo Correcto (Propuesto)"
    J[targetId: NODE] --> K{¿Mock Existe?}
    K -- NO --> L[Generar Fantasma]
    L --> M[Asigna ARCHETYPE: NODE/ADAPTER]
    M --> N[Registry: NODE -> NodeEngine]
    N --> O[Resultado: Vista de Caja Negra + Puertos]
    end
```

## Diagnóstico Detallado

1.  **El "Fantasma" es un Servicio, no un Nodo:**
    *   Cuando seleccionas "Node Engine" en el menú, el ID es `NODE`.
    *   No hay un mock explícito para `NODE` en `MockFactory` (solo para `LLM`, `DATABASE`, `DRIVE`, `NOTION`, `EMAIL`).
    *   El sistema cae en el `Fallback Final` de `DevLab/index.jsx`.
    *   Este fallback asigna `ARCHETYPE: 'SERVICE'`.
    *   El `Archetype_Registry` dice que `SERVICE` se renderiza con `ServiceEngine.jsx`.
    *   **Resultado:** Ves la pantalla oscura de "SYNTHETIC ENGINE" (ServiceView) en lugar de la caja con puertos (NodeView).

2.  **La Base de Datos está vacía de espíritu:**
    *   El mock de `DATABASE` en `MockFactory` define `CAPABILITIES` y `VITAL_SIGNS`, pero olvida lo más importante para una base de datos: **Los Datos**.
    *   El `DatabaseEngine` busca propiedades como `rows`, `columns` o `data` para pintar la grilla.
    *   Al no encontrarlas, renderiza un contenedor vacío o estado de error.

## Solución Propuesta

1.  **Refactorizar Fallback en DevLab:** Hacer que el arquetipo del mock generativo sea dinámico o por defecto `NODE` para ver la estructura de puertos.
2.  **Hidratar Mock de DATABASE:** Inyectar filas y columnas de ejemplo en el `MockFactory`.
