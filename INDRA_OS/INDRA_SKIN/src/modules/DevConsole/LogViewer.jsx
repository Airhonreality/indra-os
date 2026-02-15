/**
 * LogViewer.jsx
 * DHARMA: Visualizador de logs con agrupación y expansión
 */

import React, { useState } from 'react';

const LogViewer = ({ logs, onFocusFunction }) => {
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    // Agrupar logs por función
    const groupedLogs = logs.reduce((groups, log) => {
        const key = `${log.component}-${log.function || 'general'}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(log);
        return groups;
    }, {});

    const toggleGroup = (key) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedGroups(newExpanded);
    };

    const getLevelEmoji = (level) => {
        const emojis = {
            DEBUG: '🔍',
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            FATAL: '💀'
        };
        return emojis[level] || '📝';
    };

    const getLayerEmoji = (layer) => {
        const emojis = {
            SYSTEM: '⚙️',
            BACKEND: '📡',
            FRONTEND: '🎨',
            UI: '🖼️',
            NETWORK: '🌐'
        };
        return emojis[layer] || '📝';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    };

    return (
        <div className="log-viewer">
            {Object.entries(groupedLogs).map(([groupKey, groupLogs]) => {
                const isExpanded = expandedGroups.has(groupKey);
                const firstLog = groupLogs[0];
                const hasErrors = groupLogs.some(log => log.level === 'ERROR' || log.level === 'FATAL');
                const hasWarnings = groupLogs.some(log => log.level === 'WARN');

                return (
                    <div key={groupKey} className={`log-group ${hasErrors ? 'has-errors' : ''} ${hasWarnings ? 'has-warnings' : ''}`}>
                        <div
                            className="log-group-header"
                            onClick={() => toggleGroup(groupKey)}
                        >
                            <span className="log-group-toggle">
                                {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className="log-group-layer">
                                {getLayerEmoji(firstLog.layer)} [{firstLog.layer}]
                            </span>
                            <span className="log-group-component">
                                {firstLog.component}
                            </span>
                            {firstLog.function && (
                                <span className="log-group-function">
                                    .{firstLog.function}()
                                </span>
                            )}
                            <span className="log-group-count">
                                ({groupLogs.length} logs)
                            </span>
                            <span className="log-group-time">
                                {formatTime(firstLog.timestamp)}
                            </span>
                            {firstLog.function && (
                                <button
                                    className="log-group-focus"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFocusFunction(firstLog.function);
                                    }}
                                >
                                    🎯 Focus
                                </button>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="log-group-content">
                                {groupLogs.map((log, index) => (
                                    <div key={log.id} className={`log-entry log-level-${log.level.toLowerCase()}`}>
                                        <span className="log-entry-icon">
                                            {index === groupLogs.length - 1 ? '└─' : '├─'}
                                        </span>
                                        <span className="log-entry-level">
                                            {getLevelEmoji(log.level)}
                                        </span>
                                        <span className="log-entry-message">
                                            {log.message}
                                        </span>
                                        {log.data && (
                                            <pre className="log-entry-data">
                                                {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {logs.length === 0 && (
                <div className="log-viewer-empty">
                    No logs to display. Try adjusting your filters.
                </div>
            )}
        </div>
    );
};

export default LogViewer;



