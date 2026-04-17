import { IndraIcon } from '../../utilities/IndraIcons';

export const UIDashboardMockup = () => (
    <div className="indra-card mockup-container" style={{ 
        padding: '0', 
        overflow: 'hidden', 
        border: '1px solid rgba(0,0,0,0.05)', 
        boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
        background: '#f8f9fa',
        color: '#333'
    }}>
        <style>{`
            .mockup-container { font-family: 'Outfit', sans-serif; letter-spacing: 0.1em; }
            .mockup-header { 
                padding: 12px 24px; 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                border-bottom: 1px solid rgba(0,0,0,0.05);
                font-size: 8px;
                font-weight: 300;
                color: rgba(0,0,0,0.4);
            }
            .mockup-column-title {
                font-size: 8px;
                font-weight: 600;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #555;
            }
            .mockup-item {
                background: white;
                border: 1px solid rgba(0,0,0,0.08);
                border-radius: 4px;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                transition: all 0.3s ease;
            }
            .mockup-item:hover { transform: translateX(2px); border-color: var(--color-accent); }
            
            .mockup-icon-box {
                width: 16px; height: 16px;
                background: #fdf2f2;
                border: 1px solid #fee2e2;
                border-radius: 2px;
                display: flex; align-items: center; justify-content: center;
                color: #ef4444;
                font-size: 7px; font-weight: 600;
            }
            .mockup-engine-card {
                background: #ebf0f5;
                border: 1px solid #d1d9e6;
                border-radius: 8px;
                padding: 40px;
                position: relative;
            }
            .mockup-btn-focus {
                background: white;
                border: 1px solid rgba(0,0,0,0.1);
                padding: 8px 16px;
                font-size: 7px;
                font-weight: 600;
                border-radius: 4px;
                position: absolute;
                bottom: 20px; right: 20px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
        `}</style>

        <div className="mockup-header">
            <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ letterSpacing: '0.4em' }}>INDRA_DASHBOARD_ENGINE // WORKSPACE_ALPHA</div>
        </div>

        <div style={{ minHeight: '600px', display: 'flex', padding: '32px' }}>
            <div style={{ width: '250px', paddingRight: '20px' }}>
                <div className="mockup-column-title">
                    <span style={{color: 'var(--color-accent)'}}>•</span> I. OBJETOS // ESTRUCTURA
                </div>
                <div className="mockup-item">
                    <div className="mockup-icon-box">E</div>
                    <span style={{fontSize: '9px', fontWeight: 300}}>ESQUEMA BASE DE DATOS</span>
                    <span style={{marginLeft: 'auto', opacity: 0.3}}>›</span>
                </div>
                <div className="mockup-item">
                    <div className="mockup-icon-box" style={{background: '#f0f9ff', borderColor: '#e0f2fe', color: '#0ea5e9'}}>S</div>
                    <span style={{fontSize: '9px', fontWeight: 300}}>TABLA SHEET / CSV</span>
                    <span style={{marginLeft: 'auto', opacity: 0.3}}>›</span>
                </div>
                <div className="mockup-item">
                    <div className="mockup-icon-box" style={{background: '#f5f3ff', borderColor: '#ede9fe', color: '#8b5cf6'}}>Q</div>
                    <span style={{fontSize: '9px', fontWeight: 300}}>DATABASE SQL / NO-SQL</span>
                    <span style={{marginLeft: 'auto', opacity: 0.3}}>›</span>
                </div>
            </div>

            <div style={{ flex: 1, padding: '0 32px' }}>
                <div className="mockup-column-title">
                    <span style={{color: 'var(--color-accent)'}}>•</span> II. PUENTES Y FLUJOS // LÓGICA
                </div>
                <div className="mockup-engine-card">
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IndraIcon name="CORE" size="14px" />
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>PUENTE LÓGICO</div>
                            <div style={{ fontSize: '7px', opacity: 0.4, letterSpacing: '0.1em' }}>ID_ADAPTADOR: 1uBSPXPf</div>
                        </div>
                    </div>
                    
                    <div style={{ height: '180px', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                         <div style={{ fontSize: '9px', fontWeight: 300, opacity: 0.6, letterSpacing: '0.1em' }}>WORKFLOW AUTOMATION</div>
                         <div style={{ fontSize: '7px', opacity: 0.3, letterSpacing: '0.4em', textAlign: 'center' }}>{" // AUTOMATIZACIÓN DE PROCESO "} <br/> LISTO_PARA_EJECUCIÓN</div>
                    </div>
                </div>
            </div>

            <div style={{ width: '300px', paddingLeft: '20px' }}>
                <div className="mockup-column-title">
                    <span style={{color: 'var(--color-accent)'}}>•</span> III. RESULTADOS // DOCUMENTOS
                </div>
                <div className="mockup-item" style={{ height: '80px', alignItems: 'flex-start' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                        <IndraIcon name="CORE" size="10px" />
                    </div>
                    <div className="stack--tight">
                        <div style={{ fontSize: '9px', fontWeight: 600 }}>VIDEO EDITOR / RENDERING</div>
                        <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 300 }}>PRODUCCIÓN DE CONTENIDO A/V</div>
                    </div>
                </div>
                <div className="mockup-item" style={{ height: '80px', alignItems: 'flex-start' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                        <IndraIcon name="SCHEMA" size="10px" />
                    </div>
                    <div className="stack--tight">
                        <div style={{ fontSize: '9px', fontWeight: 600 }}>CANVAS 2D / DIAGRAMS</div>
                        <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 300 }}>REPRESENTACIÓN DE SISTEMAS</div>
                    </div>
                </div>
                <div className="mockup-item" style={{ height: '80px', alignItems: 'flex-start' }}>
                   <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                        <IndraIcon name="BACK" size="10px" />
                    </div>
                    <div className="stack--tight">
                        <div style={{ fontSize: '9px', fontWeight: 600 }}>DOCUMENT_O / LOGROS</div>
                        <div style={{ fontSize: '7px', opacity: 0.4, fontWeight: 300 }}>ARTEFACTOS DE SALIDA FINAL</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
