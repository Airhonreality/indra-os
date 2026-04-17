/**
 * =============================================================================
 * ARTEFACTO: AEEConfigPanel.jsx
 * RESPONSABILIDAD: Configuración del Ejecutor Operativo (AEE).
 *
 * DHARMA:
 *   - Modo CONFIG: selección de Schema fuente + Bridge ejecutor.
 *   - Modo READY: preview del formulario configurado + generación de link público.
 *   - Un AEE configurado genera un link micelar único que proyecta el formulario
 *     puro sin ningún panel de configuración ni workspace visible.
 *
 * AXIOMA DE DOS MODOS:
 *   [WORKSPACE]  → Editor con configuración visible (este panel).
 *   [LINK PÚBLICO] → Solo el formulario, sin UI de workspace.
 * =============================================================================
 */

import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';
import { toastEmitter } from '../../../services/toastEmitter';
import { SchemaMicroExplorer } from '../../utilities/SchemaMicroExplorer';
import { AEEGraphicPanel } from './AEEGraphicPanel';

/**
 * Selector de átomo por clase — proyecta los pins del workspace activo
 * filtrando por la clase indicada.
 */
function AtomSelector({ label, atomClass, value, onSelect }) {
    const pins = useAppState(s => s.pins);
    const filtered = pins.filter(p => p.class === atomClass);

    return (
        <div className="stack--tight">
            <label style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
            </label>
            <select
                value={value || ''}
                onChange={e => onSelect(e.target.value || null)}
                style={{
                    width: '100%',
                    background: 'var(--color-bg-deep)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    padding: 'var(--space-2) var(--space-3)',
                    cursor: 'pointer'
                }}
            >
                <option value="">-- SELECCIONAR --</option>
                {filtered.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.handle?.label || p.id}
                    </option>
                ))}
            </select>
            {filtered.length === 0 && (
                <span style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                    No hay {atomClass} en este Workspace.
                </span>
            )}
        </div>
    );
}

function AccordionSection({ title, id, current, onToggle, children, icon }) {
    const isOpen = current === id;
    return (
        <div className="indra-accordion">
            <button 
                className={`indra-accordion__header ${isOpen ? 'active' : ''}`}
                onClick={() => onToggle(isOpen ? null : id)}
            >
                <div className="shelf--tight">
                    {icon && <IndraIcon name={icon} size="12px" color={isOpen ? 'var(--indra-dynamic-accent)' : 'inherit'} />}
                    <span className="indra-accordion__title">{title}</span>
                </div>
                <IndraIcon 
                    name="CHEVRON_RIGHT" 
                    size="8px" 
                    style={{ 
                        transform: isOpen ? 'rotate(90deg)' : 'none', 
                        opacity: 0.5, 
                        transition: 'transform 0.3s ease' 
                    }} 
                />
            </button>
            {isOpen && (
                <div className="indra-accordion__content stack--loose">
                    {children}
                </div>
            )}
        </div>
    );
}

