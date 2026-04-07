import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

export const MIEQueuePanel = ({ jobs, results }) => {
    
    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <aside className="mie-engine-queue stack" style={{ overflow: 'hidden' }}>
            <header className="queue-header shelf--between" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="LIST" size="14px" />
                    <span className="util-label">COLA_DE_ADUANA</span>
                </div>
                <div className="badge badge--mini" style={{ background: 'rgba(123, 47, 247, 0.2)', color: '#7b2ff7', border: 'none' }}>
                    {jobs.length} ITEMS
                </div>
            </header>

            <div className="queue-list fill" style={{ overflowY: 'auto', padding: '12px' }}>
                {jobs.length === 0 && (
                    <div className="empty-state center" style={{ height: '100%', opacity: 0.2 }}>
                        <span className="util-label" style={{ fontSize: '9px' }}>COLA VACÍA</span>
                    </div>
                )}
                
                {jobs.map(job => (
                    <div key={job.id} className="job-card stack--tight" style={{ 
                        padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        opacity: job.status === 'DONE' ? 0.5 : 1
                    }}>
                        <div className="shelf--between">
                            <div className="shelf--tight" style={{ maxWidth: '70%', overflow: 'hidden' }}>
                                <IndraIcon name={job.type === 'video' ? 'PROJECT_VIDEO' : job.type === 'audio' ? 'VOLUME' : 'IMAGE'} size="10px" />
                                <span className="font-outfit" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{job.file.name}</span>
                            </div>
                            <span className="util-label" style={{ fontSize: '8px', color: job.status === 'DONE' ? 'var(--color-success)' : 'inherit' }}>
                                {job.status}
                            </span>
                        </div>

                        {job.status === 'PROCESSING' && (
                            <div className="progress-mini" style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)' }}>
                                <div className="progress-fill" style={{ width: `${job.progress * 100}%`, height: '100%', background: '#7b2ff7' }} />
                            </div>
                        )}

                        {job.status === 'DONE' && job.result && (
                            <div className="result-stats shelf--tight" style={{ fontSize: '8px', opacity: 0.6 }}>
                                <span>{formatBytes(job.result.metadata.originalSize)}</span>
                                <IndraIcon name="ARROW_RIGHT" size="6px" />
                                <span style={{ color: '#7b2ff7' }}>{formatBytes(job.result.metadata.finalSize)}</span>
                                <span className="badge badge--mini" style={{ fontSize: '7px' }}>
                                    {Math.round((1 - job.result.metadata.compressionRatio) * 100)}% REDUCCIÓN
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {results.length > 0 && (
                <footer className="queue-actions p-20" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="util-label" style={{ marginBottom: '10px', fontSize: '9px', opacity: 0.5 }}>RESUMEN DE COSECHA:</div>
                    <div className="shelf--between font-outfit" style={{ fontSize: '13px', fontWeight: 900 }}>
                        <span>TOTAL REDUCCIÓN</span>
                        <span style={{ color: 'var(--color-success)' }}>
                            ~{Math.round(results.reduce((acc, r) => acc + (r.metadata.originalSize - r.metadata.finalSize), 0) / 1024 / 1024)} MB
                        </span>
                    </div>
                </footer>
            )}
        </aside>
    );
};
