/**
 * FocusMode.jsx
 * DHARMA: Indicador visual y control del modo de enfoque
 */

import React from 'react';

const FocusMode = ({ focusMode, onToggle, logs }) => {
    if (!focusMode.enabled || !focusMode.function) return null;

    const focusedLogsCount = logs.filter(log => log.function === focusMode.function).length;

    return (
        <div className="focus-mode-banner">
            <div className="focus-info">
                <span className="focus-icon">🎯</span>
                <span className="focus-label">FOCUS MODE ACTIVE:</span>
                <span className="focus-target">{focusMode.function}()</span>
                <span className="focus-count">({focusedLogsCount} related logs)</span>
            </div>
            <button
                className="focus-exit-btn"
                onClick={() => onToggle(focusMode.function)}
            >
                Exit Focus
            </button>
        </div>
    );
};

export default FocusMode;
