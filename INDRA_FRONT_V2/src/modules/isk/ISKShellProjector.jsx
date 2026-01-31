/**
 * modules/isk/ISKShellProjector.jsx
 * 
 * DHARMA: Proyector del Kernel Espacial de Indra.
 * Lee la ley (JSON) y manifiesta la realidad (Componentes).
 */

import React, { useEffect, useState } from 'react';
import { ISK_MODULE_REGISTRY } from './ISK_Module_Registry';
import './ISKShellProjector.css';

export function ISKShellProjector() {
    const [layout, setLayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        async function loadLaw() {
            try {
                // Sourcing: Leemos la ley espacial desde el archivo JSON
                const response = await fetch('/src/modules/isk/laws/isk_designer_layout.json');
                if (!response.ok) throw new Error("Law not found");
                const schema = await response.json();
                setLayout(schema);
                setLoading(false);
            } catch (error) {
                console.error("❌ ISK Law Violation:", error);
                setLoading(false);
            }
        }
        loadLaw();
    }, []);

    if (loading) {
        return (
            <div className="isk-loading">
                <div className="isk-loading-spinner"></div>
                <span>Initialising Spatial Kernel...</span>
            </div>
        );
    }

    if (!layout) return <div className="isk-error">ERR_NO_LAW</div>;

    const toggleMaximize = () => setIsMaximized(!isMaximized);

    // Helpers de Renderizado
    const renderSlot = (slotName) => {
        const ModuleComponent = ISK_MODULE_REGISTRY[slotName];
        return ModuleComponent ? (
            <ModuleComponent />
        ) : (
            <div className="isk-empty-slot">
                <code>Slot Empty: {slotName}</code>
            </div>
        );
    };

    const ZoneRenderer = ({ zoneId, config }) => {
        // Mapear ID de zona a nombre de slot usando 'slots' del layout
        const slotName = layout.slots[config.id];
        return (
            <>
                <div className="isk-zone-header">
                    <span className="isk-zone-label">{config.label}</span>
                </div>
                <div className="isk-zone-content">
                    {renderSlot(slotName)}
                </div>
            </>
        );
    };

    return (
        <div className={`isk-shell-projector ${isMaximized ? 'isk-fullscreen' : ''}`}>
            {/* Botón de Control Zen Mode (Flotante) */}
            <button
                className="isk-zen-toggle"
                onClick={toggleMaximize}
                title={isMaximized ? "Restaurar a Módulo" : "Modo Zen (Pantalla Completa)"}
            >
                {isMaximized ? '↙' : '⤢'}
            </button>

            {/* Zonas Grid */}
            <div className="isk-zone isk-zone-left" style={{ width: layout.zones.A.default_width }}>
                <ZoneRenderer zoneId="navigator_zone" config={layout.zones.A} />
            </div>

            <div className="isk-zone isk-zone-center">
                {/* El centro suele tener controles propios, renderizamos directo */}
                <div className="isk-zone-header">{layout.zones.B.label}</div>
                <div className="isk-zone-content">
                    {renderSlot(layout.slots.stage_zone)}
                </div>
            </div>

            <div className="isk-zone isk-zone-right" style={{ width: layout.zones.C.default_width }}>
                <ZoneRenderer zoneId="inspector_zone" config={layout.zones.C} />
            </div>

            <div className="isk-zone isk-zone-bottom" style={{ height: layout.zones.D.height }}>
                <ZoneRenderer zoneId="hud_zone" config={layout.zones.D} />
            </div>
        </div>
    );
}
