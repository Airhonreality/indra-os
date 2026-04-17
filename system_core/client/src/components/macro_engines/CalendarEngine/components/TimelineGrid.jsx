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

    /**
     * Calcula la posición absoluta y dimensiones de un átomo temporal
     * basándose en sus metadata canónicas (start, end).
     */
    const getEventStyles = (event) => {
        const start = event?.payload?.fields?.start;
        const end = event?.payload?.fields?.end;
        if (!start || !end) return { display: 'none' };
        
        try {
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // Si el evento no pertenece a la semana actual (L-D de currentDate), no se renderiza (TODO: filtrar en hook)
            
            // Columna (Lunes = 0, Domingo = 6)
            let day = startDate.getDay() - 1;
            if (day === -1) day = 6; // Domingo JS=0 -> Indra=6
            
            // Fila y altura (70px por hora según el diseño)
            const startHour = startDate.getHours();
            const startMin = startDate.getMinutes();
            const top = (startHour * 70) + ((startMin / 60) * 70);
            
            const durationMin = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
            const height = (durationMin / 60) * 70;

            const baseColor = event?.payload?.fields?.source_identity?.color || 'var(--indra-dynamic-accent)';

            return {
                top: `${top}px`,
                height: `${height}px`,
                left: `calc((100% / 7) * ${day})`,
                width: `calc(100% / 7)`,
                position: 'absolute',
                backgroundColor: baseColor,
                color: '#000',
                padding: '2px 6px',
                borderLeft: '3px solid rgba(255,255,255,0.8)',
                borderRadius: 'var(--indra-ui-radius)',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                lineHeight: '1.2'
            };
        } catch (err) {
            console.error('[UCP] Error iterando átomo:', err);
            return { display: 'none' };
        }
    };

    return (
        <div className="timeline-grid fill flex-column overflow-hidden relative" style={{ background: 'var(--indra-bg-void)' }}>
            {/* Background Grid */}
            <div className="kinetic-timeline-bg" />

            {/* Header: Días y Números de Semana */}
            <div className="timeline-header border-bottom" style={{ height: '48px', position: 'sticky', top: 0, zIndex: 100, display: 'flex' }}>
                <div className="hour-label border-right flex align-center justify-center" style={{ width: '60px', opacity: 0.8, background: '#0e0e0f' }}>
                    <span className="font-mono text-3xs opacity-40">UTC-05</span>
                </div>
                {days.map((day, idx) => (
                    <div key={day} className="flex-1 timeline-header-cell border-right relative">
                        <div className="font-mono" style={{ fontSize: '10px', fontWeight: 900 }}>{day}</div>
                        <div className="font-mono opacity-30 mt-1" style={{ fontSize: '8px' }}>
                            {"// "} 0{idx + 1}
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
                    {events.map((event, idx) => {
                        const style = getEventStyles(event);
                        if (style.display === 'none') return null;

                        return (
                            <div 
                                key={event.id || idx}
                                className="event-atom-mini pointer-events-auto hover-scale"
                                onClick={() => onEventClick?.(event)}
                                style={{ ...style, transition: 'transform 0.1s' }}
                            >
                                <span className="font-mono" style={{ fontSize: '8px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {event.payload?.fields?.summary || 'SIN TÍTULO'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
