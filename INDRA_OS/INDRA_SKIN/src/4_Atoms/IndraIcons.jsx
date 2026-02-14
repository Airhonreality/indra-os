/**
 * IndraIcons.jsx
 * SISTEMA DE ICONOGRAFÍA SOBERANA (Stark v8.0)
 * DHARMA: Pureza geométrica y legibilidad técnica.
 */

import React from 'react';

const IconBase = ({ children, size = 16, color = 'currentColor', className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block transition-all duration-300 ${className}`}
    >
        {children}
    </svg>
);

export const Icons = {
    // Sistema / Auto
    System: (props) => (
        <IconBase {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M12 8v8M8 12h8" />
        </IconBase>
    ),
    // Auth / Llave
    Lock: (props) => (
        <IconBase {...props}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </IconBase>
    ),
    // Cosmos / Galaxia
    Cosmos: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" />
        </IconBase>
    ),
    // Desktop / Realidad
    Desktop: (props) => (
        <IconBase {...props}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
        </IconBase>
    ),
    // Lab / Tubo de Ensayo
    Lab: (props) => (
        <IconBase {...props}>
            <path d="M9 3h6M10 3v13a4 4 0 1 0 4 0V3M8.5 10h7" />
        </IconBase>
    ),
    // Sincronización
    Sync: (props) => (
        <IconBase {...props}>
            <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M3.51 15a9 9 0 0 0 14.85 3.36L23 14" />
        </IconBase>
    ),
    // Temas
    Sun: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </IconBase>
    ),
    Moon: (props) => (
        <IconBase {...props}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </IconBase>
    ),
    // Consola
    Terminal: (props) => (
        <IconBase {...props}>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </IconBase>
    ),
    List: (props) => (
        <IconBase {...props}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </IconBase>
    ),
    Clock: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </IconBase>
    ),
    ChevronDown: (props) => (
        <IconBase {...props}>
            <polyline points="6 9 12 15 18 9" />
        </IconBase>
    ),
    Plus: (props) => (
        <IconBase {...props}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </IconBase>
    ),
    Eye: (props) => (
        <IconBase {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </IconBase>
    ),
    SidebarLeft: (props) => (
        <IconBase {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
        </IconBase>
    ),
    SidebarRight: (props) => (
        <IconBase {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
        </IconBase>
    ),
    Search: (props) => (
        <IconBase {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </IconBase>
    ),
    Filter: (props) => (
        <IconBase {...props}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </IconBase>
    ),
    Close: (props) => (
        <IconBase {...props}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </IconBase>
    ),
    ChevronRight: (props) => (
        <IconBase {...props}>
            <polyline points="9 18 15 12 9 6" />
        </IconBase>
    ),
    Activity: (props) => (
        <IconBase {...props}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </IconBase>
    ),
    Trash: (props) => (
        <IconBase {...props}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </IconBase>
    ),
    Sovereign: (props) => (
        <IconBase {...props}>
            <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z" />
            <path d="M12 22V12" />
            <path d="M12 12l-5 3" />
            <path d="M12 12l5 3" />
            <path d="M12 7l-5 3" />
            <path d="M12 7l5 3" />
            <circle cx="12" cy="12" r="2" />
        </IconBase>
    ),
    Database: (props) => (
        <IconBase {...props}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </IconBase>
    ),
    Vault: (props) => (
        <IconBase {...props}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </IconBase>
    ),
    Download: (props) => (
        <IconBase {...props}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </IconBase>
    ),
    Inbox: (props) => (
        <IconBase {...props}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </IconBase>
    ),
    Transform: (props) => (
        <IconBase {...props}>
            <path d="M2 3h6a4 4 0 0 1 4 4v10a4 4 0 0 0 4 4h6" />
            <path d="M2 11h20" />
            <path d="M7 6l-5 5 5 5" />
            <path d="M17 16l5-5-5-5" />
        </IconBase>
    ),
    Settings: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </IconBase>
    ),
    Help: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </IconBase>
    ),
    ArrowRight: (props) => (
        <IconBase {...props}>
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </IconBase>
    ),
    Maximize: (props) => (
        <IconBase {...props}>
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </IconBase>
    ),
    Cpu: (props) => (
        <IconBase {...props}>
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="15" x2="23" y2="15" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="15" x2="4" y2="15" />
        </IconBase>
    ),
    Connect: (props) => (
        <IconBase {...props}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </IconBase>
    ),
    TV_SCREEN: (props) => (
        <IconBase {...props}>
            <rect x="2" y="3" width="20" height="15" rx="2" />
            <path d="M7 21h10" />
            <path d="M12 18v3" />
        </IconBase>
    ),
    PDF: (props) => (
        <IconBase {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 15h3a2 2 0 0 0 0-4H9v4Z" />
        </IconBase>
    ),
    BRIDGE: (props) => (
        <IconBase {...props}>
            <path d="M3 11c8 0 10 0 18 0" />
            <path d="M3 15c8 0 10 0 18 0" />
            <path d="M6 11v4" />
            <path d="M18 11v4" />
            <path d="M12 11v4" />
        </IconBase>
    ),
    GRAVITY: (props) => (
        <IconBase {...props}>
            <path d="m12 2 3 3h-2v12h2l-3 3-3-3h2V5H9l3-3Z" />
        </IconBase>
    ),
    ENTROPY: (props) => (
        <IconBase {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </IconBase>
    ),
    DIMENSIONS: (props) => (
        <IconBase {...props}>
            <path d="M21 3v18H3V3h18Zm-2 2H5v14h14V5Z" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
        </IconBase>
    ),
    Check: (props) => (
        <IconBase {...props}>
            <polyline points="20 6 9 17 4 12" />
        </IconBase>
    )
};

export default Icons;
