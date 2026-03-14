# ADR_008 — LEY DE ADUANA: Sinceridad Atómica y Normalización de Frontera

## 1. Contexto y Problema
Históricamente, el sistema INDRA permitía cierta "tolerancia" en la nomenclatura de esquemas tabulares. Algunos proveedores (Notion, Drive) devolvían metadatos bajo la clave `columns`, mientras que el estándar de Workflows y Schemas usaba `fields`. 

Esta asincronía generaba:
1.  **Materia Oscura**: Átomos que existían pero cuyos campos eran invisibles para otros motores (Bridge Designer, Logic Engine).
2.  **Fugas de Abstracción**: El Frontend y el Logic Engine tenían código "parche" para intentar adivinar si venían `columns` o `fields`.
3.  **Inestabilidad**: Cualquier cambio en un proveedor externo rompía la cadena de valor si la "traducción" manual fallaba.

## 2. Decisión Arquitectónica
Se establece la **Ley de Aduana Coercitiva**:

1.  **Unificacción de Nomenclatura**: Se prohíbe terminantemente el uso del término `columns` en cualquier nivel del sistema (Frontend y Backend). El único estándar legal es `payload.fields`.
2.  **Responsabilidad en el Origen (Sinceridad)**: Es deber absoluto del **Provider** entregar la materia procesada y plana. Ningún motor intermedio (Logic Engine) ni el Cliente (Frontend) debe realizar "unrolling" o "aplanamiento" de datos crudos.
3.  **Validación en la Frontera (Protocol Router)**: El `protocol_router.js` actuará como el único oficial de aduana. Si un provider entrega un átomo `TABULAR` o `DATA_SCHEMA` sin `payload.fields` (o con `columns`), el router rechazará la carga con una excepción `CONTRACT_VIOLATION`.
4.  **Eliminación de la Tolerancia**: Se retira toda lógica de "perdón" o "auto-corrección" en el frontend (`directive_executor`, `DataProjector`) para forzar un comportamiento determinista y ruidoso ante el error.

## 3. Justificación Axiomática
- **Axioma de Sinceridad**: INDRA no adivina. Los datos deben ser explícitos.
- **Dharma de Fractalidad**: Cada capa debe ser autosuficiente. Si el provider no es sincero, la fractalidad se rompe porque la capa superior debe "saber" demasiado sobre la inferior.

## 4. Consecuencias
- **Positivas**: Reducción drástica de líneas de código en el Frontend y Logic Engine. Eliminación de bugs "fantasma" donde los campos no aparecían.
- **Negativas**: Mayor rigurosidad requerida al crear nuevos proveedores. Necesidad de refactorizar proveedores antiguos (Drive, Notion) para cumplir la ley.

---

# DOFA / SWOT: Estrategia de Sinceridad de Datos

## Fortalezas (Strengths)
- **Determinismo Absoluto**: El Bridge Designer y los motores de lógica siempre reciben el mismo formato.
- **Código Limpio**: Se eliminan "if/else" infinitos en el frontend.
- **Fácil Depuración**: Errores localizados en la frontera (`protocol_router`).

## Oportunidades (Opportunities)
- **Escalabilidad de Providers**: Crear un nuevo provider es más rápido porque el contrato es binario y claro.
- **Interoperabilidad**: Facilita la creación de un "Meta-Provider" (Pipeline).

## Debilidades (Weaknesses)
- **Rigidez Inicial**: Componentes antiguos pueden fallar si no se actualizan.
- **Costo de Inspección**: Costo de tiempo de ejecución en GAS (mitigado mediante inspección selectiva).

## Amenazas (Threats)
- **Desbordamiento de GAS**: Riesgo de timeouts (mitigado).
- **Esquizofrenia Técnica**: Si se permite un solo componente permisivo, el estándar perderá su soberanía.
