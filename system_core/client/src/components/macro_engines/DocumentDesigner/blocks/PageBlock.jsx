/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/blocks/PageBlock.jsx
 * RESPONSABILIDAD: Representación ontológica de una página física.
 * AXIOMA: Soberanía de impresión y visualización aislada.
 * =============================================================================
 */

import { useAxiomStyles } from '../hooks/useAxiomStyles';
import { assertBlockContract } from '../contracts/assertBlockContract';

const resolvePagePadding = (p) => {
    const top = p.marginTop || p.padding || '20mm';
    const right = p.marginRight || p.padding || '20mm';
    const bottom = p.marginBottom || p.padding || '20mm';
    const left = p.marginLeft || p.padding || '20mm';
    return `${top} ${right} ${bottom} ${left}`;
};

const buildPageFooter = (template, pageIndex) => {
    const raw = template || 'Página {{page}}';
    return raw.replace(/\{\{\s*page\s*\}\}/gi, String(pageIndex));
};

export function PageBlock({ block, children, isSelected, pageIndex = 1 }) {
    // Axioma de frontera: validar contrato antes de hidratar o renderizar.
    assertBlockContract('PageBlock', block);

    // HIDRATACIÓN SINCERA (The Figma Model)
    const { propsHidratadas, tieneDeriva } = useAxiomStyles(block.props);
    const p = propsHidratadas;
    const pagePadding = resolvePagePadding(p);

    const estiloFinal = {
        width: p.width || '210mm',
        minHeight: p.minHeight || '297mm',
        background: p.background || '#ffffff',
        padding: pagePadding,
        display: 'flex',
        flexDirection: p.direction || 'column',
        gap: p.gap || '10px',
        color: p.color || 'var(--honest-text)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1)',
        position: 'relative',
        margin: '40px auto',
        boxSizing: 'border-box',
        overflow: p.overflow || 'visible',
        transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)'
    };

    const bleed = p.bleed || '0mm';
    const showGuides = p.showPrintGuides !== false;
    const showPageNumber = p.showPageNumber !== false;
    const resolvedPageNumber = Number.isFinite(Number(p._resolvedPageNumber)) ? Number(p._resolvedPageNumber) : pageIndex;
    const isVirtualContinuation = p._virtualContinuation === true;
    const safeTop = p.safeTop || '0mm';
    const safeRight = p.safeRight || '0mm';
    const safeBottom = p.safeBottom || '0mm';
    const safeLeft = p.safeLeft || '0mm';
    const virtualSliceOffsetPx = Math.max(0, Number(p._virtualSliceOffsetPx) || 0);
    const virtualSliceHeightPx = Math.max(1, Number(p._virtualSliceHeightPx) || 1);

    return (
        <div
            className={`page-block ${isSelected ? 'selected' : ''} shadow-glow`}
            style={estiloFinal}
        >
            {/* Indicador de Deriva de Página */}
            {tieneDeriva && (
                <div 
                    title="DERIVA_DE_REALIDAD: La configuración de esta página no coincide con la marca actual."
                    style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 15px var(--color-accent)', zIndex: 10 }} 
                />
            )}

            {isVirtualContinuation ? (
                <div
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        height: `${virtualSliceHeightPx}px`,
                        minHeight: `${virtualSliceHeightPx}px`,
                        pointerEvents: 'none'
                    }}
                >
                    <div
                        style={{
                            transform: `translateY(-${virtualSliceOffsetPx}px)`,
                            transformOrigin: 'top left'
                        }}
                    >
                        {children}
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            border: '1px dashed rgba(0,0,0,0.25)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            ) : (
                children
            )}

            {p.headerTemplate && (
                <div
                    aria-label={`PAGE_HEADER_${resolvedPageNumber}`}
                    style={{
                        position: 'absolute',
                        top: `calc(6mm + ${p.pageNumberOffsetY || '0mm'})`,
                        left: `calc(6mm + ${p.pageNumberOffsetX || '0mm'})`,
                        fontSize: '8pt',
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(25, 25, 25, 0.6)',
                        letterSpacing: '0.03em'
                    }}
                >
                    {buildPageFooter(p.headerTemplate, resolvedPageNumber)}
                </div>
            )}

            {showGuides && (
                <>
                    {/* Overlay de bleed para impresión */}
                    {bleed !== '0mm' && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: `calc(${bleed} * -1)`,
                                left: `calc(${bleed} * -1)`,
                                right: `calc(${bleed} * -1)`,
                                bottom: `calc(${bleed} * -1)`,
                                border: '1px dashed rgba(255, 80, 80, 0.55)',
                                pointerEvents: 'none'
                            }}
                        />
                    )}

                    {/* Overlay de safe area */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: safeTop,
                            right: safeRight,
                            bottom: safeBottom,
                            left: safeLeft,
                            border: '1px dashed rgba(0, 245, 212, 0.42)',
                            pointerEvents: 'none'
                        }}
                    />
                </>
            )}

            {showPageNumber && (
                <div
                    aria-label={`PAGE_NUMBER_${resolvedPageNumber}`}
                    style={{
                        position: 'absolute',
                        bottom: `calc(6mm + ${p.pageNumberOffsetY || '0mm'})`,
                        right: `calc(6mm + ${p.pageNumberOffsetX || '0mm'})`,
                        fontSize: '8pt',
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(25, 25, 25, 0.6)',
                        letterSpacing: '0.03em'
                    }}
                >
                    {buildPageFooter(p.footerTemplate, resolvedPageNumber)}
                </div>
            )}

            {/* Etiqueta de Página Sincera */}
            <div style={{
                position: 'absolute',
                top: '-25px',
                left: '0',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--honest-accent)',
                opacity: 0.8,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                fontWeight: '900'
            }}>
                CANON_PAGINA // {p.width} x {p.minHeight} {isVirtualContinuation ? `// CONT_${p._virtualContinuationIndex}/${p._virtualContinuationTotal}` : ''}
            </div>
        </div>
    );
}

PageBlock.manifest = {
    type: 'PAGE',
    sections: [
        {
            name: 'GEOMETRÍA_PÁGINA',
            fields: [
                { id: 'width', label: 'ANCHO', type: 'unit' },
                { id: 'minHeight', label: 'ALTO_MIN', type: 'unit' },
                { id: 'background', label: 'COLOR_PÁGINA', type: 'color' },
                { id: 'overflow', label: 'DESBORDAMIENTO', type: 'select', options: ['visible', 'hidden', 'auto'] }
            ]
        },
        {
            name: 'LAYOUT_PÁGINA',
            fields: [
                { id: 'direction', label: 'DIRECCIÓN', type: 'select', options: ['row', 'column'] },
                { id: 'padding', label: 'MÁRGENES', type: 'unit' },
                { id: 'gap', label: 'ESPACIO_BLOQUES', type: 'unit' }
            ]
        }
    ]
};
export default PageBlock;
