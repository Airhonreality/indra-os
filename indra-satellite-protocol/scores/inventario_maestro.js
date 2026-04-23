/**
 * INDRA SCHEMA: 1iEreLyspsHbhz2q5rVxoglmJPx-5C2FH
 * Alias: inventario_maestro
 * Origin: Core Handshake (DEEP PULL)
 */
export const SCHEMA = {
    "id": "1iEreLyspsHbhz2q5rVxoglmJPx-5C2FH",
    "handle": {
        "alias": "inventario_maestro",
        "label": "Inventario Maestro"
    },
    "class": "DATA_SCHEMA",
    "payload": {
        "fields": [
            {
                "id": "sku",
                "label": "SKU",
                "type": "text",
                "required": true
            },
            {
                "id": "type",
                "label": "Tipo",
                "type": "text",
                "description": "Categoría o tipo de ítem"
            },
            {
                "id": "description",
                "label": "Descripción",
                "type": "text"
            },
            {
                "id": "um",
                "label": "Unidad de Medida (Um)",
                "type": "text",
                "default": "Unidad"
            },
            {
                "id": "width",
                "label": "Ancho",
                "type": "number",
                "default": 0
            },
            {
                "id": "height",
                "label": "Alto",
                "type": "number",
                "default": 0
            },
            {
                "id": "depth",
                "label": "Profundo",
                "type": "number",
                "default": 0
            },
            {
                "id": "stock",
                "label": "Stock Actual",
                "type": "number",
                "default": 0
            },
            {
                "id": "direct_price",
                "label": "Precio Directo",
                "type": "number",
                "default": 0
            },
            {
                "id": "public_price",
                "label": "Precio Público",
                "type": "number",
                "default": 0
            },
            {
                "id": "image",
                "label": "Imagen (URL)",
                "type": "text"
            },
            {
                "id": "model_3d",
                "label": "Modelo 3D (.glb / .obj)",
                "type": "text"
            },
            {
                "id": "url",
                "label": "URL de Referencia / Ficha",
                "type": "text"
            },
            {
                "id": "field_1776796606895",
                "type": "TEXT",
                "label": "PROVEEDOR",
                "alias": "nuevo_campo_6895",
                "config": {}
            }
        ],
        "target_silo_id": "1-p-6OqnAz2g55YFRLrmpo10rphGv5ZnJEOi26KBQ-uc",
        "target_provider": "sheets"
    }
};