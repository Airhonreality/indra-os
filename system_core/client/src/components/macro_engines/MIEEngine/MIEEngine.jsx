import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../state/app_state';
import { MIENavbar } from './layout/MIENavbar';
import { MIESidebar } from './layout/MIESidebar';
import { MIEQueuePanel } from './widgets/MIEQueuePanel';

// Workspace
import { MIEMainWorkspace } from './modes/MIEMainWorkspace';
import { IngestGuestView } from './guest/IngestGuestView';

import { useMIE } from './widgets/useMIE';
import { useMIETransport } from './widgets/useMIETransport';

import './MIEEngine.css';

/**
 * MIE ENGINE - MacroEngine UI (Plan B)
 * RESPONSABILIDAD: Shell de orquestación visual para ingesta multimedia.
 * AXIOMA DE LIBERTAD: Funciona tanto para el dueño (connected) como invitado (guest).
 */
export default function MIEEngine() {
    const activeTool = useAppState(s => s.activeTool);
    const mieState = useMIE({ defaultPreset: 'BALANCED' });
    const transportState = useMIETransport(mieState);

    // Render principal
    const renderCenterPanel = () => {
        if (activeTool === 'INGEST_GUEST') return <IngestGuestView mieState={mieState} />;
        return <MIEMainWorkspace mieState={mieState} transportState={transportState} />;
    };

    return (
        <div className="mie-engine-shell stack">
            <MIENavbar />
            
            <div className="mie-engine-body">
                {activeTool !== 'INGEST_GUEST' && (
                    <MIESidebar 
                        mieState={mieState}
                        transportState={transportState}
                    />
                )}
                
                <main className="mie-engine-center">
                    {renderCenterPanel()}
                </main>

                <MIEQueuePanel jobs={mieState.jobs} results={mieState.results} />
            </div>
        </div>
    );
}
