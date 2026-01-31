/**
 * 🔍 UCI (UNIFIED CONTEXT INSPECTOR) - Versión 3.0 "Pivot Engine"
 * 
 * SOBERANÍA: Inspector Universal que adapta su UI según la Ley del Módulo.
 * Estructura: Geometry (Cuerpo) | Reaction (Alma) | Assets (Sustrato).
 */

import React, { useState, useEffect } from 'react';
import './ContextInspector.css';

export const ContextInspector = () => {
    const [selection, setSelection] = useState(null);
    const [activePivot, setActivePivot] = useState('GEOMETRY');

    useEffect(() => {
        const handleSelection = (e) => {
            setSelection(e.detail);
            // Si el objeto tiene pivotes definidos, nos aseguramos de estar en uno válido
            if (e.detail.pivots && !e.detail.pivots[activePivot]) {
                setActivePivot(Object.keys(e.detail.pivots)[0]);
            }
        };

        window.addEventListener('isk-entity-selected', handleSelection);
        return () => window.removeEventListener('isk-entity-selected', handleSelection);
    }, [activePivot]);

    if (!selection) {
        return (
            <div className="uci-container empty">
                <div className="uci-ghost-overlay">SELECCIONAR ENTIDAD PARA INSPECCIONAR</div>
            </div>
        );
    }

    const { pivots, type, id } = selection;

    return (
        <div className="uci-container">
            {/* --- IDENTITY PIVOT --- */}
            <div className="uci-header">
                <div className="archetype-avatar">{type[0]}</div>
                <div className="identity-info">
                    <div className="instance-id">{id}</div>
                    <div className="archetype-label">{type} ARCHETYPE</div>
                </div>
                <div className="integrity-status pure"></div>
            </div>

            {/* --- PIVOT TABS (Geometry / Reaction / Assets) --- */}
            <div className="uci-tabs">
                {Object.keys(pivots).map(p => (
                    <button
                        key={p}
                        className={`uci-tab ${activePivot === p ? 'active' : ''}`}
                        onClick={() => setActivePivot(p)}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* --- DYNAMIC CONTENT BASED ON PIVOT --- */}
            <div className="uci-content-scroll scroll-stark">
                {activePivot === 'GEOMETRY' && (
                    <div className="pivot-section">
                        <Section title="TRANSFORM">
                            <Field label="X" value={pivots.GEOMETRY.transform.x} />
                            <Field label="Y" value={pivots.GEOMETRY.transform.y} />
                        </Section>
                        <Section title="DIMENSION">
                            <Field label="WIDTH" value={pivots.GEOMETRY.dimension.w} />
                            <Field label="HEIGHT" value={pivots.GEOMETRY.dimension.h} />
                        </Section>
                        <Section title="STYLE">
                            <Field label="COLOR" type="color" value={pivots.GEOMETRY.style.fill} />
                            <Field label="OPACITY" type="range" value={pivots.GEOMETRY.style.opacity} />
                        </Section>
                    </div>
                )}

                {activePivot === 'REACTION' && (
                    <div className="pivot-section">
                        <Section title="LOGIC GATE">
                            <Field label="LABEL" value={pivots.REACTION.logic.label} />
                        </Section>
                        <Section title="DATA LINKS">
                            <div className="link-drop-zone">Arrastrar variables aquí...</div>
                        </Section>
                    </div>
                )}

                {activePivot === 'ASSETS' && (
                    <div className="pivot-section">
                        <Section title="IMAGE MASTER">
                            <button className="stark-btn-secondary">CARGAR RECURSO</button>
                        </Section>
                    </div>
                )}
            </div>

            <div className="uci-footer">
                <button className="stark-btn-commit">MANIFESTAR CAMBIOS</button>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---
const Section = ({ title, children }) => (
    <div className="uci-section">
        <div className="uci-section-title">{title}</div>
        {children}
    </div>
);

const Field = ({ label, value, type = 'text' }) => (
    <div className="uci-field-grid">
        <label>{label}</label>
        <input
            type={type}
            className="stark-input-compact"
            defaultValue={value}
            step={type === 'range' ? 0.1 : 1}
            min={0} max={1}
        />
    </div>
);

export default ContextInspector;
