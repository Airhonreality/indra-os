/**
 * LogExporter.jsx
 * DHARMA: Herramientas para extraer y compartir logs
 */

import React from 'react';

const LogExporter = ({ logs }) => {
    const handleCopyAll = () => {
        const text = logs.map(log =>
            `[${log.timestamp}] [${log.level}] [${log.layer}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`
        ).join('\n');
        navigator.clipboard.writeText(text);
        alert('All logs copied to clipboard!');
    };

    const handleCopyErrors = () => {
        const errors = logs.filter(log => log.level === 'ERROR' || log.level === 'FATAL');
        const text = errors.map(log =>
            `[${log.timestamp}] [${log.level}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`
        ).join('\n');
        navigator.clipboard.writeText(text);
        alert(`${errors.length} error logs copied to clipboard!`);
    };

    const handleDownloadJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `indra_debug_logs_${new Date().getTime()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="log-exporter">
            <button onClick={handleCopyAll} title="Copy all logs to clipboard">
                📋 Copy All
            </button>
            <button onClick={handleCopyErrors} className="btn-error" title="Copy only errors">
                ❌ Copy Errors
            </button>
            <button onClick={handleDownloadJSON} title="Download as JSON file">
                📥 Download JSON
            </button>
        </div>
    );
};

export default LogExporter;



