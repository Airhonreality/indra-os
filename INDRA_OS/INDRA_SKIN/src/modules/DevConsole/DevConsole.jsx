/**
 * DevConsole.jsx
 * DHARMA: Consola de debugging profesional para desarrollo
 * AXIOMA: "El debugging es una experiencia visual y atómica"
 */

import React, { useState, useEffect } from 'react';
import LogViewer from './LogViewer';
import LogFilter from './LogFilter';
import LogExporter from './LogExporter';
import FocusMode from './FocusMode';
import TimelineView from './TimelineView';
import { Icons } from '../../4_Atoms/IndraIcons';

const DevConsole = () => {
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [filters, setFilters] = useState({
        layers: ['SYSTEM', 'BACKEND', 'FRONTEND', 'UI', 'NETWORK'],
        levels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
        component: null,
        function: null,
        search: ''
    });
    const [focusMode, setFocusMode] = useState({
        enabled: false,
        function: null
    });
    const [viewMode, setViewMode] = useState('LIST'); // LIST | TIMELINE

    // Interceptar logs del navegador
    useEffect(() => {
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;

        const captureLog = (level, args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            // Parsear logs estructurados
            const logEntry = parseLogMessage(level, message);

            setLogs(prev => [...prev, logEntry].slice(-200)); // Mantener últimos 200 logs
        };

        console.log = (...args) => {
            originalConsoleLog(...args);
            captureLog('INFO', args);
        };

        console.warn = (...args) => {
            originalConsoleWarn(...args);
            captureLog('WARN', args);
        };

        console.error = (...args) => {
            originalConsoleError(...args);
            captureLog('ERROR', args);
        };

        return () => {
            console.log = originalConsoleLog;
            console.warn = originalConsoleWarn;
            console.error = originalConsoleError;
        };
    }, []);

    // Parsear mensaje de log para extraer metadata
    const parseLogMessage = (level, message) => {
        const timestamp = new Date().toISOString();

        // Detectar layer y component del mensaje
        let layer = 'FRONTEND';
        let component = 'Unknown';
        let functionName = null;

        // Patrones de detección
        if (message.includes('[BACKEND]')) {
            layer = 'BACKEND';
        } else if (message.includes('[SYSTEM]') || message.includes('[BOOT]')) {
            layer = 'SYSTEM';
        } else if (message.includes('[CORE]')) {
            layer = 'NETWORK';
        } else if (message.includes('Portal') || message.includes('Selector')) {
            layer = 'UI';
        }

        // Extraer component
        const componentMatch = message.match(/\[([^\]]+)\]/);
        if (componentMatch) {
            component = componentMatch[1];
        }

        return {
            id: `${timestamp}-${Math.random()}`,
            timestamp,
            layer,
            component,
            function: functionName,
            level,
            message,
            data: null
        };
    };

    // Filtrar logs
    const filteredLogs = logs.filter(log => {
        // Filtro por tab
        if (activeTab !== 'ALL' && log.layer !== activeTab) return false;

        // Filtro por layers
        if (!filters.layers.includes(log.layer)) return false;

        // Filtro por levels
        if (!filters.levels.includes(log.level)) return false;

        // Filtro por component
        if (filters.component && log.component !== filters.component) return false;

        // Filtro por function
        if (filters.function && log.function !== filters.function) return false;

        // Filtro por search
        if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }

        // Focus mode
        if (focusMode.enabled && focusMode.function && log.function !== focusMode.function) {
            return false;
        }

        return true;
    });

    const handleClearLogs = () => {
        setLogs([]);
    };

    const handleToggleFocusMode = (functionName) => {
        setFocusMode({
            enabled: !focusMode.enabled || focusMode.function !== functionName,
            function: functionName
        });
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 z-[9999] bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-2 rounded-full cursor-pointer flex items-center gap-2 shadow-lg hover:border-[var(--accent)] transition-all animate-fade-in glass"
                onClick={() => setIsMinimized(false)}
            >
                <Icons.Terminal size={14} className="text-[var(--accent)]" />
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">CONSOLE</span>
                <span className="text-[9px] font-mono text-[var(--text-dim)]">({logs.length})</span>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-0 left-0 w-full z-[9999] flex flex-col border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-[0_-5px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
            style={{ height: '350px' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] shrink-0">
                <div className="flex items-center gap-2">
                    <Icons.Terminal size={14} className="text-[var(--accent)]" />
                    <h3 className="text-[11px] font-black tracking-widest text-[var(--text-secondary)] uppercase">System Diagnostics</h3>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleClearLogs} className="text-[10px] uppercase font-mono text-[var(--text-dim)] hover:text-[var(--error-color)] flex items-center gap-1 transition-colors">
                        Clear Path
                    </button>
                    <button onClick={() => setIsMinimized(true)} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors">
                        <Icons.ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center px-4 py-1.5 gap-2 border-b border-[var(--border-color)] bg-[var(--bg-surface)] overflow-x-auto shrink-0 custom-scrollbar">
                {['ALL', 'SYSTEM', 'BACKEND', 'FRONTEND', 'UI', 'NETWORK'].map(tab => (
                    <button
                        key={tab}
                        className={`
                            px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all
                            ${activeTab === tab
                                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30'
                                : 'text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text-primary)] border border-transparent'}
                        `}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-[var(--bg-primary)] font-mono text-[11px]">
                    {viewMode === 'LIST' ? (
                        <LogViewer logs={filteredLogs} onFocusFunction={handleToggleFocusMode} />
                    ) : (
                        <TimelineView logs={filteredLogs} />
                    )}
                </div>
            </div>

            {/* View Toggle Bar (Footer) */}
            <div className="flex justify-between items-center px-4 py-1 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0">
                <div className="flex items-center gap-2">
                    {/* Aqui irían filtros avanzados si los hubiera */}
                    <span className="text-[9px] text-[var(--text-dim)]">{logs.length} events logged</span>
                </div>
                <div className="flex items-center bg-black/20 rounded p-0.5 border border-white/5">
                    <button
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm transition-colors ${viewMode === 'LIST' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}
                        onClick={() => setViewMode('LIST')}
                    >
                        <Icons.List size={10} />
                        <span className="text-[9px] font-bold">List</span>
                    </button>
                    <button
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm transition-colors ${viewMode === 'TIMELINE' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}
                        onClick={() => setViewMode('TIMELINE')}
                    >
                        <Icons.Clock size={10} />
                        <span className="text-[9px] font-bold">Time</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default DevConsole;



