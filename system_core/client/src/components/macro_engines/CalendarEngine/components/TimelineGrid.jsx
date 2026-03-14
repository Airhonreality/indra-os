import React from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * =============================================================================
 * COMPONENTE: TimelineGrid
 * RESPONSABILIDAD: Visualización cronológica pura (CHRONOS_FABRIC).
 * AXIOMA: La estructura del tiempo es constante, el dato es variable.
 * =============================================================================
 */
export function TimelineGrid({ currentDate, viewMode, events = [], onEventClick }) {
    const days = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="timeline-grid fill flex-column overflow-hidden relative" style={{ background: 'var(--indra-bg-void)' }}>
            {/* Background Grid */}
            <div className="kinetic-timeline-bg" />

            {/* Header: Días y Números de Semana */}
            <div className="timeline-header flex border-bottom" style={{ height: '48px', position: 'sticky', top: 0, z-index: 100 }}>
                <div className="hour-label border-right flex align-center justify-center" style={{ width: '60px', opacity: 0.8, background: '#0e0e0f' }}>
                    <span className="font-mono text-3xs opacity-40">UTC-05</span>
                </div>
                {days.map((day, idx) => (
                    <div key={day} className="flex-1 timeline-header-cell border-right relative">
                        <div className="font-mono" style={{ fontSize: '10px', fontWeight: 900 }}>{day}</div>
                        <div className="font-mono opacity-30 mt-1" style={{ fontSize: '8px' }}>
                            // 0{idx + 1}
                        </div>
                    </div>
                ))}
            </div>

            {/* Body: Horas y Slot de Eventos */}
            <div className="timeline-body flex-1 overflow-y-auto relative scroll-minimal">
                {hours.map(hour => (
                    <div key={hour} className="hour-row flex" style={{ height: '70px', minHeight: '70px' }}>
                        <div className="hour-label border-right flex align-center justify-center font-mono relative">
                            <span className="text-xs" style={{ letterSpacing: '1px' }}>{hour.toString().padStart(2, '0')}:00</span>
                            <div className="absolute opacity-5 pt-4" style={{ fontSize: '7px' }}>0x{(hour).toString(16).toUpperCase()}</div>
                        </div>
                        {days.map(day => (
                            <div key={`${day}-${hour}`} className="day-cell border-right opacity-80" />
                        ))}
                    </div>
                ))}

                {/* Capa de Proyección de Eventos (Indra Atoms) */}
                <div className="events-layer absolute inset-0 pointer-events-none" style={{ marginLeft: '60px', marginTop: '48px' }}>
                    {events.map((event, idx) => (
                        <div 
                            key={event.id || idx}
                            className="event-atom-mini pointer-events-auto absolute"
                            onClick={() => onEventClick?.(event)}
                            style={{
                                /* 
                                   AQUÍ IRÁ EL POSICIONAMIENTO DINÁMICO: 
                                   top: calculateTopFromDate(event.start),
                                   height: calculateHeightFromDuration(event.start, event.end),
                                   left: calculateLeftFromDay(event.start)
                                */
                                display: 'none' // Hidden until layout engine is ready
                            }}
                        >
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
