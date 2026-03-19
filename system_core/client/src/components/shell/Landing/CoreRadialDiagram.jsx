import React from 'react';

/**
 * CoreRadialDiagram — Axiomatic Edition
 * Completely decentralized theme logic. Consumes system tokens.
 */
export const CoreRadialDiagram = () => {
    return (
        <svg viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxHeight: '110vh', overflow: 'visible' }}>
            <defs>
                <filter id="glow-axiomatic" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* ── ANILLOS DE SOBERANÍA (GUÍAS AXIOMÁTICAS) ── */}
            <circle cx="600" cy="600" r="180" stroke="var(--diag-ring-guide)" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="600" cy="600" r="360" stroke="var(--diag-ring-guide)" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="600" cy="600" r="540" stroke="var(--diag-ring-guide)" strokeWidth="1" strokeDasharray="6 6" />

            {/* Segmentos activos rotatorios */}
            <circle className="ring-pulse-sa" cx="600" cy="600" r="180" stroke="var(--diag-core)" strokeWidth="2.5" strokeDasharray="60 400" />
            <circle className="ring-pulse-sb" cx="600" cy="600" r="360" stroke="var(--diag-adapter)" strokeWidth="2.5" strokeDasharray="100 800" />
            <circle className="ring-pulse-sc" cx="600" cy="600" r="540" stroke="var(--diag-proyect)" strokeWidth="2.5" strokeDasharray="150 1200" />

            {/* ── CENTRAL SUN: INDRA ── */}
            <g filter="url(#glow-axiomatic)">
                <circle cx="600" cy="600" r="70" fill="var(--diag-node-bg)" stroke="var(--diag-core)" strokeWidth="2" />
                <text x="600" y="605" textAnchor="middle" fill="var(--diag-core)" style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.6em' }}>INDRA</text>
            </g>

            {/* ── ANILLO I: MÓDULOS DEL MOTOR (CORE) ── */}
            {[
                { angle: -90, label: 'SYSTEM_ASSEMBLER' },
                { angle: 0, label: 'PROJECTION_KERNEL' },
                { angle: 90, label: 'HTTP_ENTRYPOINT' },
                { angle: 180, label: 'CONTRACT_REGISTRY' }
            ].map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = 600 + Math.cos(rad) * 180;
                const y = 600 + Math.sin(rad) * 180;
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="10" fill="var(--diag-node-bg)" stroke="var(--diag-core)" strokeWidth="2" filter="url(#glow-axiomatic)" />
                        <text x={x} y={y + (node.angle === 90 ? 45 : node.angle === -90 ? -35 : 6)} 
                              textAnchor={node.angle === 0 ? 'start' : node.angle === 180 ? 'end' : 'middle'} 
                              dx={node.angle === 0 ? 30 : node.angle === 180 ? -30 : 0}
                              fill="var(--diag-core)" 
                              style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em' }}>
                            {node.label}
                        </text>
                    </g>
                );
            })}

            {/* ── ANILLO II: PROVIDERS (ADAPTER) ── */}
            {[
                { angle: -135, label: 'SQL_HOST' },
                { angle: -45, label: 'G_DRIVE' },
                { angle: 45, label: 'NEURAL_ORACLE' },
                { angle: 135, label: 'DOCUMENT_VAULT' }
            ].map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = 600 + Math.cos(rad) * 360;
                const y = 600 + Math.sin(rad) * 360;
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="10" fill="var(--diag-adapter)" stroke="var(--diag-adapter)" strokeWidth="1" />
                        <text x={x} y={y - 35} textAnchor="middle" fill="var(--diag-adapter)" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.2em' }}>{node.label}</text>
                    </g>
                );
            })}

            {/* ── ANILLO III: CLIENTS (PROYECT) ── */}
            {[
                { angle: -15, label: 'INDRA_DASHBOARD' },
                { angle: 195, label: 'SATELLITE_REMOTE' }
            ].map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = 600 + Math.cos(rad) * 540;
                const y = 600 + Math.sin(rad) * 540;
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="35" fill="none" stroke="var(--diag-proyect)" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
                        <circle cx={x} cy={y} r="8" fill="var(--diag-proyect)" filter="url(#glow-axiomatic)" />
                        <text x={x} y={y - 60} textAnchor="middle" fill="var(--diag-proyect)" style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '0.4em' }}>{node.label}</text>
                    </g>
                );
            })}

            <style>{`
                @keyframes orbit-diag {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .ring-pulse-sa { animation: orbit-diag 40s linear infinite; transform-origin: 600px 600px; }
                .ring-pulse-sb { animation: orbit-diag 60s linear reverse infinite; transform-origin: 600px 600px; }
                .ring-pulse-sc { animation: orbit-diag 90s linear infinite; transform-origin: 600px 600px; }
            `}</style>
        </svg>
    );
};
