import React from 'react';
import { IndraIcon } from './IndraIcons';

/**
 * IndraEngineHood
 * 
 * Bar containing module-specific actions, positioned below the IndraMacroHeader.
 * 
 * Props:
 *   leftSlot    - ReactNode: Specific tools for the current engine.
 *   centerSlot  - ReactNode: Optional center controls.
 *   rightSlot   - ReactNode: Secondary tools, status tags, etc.
 *   onUndo      - function: (Optional) Undo action.
 *   onRedo      - function: (Optional) Redo action.
 *   canUndo     - boolean: (Optional) If undo is available.
 *   canRedo     - boolean: (Optional) If redo is available.
 */
export function IndraEngineHood({
    leftSlot,
    centerSlot,
    rightSlot,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false
}) {
    return (
        <div className="engine-hood">
            <div className="engine-hood__section">
                {/* Standard History Controls in the Hood */}
                {(onUndo || onRedo) && (
                    <div className="engine-hood__capsule shelf--tight" style={{ marginRight: 'var(--space-2)' }}>
                        <button 
                            className="btn btn--mini" 
                            onClick={onUndo}
                            disabled={!canUndo} 
                            style={{ 
                                opacity: canUndo ? 0.7 : 0.1,
                                width: '32px',
                                height: '32px'
                            }}
                            title="UNDO (Ctrl+Z)"
                        >
                            <IndraIcon name="UNDO" size="12px" color={canUndo ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
                        </button>
                        <button 
                            className="btn btn--mini" 
                            onClick={onRedo}
                            disabled={!canRedo} 
                            style={{ 
                                opacity: canRedo ? 0.7 : 0.1,
                                width: '32px',
                                height: '32px'
                            }}
                            title="REDO (Ctrl+Y)"
                        >
                            <IndraIcon name="REDO" size="12px" color={canRedo ? "var(--color-text-primary)" : "var(--color-text-tertiary)"} />
                        </button>
                    </div>
                )}
                
                {onUndo || onRedo ? <div className="engine-hood__divider" style={{height: '20px'}} /> : null}

                {leftSlot}
            </div>

            <div className="engine-hood__section">
                {centerSlot}
            </div>

            <div className="engine-hood__section">
                {rightSlot}
            </div>
        </div>
    );
}
