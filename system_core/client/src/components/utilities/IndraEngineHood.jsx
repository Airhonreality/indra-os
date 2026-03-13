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
                    <div className="shelf--tight" style={{ marginRight: 'var(--space-4)' }}>
                        <button 
                            className="btn btn--ghost btn--xs" 
                            onClick={onUndo}
                            disabled={!canUndo} 
                            style={{ opacity: canUndo ? 1 : 0.2 }}
                            title="UNDO (Ctrl+Z)"
                        >
                            <IndraIcon name="UNDO" size="12px" />
                        </button>
                        <button 
                            className="btn btn--ghost btn--xs" 
                            onClick={onRedo}
                            disabled={!canRedo} 
                            style={{ opacity: canRedo ? 1 : 0.2 }}
                            title="REDO (Ctrl+Y)"
                        >
                            <IndraIcon name="REDO" size="12px" />
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
