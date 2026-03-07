import React from 'react';

/**
 * IndraIcon — Componente de icono universal.
 * Estética: Tony Stark × Solar Punk (Lines, Square Cap, Industrial)
 */
export function IndraIcon({ name, size = '1em', className = '', style = {} }) {
    const normalizedName = name?.toUpperCase();
    const iconContent = ICON_MAP[normalizedName];

    if (!iconContent) return null;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className={`indra-icon ${className}`}
            style={{ flexShrink: 0, ...style }}
        >
            {iconContent}
        </svg>
    );
}

const ICON_MAP = {
    // ── ENTIDADES ──
    'ATOM': <><circle cx="8" cy="8" r="7" /><circle cx="8" cy="8" r="2" /></>,
    'WORKSPACE': <><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" /></>,
    'SCHEMA': <path d="M2 2h12v12H2zm3 4h6m-6 3h6m-6 3h3" />,
    'BRIDGE': <><circle cx="4" cy="8" r="2" /><circle cx="12" cy="8" r="2" /><path d="M6 8h4" /></>,
    'DOCUMENT': <path d="M3 2h7l3 3v9H3zm7 0v3h3" />,
    'SERVICE': <path d="M8 2l6 3.5v7L8 14 2 10.5v-7L8 2zm0 3.5v5M5 6.5l6 3m0-3l-6 3" />,

    // ── ACCIONES ──
    'PLUS': <path d="M8 3v10M3 8h10" />,
    'MINUS': <path d="M3 8h10" />,
    'CLOSE': <path d="M3 3l10 10m0-10L3 13" />,
    'SYNC': <path d="M1 8a7 7 0 0113-4m1 4a7 7 0 01-13 4m0-4l3-3m10 7l-3 3" />,
    'LINK': <path d="M6 10l4-4M5 5a2.1 2.1 0 013 3M8 8a2.1 2.1 0 013 3" />,
    'DRAG': <><circle cx="6" cy="4" r="1" /><circle cx="10" cy="4" r="1" /><circle cx="6" cy="8" r="1" /><circle cx="10" cy="8" r="1" /><circle cx="6" cy="12" r="1" /><circle cx="10" cy="12" r="1" /></>,

    // ── ESTADO ──
    'OK': <path d="M3 8l3 3 7-7" />,
    'ERROR': <path d="M8 1v7m0 4v1m7-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    'LOCK': <><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V4a3 3 0 016 0v3" /></>,

    // ── NAVEGACIÓN ──
    'BACK': <path d="M11 3L6 8l5 5" />,
    'CHEVRON_RIGHT': <path d="M6 3l5 5-5 5" />,
    'EYE': <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></>,
    'DELETE': <path d="M3 3h10v11H3zm1-3h8m-6 3v8m4-8v8" />
};
