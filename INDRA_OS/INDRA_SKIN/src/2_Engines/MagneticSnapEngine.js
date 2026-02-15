/**
 * MAGNETICS SNAP ENGINE
 * Motor de alineación inductiva para artefactos flotantes.
 * Permite que los elementos se "imanten" a los bordes de la pantalla (Top, Bottom, Left, Right).
 */

import { useState, useEffect, useRef } from 'react';

const SNAP_THRESHOLD = 0.2; // Porcentaje de pantalla para activar snap inductivo
const EDGE_MARGIN = 40; // Distancia del borde en píxeles

export const useMagneticSnap = (initialSide = 'top') => {
    const [position, setPosition] = useState({ x: window.innerWidth / 2, y: EDGE_MARGIN });
    const [dockSide, setDockSide] = useState(initialSide); // 'top', 'bottom', 'left', 'right'
    const [isDragging, setIsDragging] = useState(false);

    // Referencias para cálculos de física sin re-renders
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        velocity: { x: 0, y: 0 },
        lastTime: 0
    });

    // Calcular puntos de anclaje dinámicamente
    const getAnchors = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w / 2;
        const cy = h / 2;

        return {
            top: { x: cx, y: EDGE_MARGIN, label: 'top' },
            bottom: { x: cx, y: h - EDGE_MARGIN, label: 'bottom' },
            left: { x: EDGE_MARGIN, y: cy, label: 'left' },
            right: { x: w - EDGE_MARGIN, y: cy, label: 'right' }
        };
    };

    const snapToNearest = (x, y) => {
        const anchors = getAnchors();
        let minDist = Infinity;
        let nearest = anchors.top;

        // Búsqueda del anclaje más cercano (Euclidiana)
        Object.values(anchors).forEach(anchor => {
            const dx = x - anchor.x;
            const dy = y - anchor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Factor inductivo: Si la velocidad apunta al anclaje, reduciomos su "distancia" virtual
            // (Simplificado: selección por proximidad pura por ahora para robustez)
            if (dist < minDist) {
                minDist = dist;
                nearest = anchor;
            }
        });

        setPosition({ x: nearest.x, y: nearest.y });
        setDockSide(nearest.label);
    };

    const startDrag = (e) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            velocity: { x: 0, y: 0 },
            lastTime: Date.now()
        };
        e.stopPropagation();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;

            // Actualizar posición visual cruda
            setPosition({
                x: dragRef.current.initialX + dx,
                y: dragRef.current.initialY + dy
            });
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            setIsDragging(false);

            // Ejecutar Snapping al soltar
            snapToNearest(position.x, position.y);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position]); // Position in dep OK for drag visual update? Yes but optimized via ref usually. Here straightforward.

    // Recalcular snap al cambiar tamaño de ventana
    useEffect(() => {
        const handleResize = () => snapToNearest(position.x, position.y);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [dockSide]);

    return {
        position,
        dockSide,
        isDragging,
        startDrag
    };
};



