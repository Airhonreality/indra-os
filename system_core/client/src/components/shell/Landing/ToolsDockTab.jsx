import { useState, useRef } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';

/* =============================================
   TOOLS DOCK TAB (Librería Libre)
   AXIOMA: Sub-página soberana. Corre local.
   ============================================= */

const AVAILABLE_TOOLS = [
    {
        id: 'MIE',
        name: 'MIE ENGINE',
        tag: 'MULTIMEDIA INGEST',
        poeticTitle: 'Fragmentación Multimedia',
        desc: 'Transcodificador universal agnóstico. Optimiza, fragmenta y prepara media para cualquier silo soberano sin perder calidad ni metadatos.',
        image: '/indra_video_engine_preview.png',
        status: 'READY_FREE',
        accentVar: '--color-accent', // siempre usa token
        docs: {
            axioms: ['Agnosticismo Total', 'Privacidad por Diseño', 'Eficiencia Atómica'],
            description: 'Diseñado para eliminar la fricción técnica en el manejo de archivos masivos directamente desde el cliente. Corre 100% en tu navegador usando Web Workers.',
            code: 'const transcode = await indra.mie.process(file,\n  { codec: "H.264", chunk: "2MB" }\n);',
            activation: 'Haz clic en "ABRIR MOTOR" para cargar el Worker nuclear en tu navegador.',
        },
    },
    {
        id: 'SCHEMA_D',
        name: 'SCHEMA DESIGNER',
        tag: 'DATA STRUCTURE',
        poeticTitle: 'Arquitecto de Realidad',
        desc: 'Diseña contratos de datos visualmente. Conecta nodos, define tipos y despliega infraestructuras de datos en segundos.',
        image: null,
        status: 'COMING_SOON',
        accentVar: '--color-cold',
        docs: {
            axioms: ['Estructura es Verdad', 'Interoperabilidad Pura'],
            description: 'Motor de grafos reactivo que valida tus esquemas industriales antes de la ignición. Emite contratos de datos compatibles con cualquier silo.',
            code: 'const schema = Schema.create("IndraSystem")\n  .addField("core", types.CORE_DNA)\n  .build();',
            activation: 'Este módulo requiere el protocolo de Enlace Atmosférico activo.',
        },
    },
    {
        id: 'WORK_W',
        name: 'WORKFLOW DESIGNER',
        tag: 'LOGIC ORCHESTRATION',
        poeticTitle: 'Orquestador de Pulsos',
        desc: 'Automatiza flujos entre silos. Crea puentes lógicos que sincronizan tu realidad entre diferentes plataformas.',
        image: null,
        status: 'COMING_SOON',
        accentVar: '--color-warm',
        docs: {
            axioms: ['Flujo Continuo', 'Desacoplamiento Crítico'],
            description: 'Conecta disparadores con acciones usando el sistema de nodos visual de Indra. Dispara automáticamente procesos entre silos soberanos.',
            code: 'Workflow.on("SYNC_COMPLETE",\n  (atom) => notify.core("IGNITION_STABLE")\n);',
            activation: 'Despliegue bajo demanda con balanceo automático de carga.',
        },
    },
];

const HERO_PILLARS = [
    {
        icon: 'CUBE',
        title: '¿QUÉ ES?',
        body: 'Librería Libre es el portal de acceso a los engines de Indra OS en modo agnóstico. No requiere instalación ni cuenta. Cada módulo es una pieza de infraestructura que corre directamente en tu navegador.',
    },
    {
        icon: 'BOLT',
        title: '¿CÓMO FUNCIONA?',
        body: 'Cada engine se carga bajo demanda usando Lazy Loading y Web Workers. El código de procesamiento no sale de tu dispositivo. Tu máquina es el servidor.',
    },
    {
        icon: 'LINK',
        title: '¿CÓMO SE ACTIVA?',
        body: 'Haz clic en "ABRIR MOTOR" en cualquier card. Si el módulo requiere persistencia (guardar en Drive/Notion), se desplegará el Conector Core como widget. Sin redireccionamientos.',
    },
];

