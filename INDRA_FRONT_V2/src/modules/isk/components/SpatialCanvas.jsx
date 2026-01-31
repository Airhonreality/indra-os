/**
 * 🎨 SPATIAL CANVAS (Zone B)
 * Main Stage: React-DOM rendition engine for rapid prototyping.
 * Supports Entity Spawning and Selection.
 */

import React, { useState, useEffect, useRef } from 'react';
import './SpatialCanvas.css';

// Generador UUID simple
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

export const SpatialCanvas = () => {
    const [entities, setEntities] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const stageRef = useRef(null);

    // --- 1. THE SPAWNER LISTENER ---
    useEffect(() => {
        const handleSpawn = (e) => {
            const { type } = e.detail;

            // Definir propiedades iniciales (Primitive Factory)
            const newEntity = {
                id: uuidv4(),
                type: type,
                x: 400, // Centro aproximado (harcodeado por ahora)
                y: 300,
                width: 100,
                height: type === 'ELLIPSE' ? 100 : 80,
                fill: '#0ea5e9', // Indra Blue
                text: type === 'TEXT' ? 'Hello World' : null
            };

            setEntities(prev => [...prev, newEntity]);

            // Auto select new entity
            handleSelect(newEntity.id, newEntity);
        };

        window.addEventListener('isk-spawn-entity', handleSpawn);
        return () => window.removeEventListener('isk-spawn-entity', handleSpawn);
    }, []);

    // --- 2. THE SELECTION MANAGER ---
    const handleSelect = (id, entityData) => {
        setSelectedId(id);

        console.log(`[CANVAS] Entity Selected: ${id}`);

        // Emitir evento para el Inspector (Zone C)
        // Enviamos el Schema completo de la entidad
        const event = new CustomEvent('isk-entity-selected', {
            detail: {
                id: id,
                schema: {
                    type: entityData.type,
                    properties: {
                        x: { type: 'number', value: entityData.x },
                        y: { type: 'number', value: entityData.y },
                        width: { type: 'number', value: entityData.width },
                        height: { type: 'number', value: entityData.height },
                        fill: { type: 'color', value: entityData.fill },
                        ...(entityData.text && { text: { type: 'string', value: entityData.text } })
                    }
                }
            }
        });
        window.dispatchEvent(event);
    };

    const handleBackgroundClick = (e) => {
        if (e.target === stageRef.current) {
            setSelectedId(null);
            // Emitir desealección
            window.dispatchEvent(new CustomEvent('isk-entity-selected', { detail: null }));
        }
    };

    return (
        <div
            className="spatial-stage"
            ref={stageRef}
            onClick={handleBackgroundClick}
        >
            <div className="spatial-grid-overlay"></div>

            {entities.map(ent => (
                <div
                    key={ent.id}
                    className={`spatial-entity type-${ent.type.toLowerCase()} ${selectedId === ent.id ? 'selected' : ''}`}
                    style={{
                        left: ent.x,
                        top: ent.y,
                        width: ent.width,
                        height: ent.height,
                        backgroundColor: ent.type === 'TEXT' ? 'transparent' : ent.fill,
                        color: ent.fill
                    }}
                    onClick={(e) => {
                        e.stopPropagation(); // Evitar click en fondo
                        handleSelect(ent.id, ent);
                    }}
                >
                    {ent.type === 'TEXT' ? ent.text : ''}

                    {/* Renderizar controles de selección si está activo */}
                    {selectedId === ent.id && (
                        <div className="entity-selection-ring">
                            <div className="corner-handle tl"></div>
                            <div className="corner-handle tr"></div>
                            <div className="corner-handle bl"></div>
                            <div className="corner-handle br"></div>
                        </div>
                    )}
                </div>
            ))}

            {entities.length === 0 && (
                <div className="empty-stage-hint">
                    Spawn objects from the HUD below 👇
                </div>
            )}
        </div>
    );
};

// Metadata for OrbitalCore alignment
SpatialCanvas.metadata = {
    id: "spatial_canvas_isk",
    archetype: "SENSOR",
    semantic_intent: "STREAM",
    description: "DOM-based spatial rendering engine."
};

export default SpatialCanvas;
