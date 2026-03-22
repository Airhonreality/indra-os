import { useAppState } from '../../../state/app_state';

/**
 * =============================================================================
 * COMPONENTE: StationCard (Átomo de Orquestación)
 * DOGMA: El Lienzo es Guía, el Inspector es Poder.
 * =============================================================================
 */
export function StationCard({ station, index, isSelected, isExecuting, onSelect, integrityStatus }) {
    const isSyncing = useAppState(state => state.pendingSyncs[station.id]);

    // Verificación de Calibración Local
    const isCabled = () => {
        if (station.type === 'PROTOCOL') {
            return Boolean((station.config?.provider || station.provider) && (station.config?.protocol || station.protocol));
        }
        if (station.type === 'MAP') return (station.config?.pruning?.length > 0);
        if (station.type === 'ROUTER') return Boolean(station.config?.route?.leftPath && station.config?.route?.operator);
        return true;
    };

    const isHealthy = isCabled() && (integrityStatus?.status !== 'ORPHAN');

    const typeMap = {
        'PROTOCOL': { label: 'ACCIÓN_ATÓMICA', icon: 'SERVICE' },
        'ROUTER': { label: 'BIFURCACIÓN_LÓGICA', icon: 'LOGIC' },
        'MAP': { label: 'MAPEADOR_DE_DATOS', icon: 'SCHEMA' }
    };
    const typeInfo = typeMap[station.type] || { label: station.type.toUpperCase(), icon: 'LOGIC' };

    return (
        <div
            className={`station-node type-${station.type.toLowerCase()} ${isSelected ? 'selected' : ''} ${isExecuting ? 'executing' : ''}`}
            onClick={onSelect}
            style={{ 
                background: isSelected ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)', 
                border: isSelected ? '1px solid var(--indra-dynamic-accent)' : '1px solid rgba(0,0,0,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: isExecuting ? '0 0 20px var(--indra-dynamic-accent)' : (isSelected ? '0 12px 30px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.01)'),
                minWidth: '220px',
                position: 'relative',
                transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                cursor: 'pointer',
                scale: isExecuting ? '1.02' : '1',
                opacity: isSyncing ? 0.4 : 1,
                filter: isSyncing ? 'grayscale(1)' : 'none',
                pointerEvents: isSyncing ? 'none' : 'auto'
            }}
        >
            {/* Encabezado: Tipo (Visual) */}
            <div className="shelf--tight" style={{ marginBottom: 'var(--space-3)', opacity: 0.4 }}>
                <IndraIcon name={typeInfo.icon} size="10px" color="var(--indra-dynamic-accent)" />
                <span className="font-mono" style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.12em' }}>
                    {typeInfo.label}
                </span>
            </div>

            {/* Identidad Estática (Visual) */}
            <div className="stack--tight" style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
                <span className="font-mono" style={{ 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    color: '#1e293b',
                    letterSpacing: '0.05em'
                }}>
                    {station.config?.label || 'PASO_SIN_NOMBRE'}
                </span>
            </div>

            {/* Estado de Calibración */}
            <div className="center" style={{ marginTop: '12px' }}>
                <div className={`status-pill ${isHealthy ? 'linked' : 'pending'}`} style={{ 
                    fontSize: '7px', 
                    background: isHealthy ? 'var(--indra-dynamic-bg)' : 'rgba(239, 68, 68, 0.05)', // Rojo si no es healthy
                    color: isHealthy ? 'var(--indra-dynamic-accent)' : '#ef4444',
                    padding: '2px 12px',
                    borderRadius: '3px',
                    fontWeight: '800',
                    letterSpacing: '0.1em',
                    border: `1px solid ${isHealthy ? 'rgba(0,0,0,0.02)' : '#ef444430'}`
                }}>
                    {integrityStatus?.status === 'ORPHAN' ? 'HUÉRFANO' : (isCabled() ? 'CALIBRADO' : 'PENDIENTE')}
                </div>
            </div>
        </div>
    );
}