export const ToolsDockTab = ({ onBack }) => {
    const [selectedTool, setSelectedTool] = useState(null);
    const openToolEngine = useAppState(s => s.openToolEngine);
    const cardsRef = useRef(null);

    const scrollToCards = () => {
        cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ─── DETAIL VIEW ─── */
    if (selectedTool) {
        return (
            <div className="tdock-page anim-fade-in">
                <style>{CSS}</style>
                <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '120px 40px 80px' }}>
                    {/* Back header */}
                    <header className="tdock-detail-header">
                        <button className="btn btn--ghost btn--mini" onClick={() => setSelectedTool(null)}>
                            <IndraIcon name="BACK" size="10px" style={{ marginRight: '8px' }} />
                            VOLVER AL PANEL
                        </button>
                        <div className="flex row gap--10 items--center">
                            <div className="tdock-dot" style={{ background: `var(${selectedTool.accentVar})` }} />
                            <span className="tdock-tag-label">{selectedTool.tag}</span>
                        </div>
                    </header>

                    {/* Hero row */}
                    <div className="tdock-detail-hero">
                        <div className="tdock-detail-copy">
                            <h1 className="font-syncopate tdock-detail-title">{selectedTool.name}</h1>
                            <p style={{ color: `var(${selectedTool.accentVar})` }} className="tdock-poetic">{selectedTool.poeticTitle}</p>
                            <p className="tdock-detail-body">{selectedTool.docs.description}</p>
                            <div className="flex row gap--16">
                                <button
                                    className="btn btn--primary"
                                    onClick={() => { setSelectedTool(null); openToolEngine(selectedTool.id); }}
                                    disabled={selectedTool.status !== 'READY_FREE'}
                                >
                                    {selectedTool.status === 'READY_FREE' ? 'DESPLEGAR MOTOR' : 'EN DESARROLLO'}
                                </button>
                                <button className="btn btn--ghost" style={{ border: '1px solid var(--color-border-strong)' }}>
                                    AXIOMAS TÉCNICOS
                                </button>
                            </div>
                        </div>
                        <div className="tdock-detail-img-wrap">
                            <img src={selectedTool.image} alt={selectedTool.name} />
                            {selectedTool.status === 'COMING_SOON' && (
                                <div className="tdock-coming-overlay">
                                    <span className="font-syncopate" style={{ fontSize: '11px', letterSpacing: '0.3em' }}>PRÓXIMAMENTE</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Docs grid */}
                    <div className="tdock-docs-grid">
                        <section>
                            <h3 className="tdock-section-label">01_PRINCIPIOS</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedTool.docs.axioms.map((ax, i) => (
                                    <div key={i} className="tdock-axiom-row">
                                        <IndraIcon name="CUBE" size="12px" />
                                        <span>{ax}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h3 className="tdock-section-label">02_IMPLEMENTACIÓN</h3>
                            <div className="tdock-code-block">
                                <pre style={{ margin: 0, color: `var(${selectedTool.accentVar})` }}>{selectedTool.docs.code}</pre>
                            </div>
                            <p className="tdock-activation-note">{selectedTool.docs.activation}</p>
                        </section>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── MAIN VIEW ─── */
    return (
        <div className="tdock-page anim-fade-in">
            <style>{CSS}</style>

            {/* ── SECTION 1: HERO ── */}
            <section className="tdock-hero">
                {/* Back button */}
                <button className="tdock-back-btn btn btn--ghost btn--mini" onClick={onBack}>
                    <IndraIcon name="BACK" size="10px" style={{ marginRight: '8px' }} />
                    INDRA OS
                </button>

                <div className="tdock-hero-content">
                    <div className="tdock-hero-eyebrow">
                        <div className="tdock-pulse-dot" />
                        <span>LIBRERÍA LIBRE // MODO LIBRE</span>
                    </div>
                    <h1 className="font-syncopate tdock-hero-title">INDRA<br />MÓDULOS</h1>
                    <p className="tdock-hero-subtitle">
                        Suite de herramientas de grado industrial desacopladas del core. 
                        Soberanía computacional sin registros: el código corre en tu&nbsp;máquina.
                    </p>
                </div>

                {/* Pilars explanation */}
                <div className="tdock-pillars">
                    {HERO_PILLARS.map((p, i) => (
                        <div key={i} className="tdock-pillar">
                            <div className="tdock-pillar-icon">
                                <IndraIcon name={p.icon} size="16px" />
                            </div>
                            <h4 className="tdock-pillar-title">{p.title}</h4>
                            <p className="tdock-pillar-body">{p.body}</p>
                        </div>
                    ))}
                </div>

                {/* Scroll CTA */}
                <div className="tdock-scroll-cta" onClick={scrollToCards}>
                    <span>VER MÓDULOS</span>
                    <div className="tdock-scroll-arrow">↓</div>
                </div>

                {/* BG grid decoration */}
                <div className="tdock-hero-bg-grid" />
            </section>

            {/* ── SECTION 2: CARDS ── */}
            <section ref={cardsRef} className="tdock-cards-section">
                <div className="tdock-cards-header">
                    <h2 className="font-syncopate tdock-cards-title">MOTORES DISPONIBLES</h2>
                    <div className="tdock-active-badge">
                        <div className="tdock-pulse-dot" />
                        <span>MÓDULOS ACTIVOS: 1</span>
                    </div>
                </div>

                <div className="tdock-grid">
                    {AVAILABLE_TOOLS.map(tool => (
                        <div key={tool.id} className="tdock-card">
                            {/* Image */}
                            <div className="tdock-card-img">
                                {tool.image ? (
                                    <img src={tool.image} alt={tool.name} />
                                ) : (
                                    <div className="fill center font-syncopate" style={{ fontSize: '14px', letterSpacing: '0.2em', color: `var(${tool.accentVar})`, opacity: 0.3, background: 'var(--color-bg-deep)' }}>
                                        EN PROGRESO...
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="tdock-card-body">
                                <div className="tdock-card-meta">
                                    <span className="tdock-tag-label">{tool.tag}</span>
                                    <div className={`tdock-status-badge ${tool.status === 'READY_FREE' ? 'tdock-status--active' : 'tdock-status--dev'}`}>
                                        {tool.status === 'READY_FREE' ? 'ESTABLE' : 'ALPHA'}
                                    </div>
                                </div>
                                <h3 className="font-outfit tdock-card-title">{tool.name}</h3>
                                <p className="tdock-card-desc">{tool.desc}</p>
                            </div>

                            {/* Actions */}
                            <footer className="tdock-card-footer">
                                <button
                                    className="btn btn--primary btn--mini fill tdock-deploy-btn"
                                    style={tool.status === 'READY_FREE'
                                        ? { background: `var(${tool.accentVar})`, color: 'var(--color-text-inverse)', border: 'none' }
                                        : { background: 'var(--color-bg-elevated)', color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }
                                    }
                                    onClick={() => openToolEngine(tool.id)}
                                    disabled={tool.status !== 'READY_FREE'}
                                >
                                    {tool.status === 'READY_FREE' ? 'ABRIR MOTOR' : 'EN DESARROLLO'}
                                </button>
                                <button
                                    className="btn btn--ghost btn--mini tdock-info-btn"
                                    onClick={() => setSelectedTool(tool)}
                                    title="Más información"
                                >
                                    <IndraIcon name="ABOUT" size="14px" />
                                </button>
                            </footer>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <footer className="tdock-footer">
                    <div className="tdock-footer-col">
                        <h5 className="font-syncopate tdock-footer-title">PROTOCOLO DE SOBERANÍA</h5>
                        <p className="tdock-footer-body">Ninguna materia enviada a través de estos módulos es procesada por el servidor excepto cuando el usuario vincula explícitamente un silo externo (Drive / Notion).</p>
                    </div>
                    <div className="tdock-footer-col">
                        <h5 className="font-syncopate tdock-footer-title">ESTADO DEL NÚCLEO</h5>
                        <p className="tdock-footer-body">El motor MIE opera bajo estándar H.264/H.265 para compresión máxima sin pérdida de metadatos estructurales. 100% browser-native.</p>
                    </div>
                </footer>
            </section>
        </div>
    );
};

/* =============================================
   CSS: 100% tokenizado. Cero hardcodes de color
   ============================================= */
const CSS = `
@keyframes tdock-pulse {
    0%   { transform: scale(1);   opacity: 1; }
    50%  { transform: scale(1.6); opacity: 0.4; }
    100% { transform: scale(1);   opacity: 1; }
}
@keyframes anim-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── WRAPPER ── */
.tdock-page {
    position: fixed; inset: 0;
    background: var(--color-bg-void);
    color: var(--color-text-primary);
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    z-index: 3000;
    font-family: var(--font-sans);
    animation: anim-fade-in 0.4s ease;
}

/* ── HERO SECTION ── */
.tdock-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 120px 7vw 80px;
    overflow: hidden;
    border-bottom: 1px solid var(--color-border);
}
.tdock-hero-bg-grid {
    position: absolute; inset: 0; pointer-events: none;
    background:
        linear-gradient(var(--color-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.4;
    mask-image: radial-gradient(ellipse 70% 60% at 80% 40%, transparent 20%, black 100%);
}
.tdock-back-btn {
    position: absolute; top: 32px; left: 7vw;
    font-size: 10px; letter-spacing: 0.1em;
}
.tdock-hero-content {
    max-width: 740px;
    margin-bottom: 80px;
}
.tdock-hero-eyebrow {
    display: flex; align-items: center; gap: 12px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.35em;
    color: var(--color-text-secondary);
    margin-bottom: 32px;
    text-transform: uppercase;
}
.tdock-hero-title {
    font-size: clamp(52px, 8vw, 96px);
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 0.9;
    margin-bottom: 32px;
    color: var(--color-text-primary);
}
.tdock-hero-subtitle {
    font-size: 20px;
    line-height: 1.7;
    color: var(--color-text-secondary);
    max-width: 600px;
}

/* ── PILLARS ── */
.tdock-pillars {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 60px;
}
@media (max-width: 768px) {
    .tdock-pillars { grid-template-columns: 1fr; }
}
.tdock-pillar {
    background: var(--glass-light);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 28px;
    backdrop-filter: blur(16px);
}
.tdock-pillar-icon {
    width: 40px; height: 40px;
    border-radius: var(--radius-md);
    background: var(--color-accent-dim);
    border: 1px solid var(--color-border-active);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    color: var(--color-accent);
}
.tdock-pillar-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: var(--color-text-primary);
    margin-bottom: 12px;
}
.tdock-pillar-body {
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-secondary);
}

/* ── SCROLL CTA ── */
.tdock-scroll-cta {
    display: flex; align-items: center; gap: 16px;
    color: var(--color-text-tertiary);
    font-size: 10px; letter-spacing: 0.2em;
    cursor: pointer;
    transition: color var(--transition-base);
    user-select: none;
}
.tdock-scroll-cta:hover { color: var(--color-text-primary); }
.tdock-scroll-arrow {
    width: 32px; height: 32px;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    transition: transform var(--transition-base), border-color var(--transition-base);
}
.tdock-scroll-cta:hover .tdock-scroll-arrow {
    transform: translateY(4px);
    border-color: var(--color-accent);
}

/* ── CARDS SECTION ── */
.tdock-cards-section {
    padding: 100px 7vw;
    max-width: 1280px;
    margin: 0 auto;
}
.tdock-cards-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 60px;
    flex-wrap: wrap;
    gap: 16px;
}
.tdock-cards-title {
    font-size: clamp(22px, 3vw, 32px);
    font-weight: 900;
    color: var(--color-text-primary);
}
.tdock-active-badge {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 8px 20px;
    background: var(--color-accent-dim);
    border: 1px solid var(--color-border-active);
    border-radius: var(--radius-pill);
    font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
    color: var(--color-text-accent);
}
.tdock-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 28px;
}

/* ── CARD ── */
.tdock-card {
    background: var(--indra-panel-bg);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    overflow: hidden;
    display: flex; flex-direction: column;
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1),
                border-color 0.5s ease,
                box-shadow 0.5s ease;
    box-shadow: var(--shadow-float);
}
.tdock-card:hover {
    transform: translateY(-10px);
    border-color: var(--color-border-active);
    box-shadow: 0 32px 64px rgba(0,0,0,0.4), var(--shadow-glow);
}
.tdock-card-img {
    width: 100%; aspect-ratio: 16 / 9;
    overflow: hidden;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
}
.tdock-card-img img {
    width: 100%; height: 100%; object-fit: cover;
    opacity: 0.85; transition: opacity 0.6s ease;
}
.tdock-card:hover .tdock-card-img img { opacity: 1; }
.tdock-card-body { padding: 24px 24px 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.tdock-card-meta { display: flex; align-items: center; justify-content: space-between; }
.tdock-tag-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    color: var(--color-text-tertiary);
}
.tdock-status-badge {
    font-size: 9px; font-weight: 800; letter-spacing: 0.08em;
    padding: 3px 10px; border-radius: var(--radius-pill); border: 1px solid;
}
.tdock-status--active { color: var(--color-accent); border-color: var(--color-accent); }
.tdock-status--dev   { color: var(--color-text-dim); border-color: var(--color-border); }

.tdock-card-title { font-size: 20px; font-weight: 900; color: var(--color-text-primary); }
.tdock-card-desc {
    font-size: 13px; line-height: 1.6;
    color: var(--color-text-secondary);
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
}
.tdock-card-footer {
    padding: 16px 24px 24px;
    display: flex; gap: 10px; align-items: center;
}
.tdock-deploy-btn {
    flex: 1; height: 44px;
    border-radius: var(--radius-md);
    font-size: 12px; font-weight: 800;
    transition: opacity var(--transition-fast);
}
.tdock-deploy-btn:disabled { cursor: not-allowed; opacity: 0.6; }
.tdock-info-btn {
    width: 44px; height: 44px; padding: 0;
    border: 1px solid var(--color-border) !important;
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-text-secondary);
    transition: border-color var(--transition-base), color var(--transition-base);
}
.tdock-info-btn:hover { border-color: var(--color-border-active) !important; color: var(--color-text-primary); }

/* ── FOOTER ── */
.tdock-footer {
    margin-top: 80px;
    border-top: 1px solid var(--color-border);
    padding-top: 40px;
    display: flex; gap: 40px; flex-wrap: wrap;
}
.tdock-footer-col { flex: 1; min-width: 260px; }
.tdock-footer-title {
    font-size: 10px; letter-spacing: 0.15em;
    color: var(--color-text-tertiary);
    margin-bottom: 12px;
}
.tdock-footer-body {
    font-size: 12px; line-height: 1.8;
    color: var(--color-text-dim);
}

/* ── DETAIL VIEW ── */
.tdock-detail-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 80px;
}
.tdock-detail-hero {
    display: flex; gap: 60px; align-items: flex-start;
    margin-bottom: 100px; flex-wrap: wrap;
}
.tdock-detail-copy { flex: 1.2; min-width: 280px; }
.tdock-detail-title { font-size: 42px; font-weight: 900; margin-bottom: 12px; color: var(--color-text-primary); }
.tdock-poetic { font-size: 16px; font-weight: 300; letter-spacing: 0.2em; margin-bottom: 28px; }
.tdock-detail-body { font-size: 16px; line-height: 1.8; color: var(--color-text-secondary); margin-bottom: 36px; }
.tdock-detail-img-wrap {
    flex: 1; min-width: 240px;
    border-radius: 20px; overflow: hidden;
    border: 1px solid var(--color-border);
    background: var(--color-bg-surface);
    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    aspect-ratio: 16 / 10; position: relative;
}
.tdock-detail-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.tdock-coming-overlay {
    position: absolute; inset: 0;
    background: var(--indra-panel-glass);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-text-primary);
}
.tdock-docs-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 60px;
}
@media (max-width: 768px) { .tdock-docs-grid { grid-template-columns: 1fr; } }
.tdock-section-label {
    font-size: 11px; letter-spacing: 0.2em;
    color: var(--color-text-tertiary);
    margin-bottom: 24px; font-weight: 600;
}
.tdock-axiom-row {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    background: var(--glass-light);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 14px; font-weight: 600;
}
.tdock-code-block {
    background: var(--indra-terminal-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 24px;
    font-family: var(--font-mono);
    font-size: 13px;
    overflow-x: auto;
}
.tdock-activation-note {
    margin-top: 16px; font-size: 13px;
    color: var(--color-text-dim);
}

/* ── SHARED ATOMS ── */
.tdock-dot { width: 8px; height: 8px; border-radius: 50%; }
.tdock-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--color-accent);
    animation: tdock-pulse 2s infinite;
}
`;
