import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * =============================================================================
 * COMPONENTE: EventAtomUI
 * RESPONSABILIDAD: Representación de un átomo temporal (CALENDAR_EVENT).
 * AXIOMA: Identidad de silo explícita, estética canónica.
 * =============================================================================
 */
export function EventAtomUI({ event, onClick }) {
    if (!event) return null;

    const fields = event.payload?.fields || {};
    const source = fields.source_identity || {};

    return (
        <div 
            className="event-atom-ui p-3 stack--tight animate-fade-in relative overflow-hidden"
            onClick={onClick}
            style={{ 
                borderLeft: '3px solid var(--indra-dynamic-accent)',
                cursor: 'pointer',
                background: 'var(--indra-panel-bg)',
                borderRadius: 'var(--indra-ui-radius)',
                minHeight: '80px'
            }}
        >
            {/* Fondo de Marca de Agua de Silo */}
            <div className="absolute opacity-5" style={{ bottom: '-10px', right: '-10px' }}>
                <IndraIcon name={source.silo === 'google' ? 'GOOGLE' : 'CALENDAR'} size="60px" />
            </div>

            <div className="spread align-center mb-2">
                <div className="shelf--tight p-x-1" style={{ background: 'var(--indra-dynamic-border)', borderRadius: '2px' }}>
                    <IndraIcon name={source.silo === 'google' ? 'GOOGLE' : 'CALENDAR'} size="10px" style={{ color: 'var(--indra-dynamic-accent)' }} />
                    <span className="font-mono" style={{ fontSize: '8px', color: 'var(--indra-dynamic-accent)', fontWeight: 'bold' }}>
                        {source.silo?.toUpperCase() || 'NATIVE'} // {source.account || 'INDRA_ACCOUNT'}
                    </span>
                </div>
                <div className="font-mono opacity-20" style={{ fontSize: '8px' }}>ATOM_ID: {event.id?.split('|')[1]?.substring(0, 6)}...</div>
            </div>

            <div className="stack--tight">
                <div className="font-bold text-sm mb-1 leading-tight">{fields.summary || 'EVENTO_SIN_TITULO'}</div>
                <div className="shelf--tight opacity-60">
                    <IndraIcon name="CLOCK" size="10px" />
                    <span className="font-mono" style={{ fontSize: '9px' }}>
                        {fields.start ? new Date(fields.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                        <span className="mx-1 opacity-30">→</span>
                        {fields.end ? new Date(fields.end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                    </span>
                </div>
                {fields.location && (
                    <div className="shelf--tight opacity-40 mt-1">
                        <IndraIcon name="MAP_PIN" size="10px" />
                        <span className="font-mono truncate" style={{ fontSize: '9px', maxWidth: '200px' }}>
                            {fields.location}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="absolute" style={{ top: '8px', right: '8px' }}>
                <IndraIcon name="DRAG" size="12px" className="opacity-10" />
            </div>
        </div>
    );
}
