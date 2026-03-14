# Tutorial: Diseño del Esquema del Cotizador (Propuesta)

Para habilitar el **Asistente de Propuestas** en Indra, debes diseñar un `DATA_SCHEMA` que capture la estructura jerárquica de la cotización. Siguiendo el paradigma MCA, este esquema actuará como el "Capturador Ciego" de datos.

## Estructura del Esquema (Campos)

Diseña el esquema en el **Schema Designer** con los siguientes campos y tipos:

| Etiqueta (Label) | ID del Campo (Slug) | Tipo de Campo | Descripción |
| :--- | :--- | :--- | :--- |
| **Nombre del Proyecto** | `proyecto_nombre` | `TEXT` | Nombre descriptivo de la propuesta. |
| **Cliente** | `cliente_link` | `RELATION_SELECT` | Vinculado al Silo de **CLIENTES**. |
| **Configuración de Espacios** | `espacios` | `REPEATER` | Grupo repetible para definir áreas (Cocina, Estudio, etc). |
| └─ *Nombre del Espacio* | `espacio_nombre` | `TEXT` | Ej: "Cocina Principal". |
| └─ *Líneas de Ítems* | `items` | `REPEATER` | Sub-grupo repetible dentro de cada espacio. |
| └─ └─ *Producto/Servicio* | `item_link` | `RELATION_SELECT` | Vinculado al Silo de **CATÁLOGO / PRECIARIO**. |
| └─ └─ *Cantidad* | `item_cantidad` | `NUMBER` | Cantidad de unidades o m². |
| **Transporte y Logística** | `costo_logistica` | `NUMBER` | Costo fijo de traslado. |
| **Mano de Obra Global** | `costo_instalacion` | `NUMBER` | Costo de cuadrillas o instalación. |
| **Descuento (%)** | `descuento_porc` | `NUMBER` | Porcentaje de descuento comercial. |
| **Notas Generales** | `notas_footer` | `TEXT (Long)` | Condiciones, tiempos de entrega o despedida. |

---

## Consideraciones para el Logic Bridge

Una vez captures estos datos con el formulario, el **Bridge Designer** deberá:
1. Iterar sobre el array de `espacios`.
2. Para cada espacio, iterar sobre sus `items`.
3. Cruzar el `item_link` con el Silo del Catálogo (usando un operador **EXTRACTOR**) para obtener el precio base.
4. Calcular: `(Cantidad * Precio) + Logística + MO - Descuento`.
5. Emitir el objeto final para el **Document Designer**.
