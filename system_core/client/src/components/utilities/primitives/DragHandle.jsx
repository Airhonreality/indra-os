/**
 * =============================================================================
 * PRIMITIVA: DragHandle.jsx
 * RESPONSABILIDAD: Handle visual de arrastre canónico.
 *
 * Consolida el icono DRAG disperso en FieldList y OperatorCard.
 * Emite onMouseDown para iniciar el drag en el componente padre.
 *
 * PROPS:
 *   onMouseDown — fn(e): handler de arrastre del padre
 *   size        — string: tamaño del ícono. Default: '12px'
 *   style       — object: estilos adicionales
 * =============================================================================
 */
import { IndraIcon } from '../IndraIcons';

export function DragHandle({ onMouseDown, size = '12px', style = {} }) {
    return (
        <div
            className="drag-handle"
            onMouseDown={onMouseDown}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                opacity: 0.3,
                padding: '2px',
                flexShrink: 0,
                transition: 'opacity 0.15s ease',
                ...style,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
        >
            <IndraIcon name="DRAG" size={size} />
        </div>
    );
}
