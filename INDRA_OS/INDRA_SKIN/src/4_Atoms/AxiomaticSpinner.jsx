/**
 * AxiomaticSpinner.jsx
 * ATOM: El Latido del Sistema.
 * DHARMA: Representación visual unificada de la resonancia cuántica.
 */

import React from 'react';
import './AxiomaticSpinner.css';

const AxiomaticSpinner = ({ size = 64, label = "Initializing..." }) => {
    return (
        <div className="axiomatic-spinner-container" style={{ '--spinner-size': `${size}px` }}>
            <div className="spinner-wrapper">
                {/* Anillo Exterior (Rápido) */}
                <div className="spinner-ring ring-outer"></div>
                {/* Anillo Interior (Contrarrotación) */}
                <div className="spinner-ring ring-inner"></div>
                {/* Núcleo de Singularidad */}
                <div className="spinner-core"></div>
            </div>
            {label && (
                <div className="spinner-footer">
                    <span className="spinner-label-text">{label}</span>
                    <div className="spinner-progress-tracks">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AxiomaticSpinner;

