/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/renderer/RecursiveBlock.jsx
 * RESPONSABILIDAD: Engine de renderizado recursivo basado en Flexbox (AutoLayout).
 * =============================================================================
 */

import React from 'react';
import { FrameBlock } from '../blocks/FrameBlock';
import { TextBlock } from '../blocks/TextBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { IteratorBlock } from '../blocks/IteratorBlock';

import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { UnitTranslator } from '../../../../services/UnitTranslator';

const BLOCK_COMPONENTS = {
    'FRAME': FrameBlock,
    'TEXT': TextBlock,
    'IMAGE': ImageBlock,
    'ITERATOR': IteratorBlock
};

// Helper para procesar estilos axiomáticos
const processStyles = (props = {}) => {
    const styled = {};
    const pxProps = ['width', 'height', 'minWidth', 'minHeight', 'padding', 'margin', 'gap', 'fontSize', 'borderRadius', 'top', 'left', 'right', 'bottom', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];

    Object.entries(props).forEach(([key, value]) => {
        if (pxProps.includes(key) && value && typeof value === 'string') {
            styled[key] = UnitTranslator.parseToPx(value);
        } else {
            styled[key] = value;
        }
    });
    return styled;
};

export function RecursiveBlock({ block, depth = 0 }) {
    const { updateNode } = useAST();
    const { selectedId, selectNode, setHover, hoveredId } = useSelection();

    const isSelected = selectedId === block.id;
    const isHovered = hoveredId === block.id;

    const Component = BLOCK_COMPONENTS[block.type];
    const hasChildren = block.children && block.children.length > 0;

    if (!Component) {
        return <div style={{ color: 'red' }}>[UNKNOWN_BLOCK_TYPE: {block.type}]</div>;
    }

    // El Wrapper se encarga de la selección y el Outline estético
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                selectNode(block.id);
            }}
            onMouseEnter={() => setHover(block.id)}
            onMouseLeave={() => setHover(null)}
            className="block-wrapper"
            style={{
                position: 'relative',
                cursor: 'pointer',
                outline: isSelected ? '1px solid var(--color-accent)' :
                    isHovered ? '1px dashed var(--color-border-strong)' : '1px dashed transparent',
                outlineOffset: '-1px',
                transition: 'outline var(--transition-fast)',
                zIndex: isSelected ? 10 : 1
            }}
        >
            <Component
                props={processStyles(block.props)}
                isSelected={isSelected}
                onUpdate={(newProps) => updateNode(block.id, { props: { ...block.props, ...newProps } })}
            >
                {hasChildren && (block.type === 'ITERATOR' ? [1, 2, 3] : [1]).flatMap((_, iterIdx) => (
                    block.children.map(child => (
                        <RecursiveBlock
                            key={`${child.id}-${iterIdx}`}
                            block={child}
                            depth={depth + 1}
                        />
                    ))
                ))}
            </Component>

            {/* Marcador de tipo solo en modo selección o profundidad baja */}
            {isSelected && (
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
