/**
 * TimelineView.jsx
 * DHARMA: Visualización cronológica del flujo de ejecución
 */

import React from 'react';

const TimelineView = ({ logs }) => {
    return (
        <div className="timeline-view">
            {logs.map((log, index) => {
                const prevLog = logs[index - 1];
                const timeDiff = prevLog
                    ? new Date(log.timestamp) - new Date(prevLog.timestamp)
                    : 0;

                return (
                    <div key={log.id} className={`timeline-item layer-${log.layer.toLowerCase()} level-${log.level.toLowerCase()}`}>
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <div className="timeline-header">
                                <span className="timeline-time">
                                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })}
                                </span>
                                {timeDiff > 100 && (
                                    <span className="timeline-gap">+{timeDiff}ms</span>
                                )}
                                <span className={`timeline-badge badge-${log.layer.toLowerCase()}`}>
                                    {log.layer}
                                </span>
                            </div>
                            <div className="timeline-body">
                                <span className="timeline-component">{log.component}</span>
                                {log.function && <span className="timeline-function">.{log.function}()</span>}
                                <span className="timeline-separator">ERROR:</span>
                                <span className="timeline-message">{log.message}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            {logs.length === 0 && (
                <div className="log-viewer-empty">
                    No timeline data.
                </div>
            )}
        </div>
    );
};

export default TimelineView;



