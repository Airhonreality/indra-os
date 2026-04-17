/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/renderer/RecursiveBlock.jsx
 * RESPONSABILIDAD: Engine de renderizado recursivo basado en Flexbox (AutoLayout).
 * =============================================================================
 */

import React from 'react';
import FrameBlock from '../blocks/FrameBlock';
import TextBlock from '../blocks/TextBlock';
import ImageBlock from '../blocks/ImageBlock';
import IteratorBlock from '../blocks/IteratorBlock';
import PageBlock from '../blocks/PageBlock';

import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { assertBlockContract } from '../contracts/assertBlockContract';

const BLOCK_COMPONENTS = {
    PAGE: PageBlock,
    FRAME: FrameBlock,
    TEXT: TextBlock,
    IMAGE: ImageBlock,
    ITERATOR: IteratorBlock
};

const assertValidBlockContract = (block) => {
    // Reutilizamos el contrato canónico para toda la familia de bloques.
    assertBlockContract('RecursiveBlock', block);

    if (block.children !== undefined && !Array.isArray(block.children)) {
        throw new Error(`[RecursiveBlock] Contrato inválido en block ${block.id}: \`block.children\` debe ser un array cuando existe.`);
    }
};

export function RecursiveBlock({ block, depth = 0, pageIndex = 1, readOnly = false, keyPrefix = '', bridge = null }) {
    assertValidBlockContract(block);

    const { updateNode } = useAST();
    const { selectedId, selectNode, setHover, hoveredId } = useSelection();

    const isSelected = !readOnly && selectedId === block.id;
    const isHovered = !readOnly && hoveredId === block.id;

    const Component = BLOCK_COMPONENTS[block.type];
    const hasChildren = block.children && block.children.length > 0;
    const supportsAbsolute = ['FRAME', 'TEXT', 'IMAGE'].includes(block.type);
    const isAbsolute = supportsAbsolute && block.props?.layoutMode === 'absolute';
    const parsedZIndex = Number.parseInt(String(block.props?.zIndex), 10);
    const nodeZIndex = Number.isFinite(parsedZIndex) ? parsedZIndex : 1;

    if (!Component) {
        return <div style={{ color: 'red' }}>[UNKNOWN_BLOCK_TYPE: {block.type}]</div>;
    }

    // Axioma de independencia: páginas virtuales de continuidad no aceptan interacción.
    return (
        <div
            onClick={(e) => {
                if (readOnly) return;
                if (!isSelected) {
                    if (block.type !== 'TEXT') e.stopPropagation();
                    selectNode(block.id);
                }
            }}
            onMouseEnter={() => { if (!readOnly) setHover(block.id); }}
            onMouseLeave={() => { if (!readOnly) setHover(null); }}
            className="block-wrapper"
            style={{
                position: isAbsolute ? 'absolute' : 'relative',
                top: isAbsolute ? (block.props?.top || '0px') : undefined,
                left: isAbsolute ? (block.props?.left || '0px') : undefined,
                right: isAbsolute ? (block.props?.right || undefined) : undefined,
                bottom: isAbsolute ? (block.props?.bottom || undefined) : undefined,
                cursor: readOnly ? 'default' : 'pointer',
                pointerEvents: readOnly ? 'none' : 'auto',
                outline: isSelected ? '1px solid var(--color-accent)' :
                    isHovered ? '1px dashed var(--color-border-strong)' : '1px dashed transparent',
                outlineOffset: '-1px',
                transition: 'outline var(--transition-fast)',
                zIndex: isSelected ? Math.max(nodeZIndex, 10) : nodeZIndex
            }}
        >
            <Component
                block={block}
                isSelected={isSelected}
                updateNode={updateNode}
                pageIndex={pageIndex}
                bridge={bridge}
            >
                {hasChildren && (
                    block.children.map(child => (
                        <RecursiveBlock
                            key={`${keyPrefix}${child.id}`}
                            block={child}
                            depth={depth + 1}
                            pageIndex={pageIndex}
                            readOnly={readOnly}
                            keyPrefix={keyPrefix}
                            bridge={bridge}
                        />
                    ))
                )}
            </Component>

            {/* Marcador de tipo solo en modo selección o profundidad baja */}
            {isSelected && !readOnly && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '-14px',
                        left: '0',
                        background: 'var(--color-accent)',
                        color: 'var(--color-bg-void)',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        fontFamily: 'var(--font-mono)',
                        zIndex: 10,
                        textTransform: 'uppercase',
                        borderRadius: '2px 2px 0 0'
                    }}>
                        {block.type}
                    </div>
                    {/* Corner Handles (Visual only for now) */}
                    {[
                        { top: -4, left: -4 }, { top: -4, right: -4 },
                        { bottom: -4, left: -4 }, { bottom: -4, right: -4 },
                        { top: '50%', left: -4, marginTop: -4 }, { top: '50%', right: -4, marginTop: -4 },
                        { top: -4, left: '50%', marginLeft: -4 }, { bottom: -4, left: '50%', marginLeft: -4 }
                    ].map((h, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            width: '8px',
                            height: '8px',
                            background: 'white',
                            border: '1px solid var(--color-accent)',
                            zIndex: 11,
                            ...h
                        }} />
                    ))}
                </>
            )}
        </div>
    );
}
