/**
 * 🌐 OMD-10: EXPLORADOR DE CONTEXTO (The Source)
 * 
 * SOBERANÍA: Servicio Global Transversal de Nivel 2.
 * Axioma: "Lo que el sistema sabe, el usuario lo ve en tiempo real."
 */

import bridge from '../../../core/kernel/SovereignBridge';
import './ContextExplorer.css';

export const ContextExplorer = () => {
    const [stream, setStream] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        // Simulación de "Live Value Pulses"
        const interval = setInterval(() => {
            setStream(prev => prev.map(v => ({
                ...v,
                value: v.type === 'number' ? (typeof v.value === 'number' ? (v.value + (Math.random() - 0.5) * 0.01).toFixed(3) : v.value) : v.value
            })));
        }, 2000);

        // Carga inicial (Hydration Axiomática vía Bridge)
        const fetchContext = async () => {
            try {
                const data = await bridge.resolveDataSource('CONTEXT_SIGNALS');
                setStream(data);
                setLoading(false);
            } catch (err) { console.error(err); setLoading(false); }
        };

        fetchContext();
        return () => clearInterval(interval);
    }, []);

    const handleDragStart = (e, variable) => {
        e.dataTransfer.setData('indra/variable', JSON.stringify(variable));
        e.dataTransfer.effectAllowed = 'copy';

        // Efecto visual de "Iniciación de Vínculo"
        window.dispatchEvent(new CustomEvent('system-link-start', { detail: variable.id }));
    };

    const filters = ['ALL', 'SYSTEM', 'ADAPTER', 'NEURAL', 'SENSING'];

    return (
        <div className="the-source-explorer">
            <div className="source-header">
                <span className="source-title">THE SOURCE</span>
                <span className="source-pulse">LIVE - 12ms</span>
            </div>

            <div className="source-filter-bar">
                {filters.map(f => (
                    <button
                        key={f}
                        className={`filter-dot ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                        title={f}
                    >
                        {f[0]}
                    </button>
                ))}
            </div>

            <div className="source-inventory scroll-stark">
                {loading ? (
                    <div className="source-ghost-loader">HYDRATING...</div>
                ) : stream.filter(v => activeFilter === 'ALL' || v.source === activeFilter).map(v => (
                    <div
                        key={v.id}
                        className="var-row"
                        draggable
                        onDragStart={(e) => handleDragStart(e, v)}
                    >
                        <div className="var-metadata">
                            <span className="var-icon">{v.type === 'number' ? '#' : 'T'}</span>
                            <div className="var-names">
                                <span className="var-label">{v.label}</span>
                                <span className="var-id">{v.id}</span>
                            </div>
                        </div>
                        <div className="var-monitor">
                            {v.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="source-footer">
                TOTAL SIGNALS: {stream.length}
            </div>
        </div>
    );
};

export default ContextExplorer;
