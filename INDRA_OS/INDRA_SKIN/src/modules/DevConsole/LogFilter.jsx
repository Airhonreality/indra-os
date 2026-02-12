/**
 * LogFilter.jsx
 * DHARMA: Filtros y búsqueda de logs
 */

import React from 'react';

const LogFilter = ({ filters, setFilters, logs }) => {
    const handleLevelToggle = (level) => {
        const newLevels = filters.levels.includes(level)
            ? filters.levels.filter(l => l !== level)
            : [...filters.levels, level];
        setFilters({ ...filters, levels: newLevels });
    };

    const handleLayerToggle = (layer) => {
        const newLayers = filters.layers.includes(layer)
            ? filters.layers.filter(l => l !== layer)
            : [...filters.layers, layer];
        setFilters({ ...filters, layers: newLayers });
    };

    const handleSearchChange = (e) => {
        setFilters({ ...filters, search: e.target.value });
    };

    const handleClearFilters = () => {
        setFilters({
            layers: ['SYSTEM', 'BACKEND', 'FRONTEND', 'UI', 'NETWORK'],
            levels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
            component: null,
            function: null,
            search: ''
        });
    };

    // Extraer componentes únicos de los logs
    const uniqueComponents = [...new Set(logs.map(log => log.component))].sort();

    return (
        <div className="log-filter">
            <div className="log-filter-section">
                <label>Levels:</label>
                <div className="log-filter-buttons">
                    {['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].map(level => (
                        <button
                            key={level}
                            className={`filter-btn ${filters.levels.includes(level) ? 'active' : ''}`}
                            onClick={() => handleLevelToggle(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="log-filter-section">
                <label>Layers:</label>
                <div className="log-filter-buttons">
                    {['SYSTEM', 'BACKEND', 'FRONTEND', 'UI', 'NETWORK'].map(layer => (
                        <button
                            key={layer}
                            className={`filter-btn ${filters.layers.includes(layer) ? 'active' : ''}`}
                            onClick={() => handleLayerToggle(layer)}
                        >
                            {layer}
                        </button>
                    ))}
                </div>
            </div>

            <div className="log-filter-section">
                <label>Component:</label>
                <select
                    value={filters.component || ''}
                    onChange={(e) => setFilters({ ...filters, component: e.target.value || null })}
                >
                    <option value="">All Components</option>
                    {uniqueComponents.map(component => (
                        <option key={component} value={component}>
                            {component}
                        </option>
                    ))}
                </select>
            </div>

            <div className="log-filter-section">
                <label>Search:</label>
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.search}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="log-filter-actions">
                <button onClick={handleClearFilters}>Clear Filters</button>
            </div>
        </div>
    );
};

export default LogFilter;
