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
            strokeWidth="var(--indra-icon-stroke, 1.8)"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    'SCHEMA': <><path d="M2 4h12M2 8h12M2 12h12M5 2v12M11 2v12" /><rect x="2" y="2" width="12" height="12" rx="1" /></>,
    'BRIDGE': <><path d="M1 8h14M4 8c0-3 2-6 4-6s4 3 4 6M4 8c0 3 2 6 4 6s4-3 4-6" /><circle cx="4" cy="8" r="1" /><circle cx="12" cy="8" r="1" /></>,
    'DOCUMENT': <><path d="M4 2h8l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M11 2v4h4" /><path d="M6 7h4M6 10h6" /></>,
    'SERVICE': <><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="6" strokeDasharray="2 2" /><path d="M8 2v1M8 13v1M2 8h1M13 8h1" /></>,
    'FOLDER': <><path d="M1 4a1 1 0 011-1h4l2 2h7a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4z" /><path d="M1 7h14" /></>,
    'VAULT': <><rect x="3" y="5" width="10" height="9" rx="1" /><path d="M4 5V3a2 2 0 014 0v2" /><circle cx="8" cy="10" r="1.5" /></>,

    // ── ACCIONES ──
    'PLUS': <path d="M8 3v10M3 8h10" />,
    'MINUS': <path d="M3 8h10" />,
    'CLOSE': <path d="M3 3l10 10m0-10L3 13" />,
    'SAVE': <><path d="M3 2h8l2 2v10H3V2z" /><path d="M5 2v4h6V2" /><path d="M5 10h6v4H5z" /></>,
    'COPY': <path d="M4 4h9v9H4V4zm-2-2h9v9H2V2z" />,
    'LAYERS': <path d="M2 5l6 3 6-3-6-3-6 3zm0 3l6 3 6-3m-12 3l6 3 6-3" />,
    'DNA': <path d="M4 2c2 2 8 10 8 12M12 2C10 4 4 12 4 14M4 5h8M4 8h8M4 11h8" />,
    'SYNC': <><path d="M2.5 8a5.5 5.5 0 0 1 8.5-4.5" /><path d="M13.5 8a5.5 5.5 0 0 1-8.5 4.5" /><path d="M10 1l3 3-3 3M6 15l-3-3 3-3" /></>,
    'LINK': <><path d="M7 7l2 2" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /></>,
    'DRAG': <><circle cx="6" cy="4" r="1" /><circle cx="10" cy="4" r="1" /><circle cx="6" cy="8" r="1" /><circle cx="10" cy="8" r="1" /><circle cx="6" cy="12" r="1" /><circle cx="10" cy="12" r="1" /></>,
    'EDIT': <path d="M11 2l3 3-9 9-3 1 1-3 9-9z" />,
    'FRAME': <rect x="2" y="2" width="12" height="12" rx="1" />,

    // ── ESTADO ──
    'OK': <path d="M3 8l3 3 7-7" />,
    'CHECK': <path d="M3 8l3 3 7-7" />,
    'ERROR': <path d="M8 1v7m0 4v1m7-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    'LOCK': <><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V4a3 3 0 016 0v3" /></>,
    'INFO': <><circle cx="8" cy="8" r="7" /><path d="M8 11V7m0-2v.01" /></>,
    'RELOAD': <><path d="M2.5 8a5.5 5.5 0 0 1 8.5-4.5" /><path d="M13.5 8a5.5 5.5 0 0 1-8.5 4.5" /><path d="M10 1l3 3-3 3M6 15l-3-3 3-3" /></>,
    'CALENDAR': <><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M5 2v2M11 2v2M2 7h12" /><circle cx="5" cy="10" r="0.5" /><circle cx="8" cy="10" r="0.5" /><circle cx="11" cy="10" r="0.5" /></>,


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
    'WIDTH': <path d="M2 12h20M5 7l-3 5 3 5M19 7l3 5-3 5"/>,
    'HEIGHT': <path d="M12 2v20M7 5l5-3 5 3M7 19l5 3 5-3"/>,
    'SPACING': <path d="M3 5v14M21 5v14M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3"/>,
    'RADIUS': <path d="M12 3a9 9 0 0 1 9 9M3 12a9 9 0 0 1 9-9"/>,
    'GAP': <path d="M6 4v16M11 4v16M16 4v16M21 4v16"/>,
    'ALIGN': <path d="M3 12h18M3 6h18M3 18h10"/>,
    'TEXT_SIZE': <path d="M4 7V4h16v3M12 4v16m-4 0h8"/>,
    'WEIGHT': <path d="M6 4h10a4 4 0 0 1 0 8H6V4zm0 8h12a4 4 0 0 1 0 8H6v-8z"/>,
    'L_HEIGHT': <path d="M21 7H3M21 17H3M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3"/>,
    'L_SPACING': <path d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3"/>,
    'MATH': <path d="M8 3v10m-5-5h10m-7-3l4 4-4 4m6-8v8" />,
    'TEXT': <path d="M2 3h12v2H2zm0 4h9v2H2z" />,
    'EXTRACTOR': <path d="M8 2l5 5-5 5-5-5 5-5zM8 4l-3 3 3 3 3-3-3-3z" />,
    'LOGIC': <path d="M2 8h3m1-4h3M6 8h3M6 12h3M10 4h3M10 8h3M10 12h3" />,

    // ── MEDIA ──
    'PLAY': <path d="M4 3l9 5-9 5V3z" />,
    'PAUSE': <path d="M4 3h3v10H4V3zm5 0h3v10H9V3z" />,
    'TERMINAL': <path d="M2 3l4 5-4 5m4 0h8" />,
    'LOAD': <path d="M8 1a7 7 0 017 7" />,
    'EJECT': <><path d="M3 10L8 4l5 6" /><path d="M3 13h10" /></>,

    // ── HISTORIAL ──
    'UNDO': <><path d="M4 7l-3 3 3 3" /><path d="M1 10h7a4 4 0 0 0 0-8H5" /></>,
    'REDO': <><path d="M12 7l3 3-3 3" /><path d="M15 10H8a4 4 0 0 1 0-8h3" /></>,

    // ── DOCUMENT DESIGNER BLOCK TYPES ──
    'REPEATER': <><rect x="2" y="2" width="12" height="4" rx="1" /><rect x="2" y="8" width="12" height="4" rx="1" /><path d="M8 6v2" strokeDasharray="1 1" /></>,
    'IMAGE':    <><rect x="2" y="3" width="12" height="10" rx="1" /><path d="M2 10l3-3 3 3 2-3 4 6" /><circle cx="11" cy="6" r="1.5" /></>,
    'EXPAND':   <path d="M6 4l-4 4 4 4m4-8l4 4-4 4" />,

    // ── NUEVOS ICONOS POÉTICOS ──
    'DNA': <path d="M4 2c2 2 8 10 8 12M12 2C10 4 4 12 4 14M4 5h8M4 8h8M4 11h8" />,
    'BOLT': <path d="M9 1L4 9h4l-1 6 5-8h-4l1-6z" />,
    'MAP_ROUTE': <><circle cx="3" cy="3" r="1.5" /><circle cx="13" cy="13" r="1.5" /><path d="M4.5 3.5l7 9" strokeDasharray="2 2" /><path d="M3 4.5v3l4 4h3v2.5" /></>,
    'FILM': <><rect x="1" y="4" width="10" height="8" rx="1" /><path d="M14 5l-3 3 3 3V5z" /><circle cx="4" cy="8" r="1" /><circle cx="8" cy="8" r="1" /></>,
    'HEART_BEAT': <path d="M1 8h3l2-5 3 10 2-5h4" />,
    'PIVOT': <><circle cx="8" cy="8" r="1.5" /><path d="M8 3v2M8 11v2M3 8h2m6 0h2" /><path d="M4 4l1.5 1.5M10.5 10.5L12 12" /></>,
    'HEXAGON': <path d="M8 1l6 3.5v7L8 15 2 11.5v-7L8 1z" />,

    // ── ALIASES DE CLASE (para atom.class → icono) ──
    'DATA_SCHEMA': <path d="M8 1l6 3.5v7L8 15 2 11.5v-7L8 1z" />, // HEXAGON
    'WORKFLOW': <><circle cx="3" cy="3" r="1.5" /><circle cx="13" cy="13" r="1.5" /><path d="M4.5 3.5l7 9" strokeDasharray="2 2" /><path d="M3 4.5v3l4 4h3v2.5" /></>, // MAP_ROUTE
    'VIDEO_PROJECT': <><rect x="1" y="4" width="10" height="8" rx="1" /><path d="M14 5l-3 3 3 3V5z" /><circle cx="4" cy="8" r="1" /><circle cx="8" cy="8" r="1" /></>, // FILM
    'CALENDAR_HIVE': <path d="M1 8h3l2-5 3 10 2-5h4" />, // HEART_BEAT
    'AEE_RUNNER': <path d="M9 1L4 9h4l-1 6 5-8h-4l1-6z" />, // BOLT
    'VIRTUAL_SERVICE': <><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="6" strokeDasharray="2 2" /><path d="M8 2v1M8 13v1M2 8h1M13 8h1" /></>, // ORBIT
    'TIMELINE': <path d="M1 13h14M3 13V9m3 4V7m3 6V10m3 3V6m3 7V11" />,
    'SCISSORS': <><circle cx="5" cy="5" r="2" /><circle cx="5" cy="11" r="2" /><path d="M7 6l6 7M7 10l6-7" /></>,
    'FILE': <path d="M3 2h7l3 3v9H3zm7 0v3h3" />,
    'COGNITIVE': <><path d="M8 2a5 5 0 015 5c0 2-1 4-3 5l-2 2-2-2c-2-1-3-3-3-5a5 5 0 015-5z" /><path d="M6 7h4M7 9h2" /></>,
    'LIGHT': <><circle cx="8" cy="8" r="3" /><path d="M8 1v2m0 10v2M1 8h2m10 0h2m-12-5l1.5 1.5m9.5 9.5l1.5 1.5m-11 0l1.5-1.5m9.5-9.5l1.5-1.5" /></>,
    'DARK': <path d="M12 9a6 6 0 11-8-8 7 7 0 008 8z" />,
};

