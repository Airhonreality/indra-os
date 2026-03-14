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
                    <div className="engine-hood__capsule" style={{ marginRight: 'var(--space-2)' }}>
                        <button 
                            className="engine-hood__btn" 
                            onClick={onUndo}
                            disabled={!canUndo} 
                            style={{ opacity: canUndo ? 1 : 0.3 }}
                            title="UNDO (Ctrl+Z)"
                        >
                            <IndraIcon name="UNDO" size="10px" color={canUndo ? "white" : "var(--color-text-tertiary)"} />
                        </button>
                        <button 
                            className="engine-hood__btn" 
                            onClick={onRedo}
                            disabled={!canRedo} 
                            style={{ opacity: canRedo ? 1 : 0.3 }}
                            title="REDO (Ctrl+Y)"
                        >
                            <IndraIcon name="REDO" size="10px" color={canRedo ? "white" : "var(--color-text-tertiary)"} />
                        </button>
                    </div>
                )}
                
                {onUndo || onRedo ? <div className="engine-hood__divider" /> : null}

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
