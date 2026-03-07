/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentHydration.js
 * RESPONSABILIDAD: Hidratación de Slots de datos desde el contexto del Workspace.
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import { useAppState } from '../../../state/app_state';

export function useDocumentHydration(atom) {
    const { pins, services } = useAppState();
    const [slots, setSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // En Fase 3, aquí consultaremos los artefactos conectados al 'IN' del documento
        // Por ahora, simulamos la extracción de slots básicos para la demo
        setIsLoading(true);

        const timer = setTimeout(() => {
            setSlots([
                { id: 's1', label: 'cliente_nombre', type: 'TEXT', origin: 'SOURCE' },
                { id: 's2', label: 'factura_id', type: 'TEXT', origin: 'SOURCE' },
                { id: 's3', label: 'monto_total', type: 'NUMBER', origin: 'SOURCE' },
                { id: 's4', label: 'fecha_emision', type: 'DATE', origin: 'SOURCE' },
                { id: 's5', label: 'items_lista', type: 'ARRAY', origin: 'SOURCE' }
            ]);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [atom.id]);

    return { slots, isLoading };
}
