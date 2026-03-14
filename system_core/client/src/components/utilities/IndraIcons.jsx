import React from 'react';

/**
 * IndraIcon — Componente de icono universal.
 * Estética: Tony Stark × Solar Punk (Lines, Square Cap, Industrial)
 */
export function IndraIcon({ name, size = '1em', color, className = '', style = {} }) {
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
            style={{ flexShrink: 0, color: color, ...style }}
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
    'FOLDER': <path d="M1 3h5l2 2h7v9H1V3z" />,
    'VAULT': <><rect x="2" y="4" width="12" height="10" rx="1" /><circle cx="8" cy="9" r="2" /><path d="M8 7v1" /></>,

    // ── ACCIONES ──
    'PLUS': <path d="M8 3v10M3 8h10" />,
    'MINUS': <path d="M3 8h10" />,
    'CLOSE': <path d="M3 3l10 10m0-10L3 13" />,
    'SAVE': <><path d="M3 2h8l2 2v10H3V2z" /><path d="M5 2v4h6V2" /><path d="M5 10h6v4H5z" /></>,
    'COPY': <path d="M4 4h9v9H4V4zm-2-2h9v9H2V2z" />,
    'LAYERS': <path d="M2 5l6 3 6-3-6-3-6 3zm0 3l6 3 6-3m-12 3l6 3 6-3" />,
    'DNA': <path d="M4 2c2 2 8 10 8 12M12 2C10 4 4 12 4 14M4 5h8M4 8h8M4 11h8" />,
    'SYNC': <path d="M1 8a7 7 0 0113-4m1 4a7 7 0 01-13 4m0-4l3-3m10 7l-3 3" />,
    'LINK': <path d="M6 10l4-4M5 5a2.1 2.1 0 013 3M8 8a2.1 2.1 0 013 3" />,
    'DRAG': <><circle cx="6" cy="4" r="1" /><circle cx="10" cy="4" r="1" /><circle cx="6" cy="8" r="1" /><circle cx="10" cy="8" r="1" /><circle cx="6" cy="12" r="1" /><circle cx="10" cy="12" r="1" /></>,
    'EDIT': <path d="M11 2l3 3-9 9-3 1 1-3 9-9z" />,
    'FRAME': <rect x="2" y="2" width="12" height="12" rx="1" />,

    // ── ESTADO ──
    'OK': <path d="M3 8l3 3 7-7" />,
    'CHECK': <path d="M3 8l3 3 7-7" />,
    'ERROR': <path d="M8 1v7m0 4v1m7-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    'LOCK': <><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V4a3 3 0 016 0v3" /></>,
    'INFO': <><circle cx="8" cy="8" r="7" /><path d="M8 11V7m0-2v.01" /></>,
    'RELOAD': <path d="M1 8a7 7 0 0113-4m1 4a7 7 0 01-13 4m0-4l3-3m10 7l-3 3" />,


    // ── NAVEGACIÓN ──
    'BACK': <path d="M11 3L6 8l5 5" />,
    'ARROW_UP': <path d="M8 13V3m-4 4l4-4 4 4" />,
    'ARROW_DOWN': <path d="M8 3v10m-4-4l4 4 4-4" />,
    'ARROW_LEFT': <path d="M11 8H3m4-4L3 8l4 4" />,
    'ARROW_RIGHT': <path d="M5 8h8m-4-4l4 4-4 4" />,
    'CHEVRON_RIGHT': <path d="M6 3l5 5-5 5" />,
    'EYE': <><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></>,
    'DELETE': <path d="M3 3h10v11H3zm1-3h8m-6 3v8m4-8v8" />,
    'SETTINGS': <><circle cx="8" cy="8" r="2" /><path d="M8 1v2m0 10v2M1 8h2m10 0h2m-12-5l1.5 1.5m9.5 9.5l1.5 1.5m-11 0l1.5-1.5m9.5-9.5l1.5-1.5" /></>,
    'FLOW': <path d="M2 8h4l2-6 2 12 2-6h4" />,
    'SEARCH': <><circle cx="6" cy="6" r="4" /><path d="M9 9l4 4" /></>,
    'TARGET': <><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2" /><path d="M8 1V4M8 12V15M1 8H4M12 8H15" /></>,

    // ── OPERATORS ──
    'MATH': <path d="M8 3v10m-5-5h10m-7-3l4 4-4 4m6-8v8" />,
    'TEXT': <path d="M2 3h12v2H2zm0 4h9v2H2z" />,
    'EXTRACTOR': <path d="M8 2l5 5-5 5-5-5 5-5zM8 4l-3 3 3 3 3-3-3-3z" />,
    'LOGIC': <path d="M2 8h3m1-4h3M6 8h3M6 12h3M10 4h3M10 8h3M10 12h3" />,

    // ── MEDIA ──
    'PLAY': <path d="M4 3l9 5-9 5V3z" />,
    'PAUSE': <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" />,
    'TERMINAL': <path d="M2 3l4 5-4 5m4 0h8" />,
    'LOAD': <path d="M8 1a7 7 0 017 7" />,

    // ── HISTORIAL ──
    'UNDO': <path d="M4 8a5 5 0 015-5h4M4 8L1 5m3 3L1 11m9-3h4" />,
    'REDO': <path d="M12 8a5 5 0 00-5-5H3m9 0l3-3m-3 3l3 3M3 8H7" />,

    // ── ALIASES DE CLASE (para atom.class → icono) ──
    'DATA_SCHEMA': <path d="M2 2h12v12H2zm3 4h6m-6 3h6m-6 3h3" />,
    'WORKFLOW': <path d="M2 4h4v4H2zm8 0h4v4h-4zM4 8v4h8V8" />,
    'EXPRESSION': <path d="M2 8h2m2-4l4 8m0-8l-4 8m5-4h2" />,
    'VIDEO_PROJECT': <><path d="M2 3h8l4 3v7H2V3z" /><path d="M10 3v3h4" /><circle cx="6" cy="9" r="2" /></>,
    'TIMELINE': <path d="M1 13h14M3 13V9m3 4V7m3 6V10m3 3V6m3 7V11" />,
    'SCISSORS': <><circle cx="5" cy="5" r="2" /><circle cx="5" cy="11" r="2" /><path d="M7 6l6 7M7 10l6-7" /></>,
    'FILE': <path d="M3 2h7l3 3v9H3zm7 0v3h3" />,
    'COGNITIVE': <><path d="M8 2a5 5 0 015 5c0 2-1 4-3 5l-2 2-2-2c-2-1-3-3-3-5a5 5 0 015-5z" /><path d="M6 7h4M7 9h2" /></>,
};

