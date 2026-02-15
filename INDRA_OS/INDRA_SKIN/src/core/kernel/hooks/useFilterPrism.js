/**
 * useFilterPrism.js
 * DHARMA: Prisma Analítico Transversal (Search & Filter Kernel).
 * Misión: Filtrar, ordenar y buscar en colecciones de datos masivas.
 */

import { useState, useMemo, useCallback } from 'react';

export const useFilterPrism = (data = [], config = {}) => {
    const {
        initialSort = { key: 'name', direction: 'asc' },
        searchKeys = ['name', 'LABEL', 'type', 'mimeType'] // Campos por defecto donde buscar texto
    } = config;

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState(initialSort);
    const [activeFilters, setActiveFilters] = useState({}); // { type: 'DIRECTORY', mimeType: 'sheet' }

    // AXIOMA: Motor de Normalización Indriana (Remoción de Diacríticos)
    const normalizeText = (text) => {
        if (!text) return "";
        return String(text)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
            .toLowerCase()
            .trim();
    };

    // AXIOMA: Heurística de Coincidencia (Fuzzy Logic Lite)
    const calculateMatchScore = (target, query) => {
        const t = normalizeText(target);
        const q = normalizeText(query);

        if (t === q) return 1; // Coincidencia Exacta
        if (t.startsWith(q)) return 0.9; // Prefijo
        if (t.includes(q)) return 0.7; // Contiene

        // Fuzzy: Si la consulta es larga, permitir un error leve (Distancia de Levenshtein simplificada)
        if (q.length > 3) {
            // Ejemplo: "archvo" vs "archivo"
            // Una implementación simple de inclusión de caracteres en orden
            let matchCount = 0;
            let lastIndex = -1;
            for (let char of q) {
                const index = t.indexOf(char, lastIndex + 1);
                if (index > -1) {
                    matchCount++;
                    lastIndex = index;
                }
            }
            if (matchCount >= q.length - 1) return 0.5; // Typos ligeros
        }

        return 0;
    };

    // AXIOMA: Proyección de Prisma (Memoized Result)
    const filteredData = useMemo(() => {
        if (!data) return [];
        let result = [...data];

        // 1. Filtrado por Propiedades (Filtros Estructurados)
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value === undefined || value === null || value === 'ALL') return;

            result = result.filter(item => {
                const itemValue = item[key];

                if (typeof value === 'function') return value(item);

                // Normalización también en filtros de texto directos
                if (typeof value === 'string' && typeof itemValue === 'string') {
                    return normalizeText(itemValue).includes(normalizeText(value));
                }
                return itemValue === value;
            });
        });

        // 2. Búsqueda de Texto Libre (Search Omni-Bar)
        if (searchTerm && !searchTerm.startsWith('/')) {
            result = result
                .map(item => {
                    // Calculamos el mejor score entre todos los campos de búsqueda
                    const scores = searchKeys.map(key => calculateMatchScore(item[key], searchTerm));
                    const bestScore = Math.max(...scores);
                    return { ...item, _prismScore: bestScore };
                })
                .filter(item => item._prismScore > 0)
                .sort((a, b) => b._prismScore - a._prismScore); // Relevancia primero
        }

        // 3. Ordenamiento (Sorting) - Solo si no estamos buscando (o si el score es igual)
        if (sortConfig.key && (!searchTerm || searchTerm.startsWith('/'))) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig, activeFilters, searchKeys]);

    // Métodos de Control (Estabilizados con useCallback)
    const setFilter = useCallback((key, value) => {
        setActiveFilters(prev => {
            // AXIOMA: Evitar actualizaciones redundantes si el valor es idéntico
            if (prev[key] === value) return prev;
            return {
                ...prev,
                [key]: value
            };
        });
    }, []);

    const clearFilters = useCallback(() => setActiveFilters({}), []);

    const toggleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    return {
        data: filteredData,
        searchTerm,
        setSearchTerm,
        activeFilters,
        setFilter,
        clearFilters,
        sortConfig,
        toggleSort,
        totalCount: data.length,
        filteredCount: filteredData.length
    };
};



