import React from 'react';

/**
 * ArchitectureVector — Streamlined Minimalist Edition
 */
export const ArchitectureVector = () => (
    <svg viewBox="0 0 1000 400" style={{width: '100%', height: 'auto'}}>
        <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7B2FF7" />
                <stop offset="100%" stopColor="#2196F3" />
            </linearGradient>
            <filter id="glow-v">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Connection Paths */}
        <path d="M 200 200 Q 500 120 800 200" fill="none" stroke="url(#lineGrad)" strokeWidth="1" strokeDasharray="6,6" opacity="0.4" />
        <path d="M 200 200 Q 500 280 800 200" fill="none" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.1" />
        
        {/* Node: GitHub Entorno */}
        <g>
            <circle cx="200" cy="200" r="40" fill="rgba(15,15,15,0.8)" stroke="#7B2FF7" strokeWidth="1" />
            <text x="200" y="270" textAnchor="middle" fill="white" style={{fontSize: '9px', fontWeight: 300, letterSpacing: '0.2em', opacity: 0.6}}>GITHUB_CONTEXT</text>
        </g>
        
        {/* Node: Núcleo Indra */}
        <g filter="url(#glow-v)">
            <circle cx="500" cy="200" r="60" fill="rgba(20,20,20,0.9)" stroke="#2196F3" strokeWidth="2" />
            <text x="500" y="310" textAnchor="middle" fill="white" style={{fontSize: '11px', fontWeight: 600, letterSpacing: '0.3em'}}>NÚCLEO_INDRA</text>
            <text x="500" y="325" textAnchor="middle" fill="#2196F3" style={{fontSize: '6px', fontWeight: 300, letterSpacing: '0.1em', opacity: 0.5}}>V8_RUNTIME</text>
        </g>
        
        {/* Node: Realidades */}
        <g>
            <circle cx="800" cy="200" r="40" fill="rgba(15,15,15,0.8)" stroke="#7B2FF7" strokeWidth="1" />
            <text x="800" y="270" textAnchor="middle" fill="white" style={{fontSize: '9px', fontWeight: 300, letterSpacing: '0.2em', opacity: 0.6}}>USER_DRIVE</text>
        </g>
        
        {/* Animated Data Particle */}
        <circle r="3" fill="#2196F3" filter="url(#glow-v)">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 200 200 Q 500 120 800 200" />
        </circle>
    </svg>
);
