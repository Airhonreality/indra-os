# ADR-022: SOBERANÍA ATÓMICA (THE HONEST SYSTEM)

## Contexto y Problema
El Document Designer (Motor Gráfico 2D) presentaba un acoplamiento entrópico con la UI de la Shell. Los documentos cargaban tokens dinámicos (`var(--color-text-primary)`) que cambiaban según el tema activo (Dark/Light/Vapor). Esto violaba el **Axioma de Independencia** de Nam P. Suh: la integridad del documento dependía del estado de la interfaz.

## Decisión
Implementar un sistema de renderizado y persistencia determinista denominado **"The Honest System"**.

### Componentes de la Arquitectura:
1.  **HonestProvider (Cámara de Vacío)**: Un contenedor que aplica un reset total de CSS (`all: revert`) y re-mapea los tokens esenciales a una Realidad Local inmutable.
2.  **Aduana de Cristalización (Determinismo)**: Un pipeline en el guardado que traduce cada token vivo (`var(--...)`) al valor físico real (Hex/Pixels) del momento en que el diseñador tomó la decisión.
3.  **Intención Sincerada**: Los tokens originales se preservan como metadatos de "Intención", pero el renderizado base siempre es determinista.

### Axiomas Clave:
*   **Soberanía**: El documento es una isla. No debe saber que la Shell es oscura o clara.
*   **Sinceridad**: Lo que se guarda es lo que se ve, sin depender de la cascada CSS externa.

## Consecuencias
*   **Positivas**: Los documentos ahora son 100% portables. Un diseño hecho en "Vapor Mode" se verá idéntico si se exporta o se abre en una Shell en "Light Mode".
*   **Negativas**: Se pierde la capacidad de que el documento se adapte automáticamente al tema de la Shell (lo cual es deseado bajo este paradigma de diseño gráfico determinista).
*   **Mantenimiento**: Cualquier nuevo componente del Diseñador debe respetar el blindaje del `HonestProvider`.
