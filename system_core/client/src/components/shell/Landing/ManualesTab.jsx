
export const ManualesTab = () => (
    <div style={{maxWidth: '1000px', width: '90%', margin: '0 auto', padding: '160px 0'}}>
        <h2 style={{fontSize: '32px', fontWeight: 300, letterSpacing: '0.2em', marginBottom: '80px', textAlign: 'center'}}>DOCUMENTACIÓN_DE_VUELO</h2>
        <div className="tutorial-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
            {[
                { title: 'TERRITORIO SOBERANO (DRIVE)', desc: 'IMPORTANTE: Indra creará la carpeta .core_system en tu Drive. Es el corazón del sistema; borrarla causará la muerte cerebral de tu instancia y pérdida de datos.' },
                { title: 'CARGA REALIDAD: INDUCCIÓN', desc: 'Aprende a asimilar bases de datos externas (Notion/Drive) y convertirlas en esquemas inteligentes automáticamente.' },
                { title: 'DISEÑO DE COTIZADOR', desc: 'Manual paso a paso para crear un sistema de cotización profesional con repetidores y lógica de cálculo.' },
                { title: 'DISEÑO DE PUENTES', desc: 'Tutorial avanzado sobre cómo conectar silos de datos y orquestar flujos de verdad bidireccionales.' },
                { title: 'NAVEGACIÓN & INTERFAZ HUD', desc: 'Domina la interfaz industrial, atajos de teclado y el motor de búsqueda universal de INDRA.' }
            ].map((m, i) => (
                <div key={i} className="indra-card" style={{ padding: '40px', textAlign: 'left' }}>
                    <h3 className="card-title" style={{color: 'var(--color-text-primary)', marginBottom: '16px', fontWeight: 600, fontSize: '14px', letterSpacing: '0.1em'}}>{m.title}</h3>
                    <p className="card-body" style={{fontSize: '13px', opacity: 0.6, fontWeight: 300}}>{m.desc}</p>
                    <button className="btn btn--mini" style={{marginTop: '30px', fontSize: '10px', fontWeight: 300, border: '1px solid rgba(255,255,255,0.1)'}}>ABRIR_MANUAL</button>
                </div>
            ))}
        </div>
    </div>
);
