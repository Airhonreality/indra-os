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

const BLOCK_COMPONENTS = {
    'FRAME': FrameBlock,
    'TEXT': TextBlock,
    'IMAGE': ImageBlock,
    'ITERATOR': IteratorBlock
};

export function RecursiveBlock({ block, isSelected, onSelect, depth = 0 }) {
    const Component = BLOCK_COMPONENTS[block.type];

    if (!Component) {
        return <div style={{ color: 'red' }}>[UNKNOWN_BLOCK_TYPE: {block.type}]</div>;
    }

    // El Wrapper se encarga de la selección y el Outline estético
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.id);
            }}
            className="block-wrapper"
            style={{
                position: 'relative',
                cursor: 'pointer',
                outline: isSelected ? '1px solid var(--color-accent)' : '1px dashed transparent',
                outlineOffset: '-1px',
                transition: 'outline var(--transition-fast)',
                // Hover sutil si no está seleccionado
                ...(!isSelected && {
                    ':hover': { outline: '1px dashed var(--color-border-strong)' }
                })
            }}
        >
            <Component
                props={block.props}
                isSelected={isSelected}
            >
                {block.children && (block.type === 'ITERATOR' ? [1, 2, 3] : [1]).map((_, iterIdx) => (
                    <React.Fragment key={iterIdx}>
                        {block.children.map(child => (
                            <RecursiveBlock
                                key={`${child.id}-${iterIdx}`}
                                block={child}
                                isSelected={false}
                                onSelect={onSelect}
                                depth={depth + 1}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </Component>

            {/* Marcador de tipo solo en modo selección o profundidad baja */}
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '0',
                    background: 'var(--color-accent)',
                    color: 'var(--color-bg-void)',
                    fontSize: '8px',
                    padding: '1px 4px',
                    fontFamily: 'var(--font-mono)',
                    zIndex: 10,
                    textTransform: 'uppercase'
                }}>
                    {block.type}
                </div>
            )}
        </div>
    );
}
