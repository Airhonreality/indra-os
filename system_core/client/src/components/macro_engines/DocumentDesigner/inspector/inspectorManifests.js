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
                name: 'PAGE_FORMAT',
                defaultOpen: true,
                fields: [
                    { id: 'preset', label: 'PRESET', type: 'select', icon: 'LAYOUT', options: ['A4', 'LETTER', 'SQUARE', 'CUSTOM'], compact: false },
                    { id: 'orientation', label: 'ORIENT', type: 'select', icon: 'ALIGN', options: ['portrait', 'landscape'], compact: true },
                    { id: 'width', label: 'WIDTH', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'mm' },
                    { id: 'minHeight', label: 'HEIGHT', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'mm' }
                ]
            },
            {
                id: 'SURFACE',
                name: 'PAGE_SURFACE',
                defaultOpen: true,
                fields: [
                    { id: 'background', label: 'BG', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'padding', label: 'PAD', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'direction', label: 'DIR', type: 'select', icon: 'ALIGN', options: ['column', 'row'], compact: true }
                ]
            },
            {
                id: 'PRINT',
                name: 'PRINT_GUIDES',
                defaultOpen: false,
                fields: [
                    { id: 'bleed', label: 'BLEED', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginTop', label: 'MAR_T', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginRight', label: 'MAR_R', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginBottom', label: 'MAR_B', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'marginLeft', label: 'MAR_L', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeTop', label: 'SAFE_T', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeRight', label: 'SAFE_R', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeBottom', label: 'SAFE_B', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'safeLeft', label: 'SAFE_L', type: 'unit', icon: 'SPACING', compact: true, defaultUnit: 'mm' },
                    { id: 'showPrintGuides', label: 'GUIDES', type: 'boolean', icon: 'TARGET', compact: true },
                    { id: 'showPageNumber', label: 'NUMBER', type: 'boolean', icon: 'TEXT', compact: true }
                ]
            },
            {
                id: 'PAGINATION',
                name: 'PAGINATION',
                defaultOpen: false,
                fields: [
                    { id: 'paginationMode', label: 'MODE', type: 'select', icon: 'REPEATER', options: ['hybrid', 'auto', 'manual'], compact: true },
                    { id: 'pageBreakBefore', label: 'BREAK_B', type: 'boolean', icon: 'ARROW_UP', compact: true },
                    { id: 'pageBreakAfter', label: 'BREAK_A', type: 'boolean', icon: 'ARROW_DOWN', compact: true },
                    { id: 'footerTemplate', label: 'FOOTER', type: 'text', icon: 'TEXT', compact: false },
                    { id: 'headerTemplate', label: 'HEADER', type: 'text', icon: 'TEXT', compact: false }
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
                name: 'GEOMETRY',
                defaultOpen: true,
                fields: [
                    { id: 'width', label: 'WIDTH', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'px' },
                    { id: 'minHeight', label: 'HEIGHT', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'px' },
                    { id: 'padding', label: 'PAD', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'direction', label: 'DIR', type: 'select', icon: 'ALIGN', options: ['column', 'row'], compact: true },
                    { id: 'borderRadius', label: 'RAD', type: 'unit', icon: 'RADIUS', compact: true }
                ]
            },
            {
                id: 'SURFACE',
                name: 'SURFACE',
                defaultOpen: false,
                fields: [
                    { id: 'background', label: 'BG', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'borderColor', label: 'STK', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'borderWidth', label: 'STRK', type: 'unit', icon: 'HEIGHT', compact: true }
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
                name: 'COPY_CORE',
                defaultOpen: true,
                fields: [
                    { id: 'content', label: 'CONTENT', type: 'text', icon: 'TEXT' }
                ]
            },
            {
                id: 'TYPOGRAPHY',
                name: 'VIBE_TYPE',
                defaultOpen: true,
                fields: [
                    { id: 'textPreset', label: 'PRESET', type: 'select', icon: 'LAYOUT', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'paragraph', 'list-item', 'caption', 'memo'], compact: false },
                    { id: 'fontSize', label: 'SIZE', type: 'unit', icon: 'TEXT_SIZE', compact: true, defaultUnit: 'pt' },
                    { id: 'fontWeight', label: 'WGHT', type: 'select', icon: 'WEIGHT', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold'], compact: true },
                    { id: 'lineHeight', label: 'L_H', type: 'unit', icon: 'L_HEIGHT', compact: true },
                    { id: 'letterSpacing', label: 'L_S', type: 'unit', icon: 'L_SPACING', compact: true },
                    { id: 'color', label: 'INK', type: 'color', icon: 'PALETTE', compact: true },
                    { id: 'textAlign', label: 'ALIGN', type: 'select', icon: 'ALIGN', options: ['left', 'center', 'right', 'justify'], compact: true },
                    { id: 'textTransform', label: 'CASE', type: 'select', icon: 'TEXT_SIZE', options: ['none', 'uppercase', 'lowercase', 'capitalize'], compact: true },
                    { id: 'fontFamily', label: 'FONT', type: 'text', icon: 'TEXT', compact: false }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'POSITION',
                defaultOpen: false,
                fields: [
                    { id: 'marginTop', label: 'MAR_T', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'marginBottom', label: 'MAR_B', type: 'unit', icon: 'SPACING', compact: true },
                    { id: 'paddingLeft', label: 'PAD_L', type: 'unit', icon: 'SPACING', compact: true }
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
                name: 'ASSET_REF',
                defaultOpen: true,
                fields: [
                    { id: 'src', label: 'SOURCE_ID', type: 'text', icon: 'LINK' }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'GEOMETRY',
                defaultOpen: true,
                fields: [
                    { id: 'width', label: 'WIDTH', type: 'unit', icon: 'WIDTH', compact: true, defaultUnit: 'px' },
                    { id: 'height', label: 'HEIGHT', type: 'unit', icon: 'HEIGHT', compact: true, defaultUnit: 'px' },
                    { id: 'borderRadius', label: 'RAD', type: 'unit', icon: 'RADIUS', compact: true },
                    { id: 'objectFit', label: 'FIT', type: 'select', icon: 'EXPAND', options: ['cover', 'contain', 'fill'], compact: true }
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
                name: 'DATA_STREAM',
                defaultOpen: true,
                fields: [
                    { id: 'source', label: 'RECO_SOURCE', type: 'text', icon: 'LINK' }
                ]
            },
            {
                id: 'LAYOUT',
                name: 'REPEATER_GEOM',
                defaultOpen: true,
                fields: [
                    { id: 'gap', label: 'GAP', type: 'unit', icon: 'GAP', compact: true },
                    { id: 'columns', label: 'COLS', type: 'unit', icon: 'ALIGN', compact: true }
                ]
            }
        ]
    }
};
