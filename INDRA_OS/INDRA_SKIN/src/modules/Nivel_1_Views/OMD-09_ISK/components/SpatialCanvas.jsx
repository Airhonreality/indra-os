/**
 * 🎨 SPATIAL CANVAS (Zone B) - Versión 2.1 "Axiomatic Engine"
 * 
 * SOBERANÍA: Implementación Canonizada según ISK_Structural_Law.
 * Utiliza tokens CSS maestros de stark_theme.css.
 */

import React, { useState, useEffect, useRef } from 'react';
import './SpatialCanvas.css';

export const SpatialCanvas = () => {
    const [entities, setEntities] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [canvasScale, setCanvasScale] = useState(1);
    const [viewMode, setViewMode] = useState('INFINITE'); // De la Ley 9.1
    const stageRef = useRef(null);

    // --- ESCUCHA DE REALIDAD (Módulos externos) ---
    useEffect(() => {
        const handleSpawn = (e) => {
            const { type, x, y } = e.detail;
            const newEntity = {
                id: `ent_${Date.now()}`,
                type,
                x: x || 100,
                y: y || 100,
                w: 120,
                h: 80,
                fill: 'var(--accent-primary)',
                label: `New ${type}`,
                opacity: 0.9,
                links: []
            };
            setEntities(prev => [...prev, newEntity]);
        };

        window.addEventListener('isk-spawn-entity', handleSpawn);
        return () => window.removeEventListener('isk-spawn-entity', handleSpawn);
    }, [entities.length]);

    // --- SELECCIÓN Y EMISIÓN (Traducción a Pivotes de la Ley) ---
    const handleSelect = (id) => {
        setSelectedId(id);
        const entity = entities.find(e => e.id === id);

        // Emisión CANÓNICA alineada con el Inspector Pivot System
        window.dispatchEvent(new CustomEvent('isk-entity-selected', {
            detail: {
                id: entity.id,
                type: entity.type,
                // Estructura de pivotes según ley 9.2
                pivots: {
                    GEOMETRY: {
                        transform: { x: entity.x, y: entity.y, z: 0 },
                        dimension: { w: entity.w, h: entity.h },
                        style: { fill: entity.fill, opacity: entity.opacity }
                    },
                    REACTION: {
                        logic: { label: entity.label },
                        links: entity.links
                    },
                    ASSETS: {
                        image: { src: '' }
                    }
                }
            }
        }));
    };

    return (
        <div
            className={`spatial-stage ${viewMode.toLowerCase()}`}
            ref={stageRef}
            onClick={() => setSelectedId(null)}
        >
            <div className="canvas-grid-overlay"></div>

            <div className="entities-layer" style={{ transform: `scale(${canvasScale})` }}>
                {entities.map(ent => (
                    <div
                        key={ent.id}
                        className={`spatial-entity ${ent.type.toLowerCase()} ${selectedId === ent.id ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSelect(ent.id); }}
                        style={{
                            left: ent.x,
                            top: ent.y,
                            width: ent.w,
                            height: ent.h,
                            backgroundColor: ent.fill,
                            opacity: ent.opacity
                        }}
                    >
                        <span className="entity-label">{ent.label}</span>
                    </div>
                ))}
            </div>

            <div className="canvas-viewport-hud glass">
                <span className="mode-indicator">{viewMode} VIEW</span>
                <div className="hud-controls">
                    <button onClick={() => setCanvasScale(s => Math.min(s + 0.1, 2))}>+</button>
                    <button onClick={() => setCanvasScale(s => Math.max(s - 0.1, 0.5))}>-</button>
                    <button onClick={() => setViewMode(v => v === 'INFINITE' ? 'PAGED' : 'INFINITE')}>⚡</button>
                </div>
            </div>
        </div>
    );
};

export default SpatialCanvas;
