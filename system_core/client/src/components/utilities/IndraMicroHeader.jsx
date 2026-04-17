import React from 'react';
import { IndraIcon } from './IndraIcons';

/**
 * IndraMicroHeader
 * Cabecera canónica para sub-paneles y micro-motores.
 * Basada en el estandard "White-Bone Glass".
 */
export function IndraMicroHeader({
    label,
    icon,
    onExecute,
    executeLabel,
    description,
    metadata
}) {
    return (
        <header className="micro-header glass--bone">
            <div className="micro-header__id stack--tight fill">
                <div className="shelf--tight">
                    {icon && <IndraIcon name={icon} size="14px" className="color-accent" style={{ opacity: 0.6 }} />}
                    <h3 className="micro-header__title">{label}</h3>
                </div>
                {description && <p className="micro-header__description" title={description}>{description}</p>}
                {metadata && <span className="micro-header__meta">{metadata}</span>}
            </div>

            {onExecute && (
                <button
                    className="btn btn--white btn--xs micro-header__action"
                    onClick={onExecute}
                    title={`EXECUTE: ${executeLabel || label}`}
                >
                    {executeLabel || 'EXECUTE'}
                </button>
            )}
        </header>
    );
}
