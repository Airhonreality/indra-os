import React from 'react';

// 🖌️ Minimalist SVG Icon System
// Design System: INDRA Axiomatic V1
// Stroke Width: 1.5px | Cap: Round | Join: Round

const SvgTemplate = ({ children, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`indra-icon ${className}`}
        style={{ verticalAlign: 'middle', display: 'inline-block' }}
    >
        {children}
    </svg>
);

export const Icons = {
    // 🔬 Microscope / Zoom
    Microscope: () => (
        <SvgTemplate>
            <path d="M6 18h8" />
            <path d="M3 22h18" />
            <path d="M14 22a7 7 0 1 0 0-14h-1" />
            <path d="M9 14h2" />
            <path d="M9 12a2 2 0 0 1 2-2v6a2 2 0 0 1-2-2z" />
            <line x1="12" y1="6" x2="12" y2="3" />
        </SvgTemplate>
    ),

    // 🏗️ Workspace -> Tesseract / Cube
    Workspace: () => (
        <SvgTemplate>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </SvgTemplate>
    ),

    // ⚙️ System/BIOS -> Core / CPU
    System: () => (
        <SvgTemplate>
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
        </SvgTemplate>
    ),

    // 🌳 Flow -> Node Path
    Flow: () => (
        <SvgTemplate>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </SvgTemplate>
    ),

    // 📐 Layout -> Dashboard / Grid
    Layout: () => (
        <SvgTemplate>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
        </SvgTemplate>
    ),

    // 🧪 Recipe/Materia -> Flask / Component
    Recipe: () => (
        <SvgTemplate>
            <path d="M10 2v7.31" />
            <path d="M14 2v7.31" />
            <path d="M8.5 2h7" />
            <path d="M14 9.3a6.5 6.5 0 1 1-4 0V2" />
        </SvgTemplate>
    ),

    // 🚀 Search -> Lens / Spark
    Search: () => (
        <SvgTemplate>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </SvgTemplate>
    ),

    // 🕒 History -> Clock / Time
    History: () => (
        <SvgTemplate>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </SvgTemplate>
    ),

    // ◈ Stencil/Capacity -> Star / Source
    Stencil: () => (
        <SvgTemplate>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </SvgTemplate>
    ),

    // ▢ Entity -> File / Doc
    Entity: () => (
        <SvgTemplate>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </SvgTemplate>
    ),

    // ⚠️ Unknown -> Alert
    Unknown: () => (
        <SvgTemplate>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </SvgTemplate>
    ),

    // 📁 Folder
    Folder: () => (
        <SvgTemplate>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </SvgTemplate>
    ),

    // 📡 Satellite (CoreBridge)
    Satellite: () => (
        <SvgTemplate>
            <path d="M13.6 5.4c.5-.5 2.1-.5 2.6 0l5.4 5.4c.5.5.5 2.1 0 2.6l-5.4 5.4c-.5.5-2.1.5-2.6 0l-5.4-5.4c-.5-.5-.5-2.1 0-2.6L13.6 5.4z" />
            <line x1="6" y1="18" x2="8.5" y2="15.5" />
            <line x1="3" y1="21" x2="5" y2="19" />
            <path d="M2.5 7.5a10 10 0 0 1 14 0" />
            <path d="M1 4.5a14 14 0 0 1 20 0" />
        </SvgTemplate>
    ),

    // 🌊 Wave (Data Flux)
    Wave: () => (
        <SvgTemplate>
            <path d="M2 12c.6 0 1.2-.2 1.6-.6.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6c.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6c.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6" />
            <path d="M2 16c.6 0 1.2-.2 1.6-.6.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6c.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6s1.2-.2 1.6-.6c.3-.3.8-.8 1.4-.8s1.1.5 1.4.8c.4.4 1 .6 1.6.6" />
        </SvgTemplate>
    ),

    // 🧠 Brain (State) / Logic
    Brain: () => (
        <SvgTemplate>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </SvgTemplate>
    ),

    // ⚡ Zap (Sync)
    Zap: () => (
        <SvgTemplate>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </SvgTemplate>
    ),

    // 📦 Package (Node)
    Package: () => (
        <SvgTemplate>
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </SvgTemplate>
    ),

    // Play / Pause
    Play: () => (
        <SvgTemplate>
            <polygon points="5 3 19 12 5 21 5 3" />
        </SvgTemplate>
    ),
    Pause: () => (
        <SvgTemplate>
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
        </SvgTemplate>
    ),
    Close: () => (
        <SvgTemplate>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </SvgTemplate>
    ),

    // 🚮 Trash
    Trash: () => (
        <SvgTemplate>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </SvgTemplate>
    ),

    // 📑 Copy / Clone
    Copy: () => (
        <SvgTemplate>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </SvgTemplate>
    ),

    // 🧬 DNA / Helix
    DNA: () => (
        <SvgTemplate>
            <path d="M2 15c6.667-6 13.333 0 20-6" />
            <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
            <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
            <path d="M17 16.928c0 2.818-.833 5.172-2.5 7.072" />
            <path d="M7 7.072C7 4.254 7.833 1.9 9.5 0" />
            <path d="M14 9c.5 1 1 2.5 1 4" />
            <path d="M10 13c-.5-1-1-2.5-1-4" />
            <path d="M7 17c.5 1 1 2.5 1 4" />
            <path d="M17 7c-.5-1-1-2.5-1-4" />
        </SvgTemplate>
    ),

    // 🔗 Link
    Link: () => (
        <SvgTemplate>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </SvgTemplate>
    ),

    // 📋 Clipboard
    Clipboard: () => (
        <SvgTemplate>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </SvgTemplate>
    ),

    // ⌬ Molecule / Benzene
    Molecule: () => (
        <SvgTemplate>
            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" />
            <circle cx="12" cy="12" r="3" />
        </SvgTemplate>
    ),
    // 🔑 Key
    Key: () => (
        <SvgTemplate>
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778z" />
            <path d="M12.21 12.21L15 9.42M14 11l2-2M16 9l2-2" />
        </SvgTemplate>
    )
};