export function AEEConfigPanel({ atom, onConfigChange, publicUrl }) {
    const pins = useAppState(s => s.pins);
    const [activeSection, setActiveSection] = React.useState('DATA');

    // Auto-expandir PUBLICACIÓN si hay link
    React.useEffect(() => {
        if (publicUrl) setActiveSection('PUBLISH');
    }, [publicUrl]);
    
    const schemaId = atom?.payload?.schema_id || null;
    const executorId = atom?.payload?.executor_id || atom?.payload?.bridge_id || null;
    const executorType = atom?.payload?.executor_type || 'BRIDGE';
    const localButtonLabel = atom?.payload?.button_label || 'ENVIAR';

    // Todos los schemas del workspace
    const workspaceSchemas = pins.filter(p => p.class === 'DATA_SCHEMA');

    const handleChange = (key, value) => {
        onConfigChange?.(prev => ({ ...prev, [key]: value }));
    };

    // Agregar un campo al lienzo
    const handleInsertField = (field, schemaInfo) => {
        // AXIOMA: Solo actualizamos el schema_id si es el primero, para no romper la composición
        if (!schemaId) handleChange('schema_id', schemaInfo.id); 
        
        window.dispatchEvent(new CustomEvent('AEE_INSERT_FIELD', { detail: { field, schema: schemaInfo } }));
        toastEmitter.info(`Añadido al Lienzo: ${field.label || field.alias}`);
    };

    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            toastEmitter.emit('INFO', `Subiendo ${file.name}...`);
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result;
                    const response = await executeDirective('system', 'RESOURCE_INGEST', undefined, {
                        base64: base64Data,
                        mimeType: file.type,
                        fileName: file.name
                    });

                    if (response.metadata?.status === 'OK' && response.metadata?.grid) {
                        window.dispatchEvent(new CustomEvent('AEE_INSERT_STATIC', { 
                            detail: { type: 'STATIC_IMAGE', label: response.metadata.grid } 
                        }));
                        toastEmitter.emit('SUCCESS', 'Asset cristalizado en Local Vault.');
                    } else {
                        toastEmitter.emit('ERROR', response.metadata?.error || 'Falló la ingestión del recurso.');
                    }
                } catch(err) {
                    toastEmitter.emit('ERROR', 'Error al invocar API de ingestión.');
                } finally {
                    setIsUploading(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            setIsUploading(false);
            toastEmitter.emit('ERROR', 'Error al procesar el archivo.');
        }
    };

    return (
        <div className="inspector-content stack fill" style={{ overflowY: 'hidden', borderRight: '1px solid var(--color-border)', minWidth: '320px', maxWidth: '380px', width: '30%' }}>
            
            <div className="inspector-master-header spread" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--indra-dynamic-accent)' }} />
                    <div className="stack--2xs">
                        <span className="font-mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>GESTOR_DE_PROYECCIÓN</span>
                        <span className="text-hint" style={{ fontSize: '8px', opacity: 0.5, letterSpacing: '0.05em' }}>AEE // ARQUITECTURA</span>
                    </div>
                </div>
            </div>

            <div className="fill" style={{ overflowY: 'auto' }}>
                
                {/* ── SECCIÓN 01: DISEÑO_Y_ESTÉTICA ── */}
                <AccordionSection 
                    id="DESIGN" 
                    title="01 // DISEÑO_Y_ESTÉTICA" 
                    icon="IMAGE"
                    current={activeSection} 
                    onToggle={setActiveSection}
                >
                    <div className="stack--tight">
                        <label className="util-label" style={{ marginBottom: '4px', opacity: 0.6 }}>BLOQUES_ESTÁTICOS</label>
                        <div className="shelf--tight" style={{ gap: '4px' }}>
                            <button 
                                className="btn--mini btn--ghost" 
                                style={{ flex: 1, padding: '8px', fontSize: '9px' }}
                                onClick={() => window.dispatchEvent(new CustomEvent('AEE_INSERT_STATIC', { detail: { type: 'STATIC_TEXT' } }))}
                            >
                                <IndraIcon name="ALIGN_LEFT" size="10px" />
                                <span style={{ marginLeft: '6px' }}>TEXTO</span>
                            </button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
                            <button 
                                className="btn--mini btn--ghost" 
                                style={{ flex: 1, padding: '8px', fontSize: '9px' }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <IndraIcon name={isUploading ? "SYNC" : "IMAGE"} size="10px" className={isUploading ? "spin" : ""} />
                                <span style={{ marginLeft: '6px' }}>{isUploading ? 'INGIRIENDO...' : 'IMAGEN'}</span>
                            </button>
                        </div>
                    </div>
                    <div className="stack--tight" style={{ marginTop: 'var(--space-4)' }}>
                        <AEEGraphicPanel 
                            config={atom?.payload} 
                            onChange={(updatedConfig) => handleChange('graphics', updatedConfig.graphics)} 
                        />
                    </div>
                </AccordionSection>

                <AccordionSection 
                    id="DATA" 
                    title="02 // ESTRUCTURA_Y_DATOS" 
                    icon="SCHEMA"
                    current={activeSection} 
                    onToggle={setActiveSection}
                >
                    <div className="stack--tight">
                        <label className="util-label" style={{ marginBottom: '8px', opacity: 0.6 }}>FUENTES_DE_DATOS</label>
                        {workspaceSchemas.length === 0 && (
                            <div className="glass-light center" style={{ opacity: 0.4, fontSize: '9px', padding: '16px', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                                NO HAY SCHEMAS EN ESTE WORKSPACE
                            </div>
                        )}
                        {workspaceSchemas.map(schemaAsset => (
                            <div key={schemaAsset.id} className="glass-chassis stack--none" style={{ background: 'var(--color-bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '8px' }}>
                                <div className="shelf--between" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                                    <div className="shelf--tight">
                                        <IndraIcon name="SCHEMA" size="10px" style={{ opacity: 0.5 }} />
                                        <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>{schemaAsset.handle?.label?.toUpperCase()}</span>
                                    </div>
                                    <button 
                                        className="btn btn--xs btn--ghost" 
                                        onClick={() => handleInsertField({ 
                                            type: 'FRAME', alias: 'all', 
                                            label: schemaAsset.handle?.label, 
                                            children: schemaAsset.payload?.fields || [] 
                                        }, schemaAsset)}
                                        style={{ padding: '2px 8px', color: 'var(--color-accent)' }}
                                    >
                                        <IndraIcon name="PLUS" size="10px" />
                                        <span style={{ fontSize: '8px', marginLeft: '4px' }}>TODO</span>
                                    </button>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                    <SchemaMicroExplorer 
                                        schema={schemaAsset}
                                        onInsertField={(f) => handleInsertField(f, schemaAsset)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="stack--tight" style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                        <label className="util-label" style={{ marginBottom: '8px', opacity: 0.6 }}>EJECUCIÓN_Y_TRIGGER</label>
                        <div className="shelf--tight" style={{ gap: '4px', marginBottom: '8px' }}>
                            {['BRIDGE', 'WORKFLOW'].map(opt => (
                                <button
                                    key={opt}
                                    className={`btn--mini ${executorType === opt ? (opt === 'BRIDGE' ? 'btn--accent' : 'btn--success') : 'btn--ghost'}`}
                                    onClick={() => { handleChange('executor_type', opt); handleChange('executor_id', null); }}
                                    style={{ flex: 1, fontSize: '8px', padding: '6px' }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <AtomSelector
                            label="EJECUTOR_VINCULADO"
                            atomClass={executorType}
                            value={executorId}
                            onSelect={(val) => handleChange('executor_id', val)}
                        />
                        <div className="stack--2xs" style={{ marginTop: 'var(--space-4)' }}>
                            <label className="font-mono opacity-50" style={{ fontSize: '8px' }}>TEXTO_DEL_BOTÓN_CANÓNICO</label>
                            <input 
                                className="input-base font-mono"
                                style={{ fontSize: '10px', padding: '8px' }}
                                value={localButtonLabel}
                                onChange={(e) => handleChange('button_label', e.target.value)}
                            />
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection 
                    id="PUBLISH" 
                    title="03 // ENLACE_Y_PUBLICACIÓN" 
                    icon="LINK"
                    current={activeSection} 
                    onToggle={setActiveSection}
                >
                    {publicUrl ? (
                        <div className="glass-accent pulse-slow stack--tight" style={{ padding: '12px', borderRadius: 'var(--radius-md)' }}>
                            <span className="util-label" style={{ opacity: 0.8 }}>ENLACE_DE_PROYECCIÓN_ACTIVO</span>
                            <div className="terminal-inset shelf--tight" style={{ padding: '8px', overflow: 'hidden', marginTop: '4px' }}>
                                <span className="font-mono truncate fill" style={{ fontSize: '10px', color: 'var(--indra-dynamic-accent)' }}>{publicUrl}</span>
                            </div>
                            <div className="shelf--tight" style={{ marginTop: '8px', gap: '4px' }}>
                                <button className="btn--mini btn--accent fill" onClick={() => { navigator.clipboard.writeText(publicUrl); toastEmitter.success('Copiado'); }}>
                                    COPIAR_URL
                                </button>
                                <a href={publicUrl} target="_blank" rel="noreferrer" className="btn--mini btn--ghost center" style={{ width: '32px' }}>
                                    <IndraIcon name="EXTERNAL" size="10px" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="center stack--tight" style={{ padding: '24px', opacity: 0.4 }}>
                            <IndraIcon name="WARN" size="20px" />
                            <span className="font-mono" style={{ fontSize: '9px' }}>SIN_ENLACE_EMITIDO</span>
                            <p className="center" style={{ fontSize: '8px' }}>Utiliza el botón superior de "PUBLICAR" para generar una proyección.</p>
                        </div>
                    )}
                </AccordionSection>
            </div>
        </div>
    );
}
