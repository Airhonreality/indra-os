
/**
 * SovereignInfraDiagram — Axiomatic Mental Model
 * Decentralized theme logic via CSS tokens.
 */
export const SovereignInfraDiagram = () => {
    return (
        <svg viewBox="0 0 800 650" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <defs>
                <filter id="glow-axiomatic-infra" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* ── ANILLOS DE INFRAESTRUCTURA (GUÍAS AXIOMÁTICAS) ── */}
            <circle cx="400" cy="325" r="90" stroke="var(--color-cold)" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
            <circle cx="400" cy="325" r="180" stroke="var(--diag-core)" strokeWidth="1" strokeDasharray="6 6" opacity="0.3" />
            <circle cx="400" cy="325" r="270" stroke="var(--diag-proyect)" strokeWidth="1" strokeDasharray="6 6" opacity="0.2" />

            {/* Guías de conexión vertical */}
            <path d="M 400 135 L 400 515" stroke="var(--diag-ring-guide)" strokeWidth="1" strokeDasharray="4 4" />

            {/* ── NODO 01: EL CEREBRO (GAS) ── */}
            <g filter="url(#glow-axiomatic-infra)">
                <circle cx="400" cy="325" r="50" fill="var(--diag-node-bg)" stroke="var(--color-cold)" strokeWidth="2" />
                <text x="400" y="330" textAnchor="middle" fill="var(--color-cold)" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em' }}>V8_GOOGLE</text>
            </g>
            <text x="400" y="260" textAnchor="middle" fill="var(--diag-text-primary)" style={{ fontSize: '18px', fontWeight: 350, letterSpacing: '0.3em' }}>EL MOTOR (GAS)</text>

            {/* ── NODO 02: LA MEMORIA (DRIVE) ── */}
            <g>
                <circle cx="400" cy="135" r="40" fill="var(--diag-node-bg)" stroke="var(--diag-core)" strokeWidth="2" />
                <text x="460" y="140" textAnchor="start" fill="var(--diag-core)" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }}>DRIVE_STORAGE</text>
                <text x="460" y="160" textAnchor="start" fill="var(--diag-text-secondary)" style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>PERSISTENCIA SOBERANA (.JSON)</text>
            </g>

            {/* ── NODO 03: LA CARA (DASHBOARD) ── */}
            <g>
                <circle cx="400" cy="515" r="40" fill="var(--diag-node-bg)" stroke="var(--diag-proyect)" strokeWidth="2" />
                <text x="460" y="520" textAnchor="start" fill="var(--diag-proyect)" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em' }}>INDRA_DASHBOARD</text>
                <text x="460" y="540" textAnchor="start" fill="var(--diag-text-secondary)" style={{ fontSize: '10px', fontWeight: 400, opacity: 0.7 }}>PROYECCIÓN LADO CLIENTE (VITE)</text>
            </g>

            {/* ── DATA FLOW ── */}
            <circle r="5" fill="var(--diag-text-primary)">
                <animateMotion dur="10s" repeatCount="indefinite">
                    <mpath href="#flow-path-axiomatic-infra" />
                </animateMotion>
            </circle>
            <path id="flow-path-axiomatic-infra" d="M 400 135 L 400 325 L 400 515" display="none" />
        </svg>
    );
};
