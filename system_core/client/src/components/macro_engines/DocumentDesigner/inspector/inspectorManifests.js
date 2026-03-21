/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/inspector/inspectorManifests.js
 * RESPONSABILIDAD: Single Source of Truth para campos de inspección.
 *
 * REFACTOR (QUALITY_CONTROL):
 * - Añade 'icon' para cada campo (Cognitive Agility).
 * - Añade 'compact: true' para agrupar en multi-columna.
 * =============================================================================
 */

export const blockManifests = {
    // ─────────────────────────────────────────────────────────────────────────
    PAGE: {
        icon: 'FILE',
        sections: [
            {
                id: 'FORMAT',
                name: 'FORMATO_PAGINA',
                defaultOpen: true,
                fields: [
                    { id: 'preset', label: 'PREAJUSTE', type: 'select', icon: 'LAYOUT', options: ['A4', 'LETTER', 'SQUARE', 'CUSTOM'], compact: false },
                    { id: 'orientation', label: 'ORIENTACION', type: 'select', icon: 'ALIGN', options: ['portrait', 'landscape'], compact: true },
                    { id: 'width', label: 'ANCHO', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'mm' },
                    { id: 'minHeight', label: 'ALTO', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'mm' }
                ]
            },
            {
                id: 'SURFACE',
                name: 'SUPERFICIE_PAGINA',
                defaultOpen: true,
                fields: [
                    { id: 'background', label: 'FONDO', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'padding', label: 'RELLENO', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'direction', label: 'DIRECCION', type: 'select', icon: 'ALIGN', options: ['column', 'row'], compact: true }
                ]
            },
            {
                id: 'PRINT',
                name: 'GUIAS_IMPRESION',
                defaultOpen: false,
                fields: [
                    { id: 'bleed', label: 'BLEED', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginTop', label: 'MARGEN_SUP', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginRight', label: 'MARGEN_DER', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginBottom', label: 'MARGEN_INF', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginLeft', label: 'MARGEN_IZQ', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeTop', label: 'AREA_SEGURA_SUP', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeRight', label: 'AREA_SEGURA_DER', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeBottom', label: 'AREA_SEGURA_INF', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeLeft', label: 'AREA_SEGURA_IZQ', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'showPrintGuides', label: 'MOSTRAR_GUIAS', type: 'boolean', icon: 'TARGET', compact: true },
                    { id: 'showPageNumber', label: 'NUMERO_PAGINA', type: 'boolean', icon: 'TEXT', compact: true }
                ]
            },
            {
                id: 'PAGINATION',
                name: 'PAGINATION',
                defaultOpen: false,
                fields: [
                    { id: 'paginationMode', label: 'MODO', type: 'select', icon: 'REPEATER', options: ['hybrid', 'auto', 'manual'], compact: true },
                    { id: 'pageBreakBefore', label: 'SALTO_ANTES', type: 'boolean', icon: 'ARROW_UP', compact: true },
                    { id: 'pageBreakAfter', label: 'SALTO_DESPUES', type: 'boolean', icon: 'ARROW_DOWN', compact: true },
                    { id: 'footerTemplate', label: 'PIE_PAGINA', type: 'text', icon: 'TEXT', compact: false },
                    { id: 'headerTemplate', label: 'ENCABEZADO', type: 'text', icon: 'TEXT', compact: false }
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    FRAME: {
        icon: 'LAYER_STRICT',
        sections: [
            {
                id: 'LAYOUT',
                name: 'GEOMETRIA',
                defaultOpen: true,
                fields: [
                    { id: 'width', label: 'ANCHO', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'px' },
                    { id: 'height', label: 'ALTO', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'px' },
                    { id: 'minHeight', label: 'MIN_ALTO', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'px' },
                    { id: 'padding', label: 'RELLENO', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'direction', label: 'DIRECCION', type: 'select', icon: 'ALIGN', options: ['column', 'row'], compact: true },
                    { id: 'borderRadius', label: 'RADIO', type: 'unit', icon: 'RADIUS', compact: true }
                ]
            },
            {
                id: 'SURFACE',
                name: 'SUPERFICIE',
                defaultOpen: false,
                fields: [
                    { id: 'background', label: 'FONDO', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'borderColor', label: 'BORDE_COLOR', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'borderWidth', label: 'BORDE_GROSOR', type: 'unit', icon: 'HEIGHT', compact: true }
                ]
            },
            {
                id: 'POSITIONING',
                name: 'POSICIONAMIENTO',
                defaultOpen: false,
                fields: [
                    { id: 'layoutMode', label: 'MODO', type: 'select', icon: 'MOVE', options: ['flow', 'absolute'], compact: true },
                    { id: 'top', label: 'TOP', type: 'unit', icon: 'ARROW_UP', compact: true },
                    { id: 'left', label: 'LEFT', type: 'unit', icon: 'ARROW_LEFT', compact: true },
                    { id: 'right', label: 'RIGHT', type: 'unit', icon: 'ARROW_RIGHT', compact: true },
                    { id: 'bottom', label: 'BOTTOM', type: 'unit', icon: 'ARROW_DOWN', compact: true },
                    { id: 'zIndex', label: 'CAPA_Z', type: 'text', icon: 'LAYERS', compact: true }
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    TEXT: {
        icon: 'TEXT',
        sections: [
            {
                id: 'CONTENT',
                name: 'CONTENIDO',
                defaultOpen: true,
                fields: [
                    { id: 'content', label: 'TEXTO', type: 'text', icon: 'TEXT' }
                ]
            },
            {
                id: 'TYPOGRAPHY',
                name: 'TIPOGRAFIA',
                defaultOpen: true,
                fields: [
                    { id: 'textPreset', label: 'PREAJUSTE', type: 'select', icon: 'LAYOUT', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'paragraph', 'list-item', 'caption', 'memo'], compact: false },
                    { id: 'fontSize', label: 'TAMAÑO', type: 'unit', icon: 'TEXT_SIZE', compact: true, defaultUnit: 'pt' },
                    { id: 'fontWeight', label: 'PESO', type: 'select', icon: 'WEIGHT', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold'], compact: true },
                    { id: 'lineHeight', label: 'INTERLINEA', type: 'unit', icon: 'L_HEIGHT', compact: true },
                    { id: 'letterSpacing', label: 'ESPACIADO', type: 'unit', icon: 'L_SPACING', compact: true },
                    { id: 'color', label: 'COLOR', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'textAlign', label: 'ALINEACION', type: 'select', icon: 'ALIGN', options: ['left', 'center', 'right', 'justify'], compact: true },
                    { id: 'textTransform', label: 'MAYUSCULAS', type: 'select', icon: 'TEXT_SIZE', options: ['none', 'uppercase', 'lowercase', 'capitalize'], compact: true },
                    { id: 'fontFamily', label: 'FUENTE', type: 'font_select', icon: 'TEXT', compact: false }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'POSICION',
                defaultOpen: false,
                fields: [
                    { id: 'marginTop', label: 'MARGEN_SUP', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'marginBottom', label: 'MARGEN_INF', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'paddingLeft', label: 'PADDING_IZQ', type: 'unit', icon: 'SPACING', compact: true }
                ]
            },
            {
                id: 'POSITIONING',
                name: 'POSICIONAMIENTO',
                defaultOpen: false,
                fields: [
                    { id: 'layoutMode', label: 'MODO', type: 'select', icon: 'MOVE', options: ['flow', 'absolute'], compact: true },
                    { id: 'top', label: 'TOP', type: 'unit', icon: 'ARROW_UP', compact: true },
                    { id: 'left', label: 'LEFT', type: 'unit', icon: 'ARROW_LEFT', compact: true },
                    { id: 'right', label: 'RIGHT', type: 'unit', icon: 'ARROW_RIGHT', compact: true },
                    { id: 'bottom', label: 'BOTTOM', type: 'unit', icon: 'ARROW_DOWN', compact: true },
                    { id: 'zIndex', label: 'CAPA_Z', type: 'text', icon: 'LAYERS', compact: true }
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    IMAGE: {
        icon: 'IMAGE',
        sections: [
            {
                id: 'SOURCE',
                name: 'REFERENCIA_RECURSO',
                defaultOpen: true,
                fields: [
                    { id: 'strategy', label: 'ESTRATEGIA', type: 'select', icon: 'LINK', options: ['DIRECT_URL', 'BY_ID', 'BY_NAME_IN_CONTAINER'], data: 'ADR-024: estrategia universal MEDIA_RESOLVE' },
                    { id: 'provider', label: 'PROVEEDOR', type: 'select', icon: 'CLOUD', options: ['drive', 'notion', 'opfs', 'url'], data: 'Proveedor de almacenamiento (agnóstico)' },
                    { id: 'src', label: 'URL_DIRECTA', type: 'text', icon: 'LINK', data: 'Para DIRECT_URL: URL canónica completa' }
                    ,{ id: 'container_ref', label: 'ID_CONTENEDOR', type: 'text', icon: 'FOLDER', data: 'Para BY_NAME_IN_CONTAINER: ID de carpeta/página' }
                    ,{ id: 'asset_name', label: 'NOMBRE_RECURSO', type: 'text', icon: 'SEARCH', data: 'Para BY_NAME_IN_CONTAINER: nombre de archivo/recurso' }
                    ,{ id: 'asset_id', label: 'ID_RECURSO', type: 'text', icon: 'ID', data: 'Para BY_ID: ID de archivo/recurso' }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'GEOMETRIA',
                defaultOpen: true,
                fields: [
                    { id: 'width', label: 'ANCHO', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'px' },
                    { id: 'height', label: 'ALTO', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'px' },
                    { id: 'borderRadius', label: 'RADIO', type: 'unit', icon: 'RADIUS', compact: true },
                    { id: 'objectFit', label: 'AJUSTE', type: 'select', icon: 'EXPAND', options: ['cover', 'contain', 'fill'], compact: true }
                ]
            },
            {
                id: 'POSITIONING',
                name: 'POSICIONAMIENTO',
                defaultOpen: false,
                fields: [
                    { id: 'layoutMode', label: 'MODO', type: 'select', icon: 'MOVE', options: ['flow', 'absolute'], compact: true },
                    { id: 'top', label: 'TOP', type: 'unit', icon: 'ARROW_UP', compact: true },
                    { id: 'left', label: 'LEFT', type: 'unit', icon: 'ARROW_LEFT', compact: true },
                    { id: 'right', label: 'RIGHT', type: 'unit', icon: 'ARROW_RIGHT', compact: true },
                    { id: 'bottom', label: 'BOTTOM', type: 'unit', icon: 'ARROW_DOWN', compact: true },
                    { id: 'zIndex', label: 'CAPA_Z', type: 'text', icon: 'LAYERS', compact: true }
                ]
            }
        ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    ITERATOR: {
        icon: 'REPEATER',
        sections: [
            {
                id: 'DATA',
                name: 'FLUJO_DATOS',
                defaultOpen: true,
                fields: [
                    { id: 'source', label: 'FUENTE', type: 'text', icon: 'LINK' }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'GEOMETRIA_REPETIDOR',
                defaultOpen: true,
                fields: [
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'columns', label: 'COLUMNAS', type: 'unit', icon: 'ALIGN', compact: true }
                ]
            }
        ]
    }
};
