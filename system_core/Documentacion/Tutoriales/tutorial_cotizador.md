# Tutorial Maestro: Implementación del Cotizador Ergonómico

Este tutorial detalla la construcción del flujo de cotización, desde la captura de datos en el **Schema Designer** hasta el procesamiento y persistencia en el **Logic Bridge**.

---

## FASE 1: Diseño en el SCHEMA DESIGNER

El esquema debe reflejar la jerarquía visual del documento final. Utilizaremos **Repeaters anidados** para agrupar ítems por espacios físicos.

### 1.1 Estructura de Campos

| Nivel | Campo | ID (Slug) | Tipo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Raíz** | Nombre del Proyecto | `proyecto_nombre` | `TEXT` | Título de la propuesta. |
| **Raíz** | Cliente | `cliente_link` | `RELATION` | Vinculado al silo de **Clientes**. |
| **N1** | **Lista de Espacios** | `espacios` | `REPEATER` | Agrupador de áreas (Cocina, Baño). |
| └─ | Nombre del Espacio | `espacio_nombre` | `TEXT` | Ej: "Cocina Principal". |
| └─ | **Líneas de Cotización** | `items` | `REPEATER` | Los productos dentro del espacio. |
| └─ └─ | Producto/Servicio | `item_link` | `RELATION` | Vinculado al silo de **Catálogo**. |
| └─ └─ | Cantidad | `item_cantidad` | `NUMBER` | Valor numérico (1, 5, 12.5). |
| └─ └─ | **U/M (Unidad)** | `item_um` | `SELECT` | Opciones: `ud`, `m²`, `set`, `global`. |
| **Raíz** | Logística | `costo_logistica` | `NUMBER` | Costo transversal. |

> [!TIP]
> Al usar un `REPEATER` dentro de otro, el Bridge recibirá un objeto de datos complejo que luego "aplanaremos" para Notion o mantendremos "vivo" para el Document Designer.

---

## FASE 2: Orquestación en el LOGIC BRIDGE

Aquí es donde convertimos los **Punteros** del formulario en **Dinero Real**.

### 2.1 Conexión de Fuentes (Sources)
En la columna izquierda del Bridge, vincula:
1.  **Formulario:** El esquema que acabamos de crear.
2.  **Silo de Referencia:** El Catálogo de Productos de Notion.

### 2.2 Pipeline de Transformación (Operadores)

1.  **Iterador Primario:** Indra detecta el repeater `espacios` y comienza el bucle.
2.  **Iterador Secundario:** Dentro de cada espacio, entramos en el bucle de `items`.
3.  **Operador EXTRACTOR (Hidratación):**
    *   **Input:** `item_link` (el ID que viene del formulario).
    *   **Acción:** Busca en el Silo de Catálogo.
    *   **Resultado:** Atrapa el campo `Precio_Original`.
4.  **Operador MATH (Cálculo de Línea):**
    *   **Operación:** `item_cantidad` × `Precio_Original`.
    *   **Alias:** `subtotal_linea`.
5.  **Operador MATH (Agregador):** Suma todos los `subtotal_linea` para generar el `total_espacio`.

---

## FASE 3: Destinos y Persistencia (Targets)

### 3.1 El "Aplanamiento" para Notion
Si quieres guardar esto en una base de datos de Notion llamada "Líneas_Venta", debes mapear las jerarquías a columnas planas:

*   **Columna "Nombre Ítem":** `{{item.item_link.label}}` (Indra extrae el nombre legible del puntero).
*   **Columna "Espacio":** `{{parent.espacio_nombre}}` (El Bridge "recuerda" el nombre del espacio padre mientras itera los hijos).
*   **Columna "Cantidad":** `{{item.item_cantidad}}`.
*   **Columna "U/M":** `{{item.item_um}}`.
*   **Columna "Total":** `{{item.subtotal_linea}}`.

### 3.2 El Output para el DOCUMENT DESIGNER
Para el documento ergonómico, el Bridge emite un **Objeto Consolidado** que el motor de documentos interpreta recursivamente:

```json
{
  "header": { "proyecto": "González", "cliente": "Ana María" },
  "desglose": [
    {
      "espacio": "Cocina",
      "total": 10300,
      "items": [
         { "nombre": "Fregadero", "cant": 1, "um": "ud", "total": 2100 },
         { "nombre": "Mesón", "cant": 5, "um": "m²", "total": 2250 }
      ]
    }
  ]
}
```

---

## Resumen del Dharma el Flujo
1.  **Capturamos** la intención (Schema).
2.  **Deducimos** el valor (Bridge + Extractor).
3.  **Proyectamos** la narrativa (Document Designer).
