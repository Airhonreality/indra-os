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

import React from 'react';
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

export function AEEConfigPanel({ atom, onConfigChange }) {
    const pins = useAppState(s => s.pins);
    
    const schemaId = atom?.payload?.schema_id || null;
    const executorId = atom?.payload?.executor_id || atom?.payload?.bridge_id || null;
    const executorType = atom?.payload?.executor_type || 'BRIDGE';
    const localButtonLabel = atom?.payload?.button_label || 'ENVIAR';

    const selectedSchema = pins.find(p => p.id === schemaId);
    const selectedExecutor = pins.find(p => p.id === executorId);
    
    // Todos los schemas del workspace
    const workspaceSchemas = pins.filter(p => p.class === 'DATA_SCHEMA');

    const handleChange = (key, value) => {

        onConfigChange?.(prev => ({ ...prev, [key]: value }));
    };

    // Agregar un campo al lienzo
    const handleInsertField = (field, schemaInfo) => {
        handleChange('schema_id', schemaInfo.id); 
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
        <div className="inspector-content stack fill" style={{ overflowY: 'auto', padding: 'var(--space-4)', borderRight: '1px solid var(--color-border)', minWidth: '320px', maxWidth: '380px', width: '30%' }}>
            
            <div className="inspector-master-header spread" style={{ marginBottom: 'var(--space-6)', padding: '0 4px' }}>
                <div className="shelf--tight">
                    <IndraIcon name="PLAY" size="14px" style={{ color: 'var(--indra-dynamic-accent)' }} />
                    <div className="stack--tight">
                        <span className="font-mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>CONFIGURACIÓN_AEE</span>
                        <span className="text-hint" style={{ fontSize: '8px', opacity: 0.5, letterSpacing: '0.05em' }}>PROPIEDADES // ENTORNO</span>
                    </div>
                </div>
            </div>

            <div className="stack" style={{ gap: 'var(--space-6)', paddingBottom: '40px' }}>
                
                {/* ── 00 // ELEMENTOS ESTÁTICOS ── */}
                <section className="inspector-module stack--tight">
                    <header className="module-header" style={{ marginBottom: 'var(--space-3)' }} title="Añade bloques no interactivos (Textos, Imágenes).">
                        <div className="indra-field-label">00 // ELEMENTOS_VISUALES</div>
                    </header>
                    <div className="module-content glass-light stack--tight" style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="shelf--tight" style={{ gap: '4px' }}>
                            <button 
                                className="btn--mini btn--ghost" 
                                style={{ flex: 1, padding: '6px', fontSize: '8px' }}
                                onClick={() => window.dispatchEvent(new CustomEvent('AEE_INSERT_STATIC', { detail: { type: 'STATIC_TEXT' } }))}
                            >
                                <IndraIcon name="ALIGN_LEFT" size="10px" />
                                <span style={{ marginLeft: '4px' }}>TEXTO</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                accept="image/*" 
                                onChange={handleFileUpload}
                            />
                            <button 
                                className="btn--mini btn--ghost" 
                                style={{ flex: 1, padding: '6px', fontSize: '8px', backgroundColor: isUploading ? 'var(--color-bg-void)' : undefined }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <IndraIcon name={isUploading ? "SYNC" : "IMAGE"} size="10px" className={isUploading ? "spin" : ""} />
                                <span style={{ marginLeft: '4px' }}>{isUploading ? 'INGIRIENDO...' : 'IMAGEN'}</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── 01 // VISOR UNIVERSAL DE SCHEMAS ── */}
                <section className="inspector-module stack--tight">
                    <header className="module-header" style={{ marginBottom: 'var(--space-3)' }} title="Busca y explora los Schemas disponibles. Presiona [+] para dibujarlos en el lienzo.">
                        <div className="indra-field-label">01 // TABLAS_DE_DATOS</div>
                    </header>
                    <div className="module-content stack--tight" style={{ gap: 'var(--space-2)' }}>
                        {workspaceSchemas.length === 0 && (
                            <div className="glass-light center" style={{ opacity: 0.4, fontSize: '9px', padding: '16px', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                                NO HAY SCHEMAS EN ESTE WORKSPACE
                            </div>
                        )}
                        {workspaceSchemas.map(schemaAsset => (
                            <div key={schemaAsset.id} className="glass stack--tight" style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                <div className="shelf--tight" style={{ paddingBottom: '4px', borderBottom: '1px solid var(--color-border)', opacity: schemaId === schemaAsset.id ? 1 : 0.6 }}>
                                    <IndraIcon name="SCHEMA" size="10px" />
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{schemaAsset.handle?.label?.toUpperCase() || schemaAsset.id}</span>
                                    <div className="fill" />
                                    {/* Botón para insertar el schema COMPLETO al lienzo */}
                                    <button 
                                        className="btn btn--xs btn--ghost" 
                                        onClick={() => handleInsertField({ 
                                            type: 'FRAME', 
                                            alias: schemaAsset.handle?.alias || 'data', 
                                            label: schemaAsset.handle?.label || 'GRUPO',
                                            children: schemaAsset.payload?.fields || [] 
                                        }, schemaAsset)}
                                        title="Dibujar TODO el Schema en el Lienzo"
                                    >
                                        <IndraIcon name="PLUS" size="10px" color="var(--color-accent)" />
                                    </button>
                                </div>
                                <SchemaMicroExplorer 
                                    schema={schemaAsset}
                                    onInsertField={(field) => handleInsertField(field, schemaAsset)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 02 // ESTÉTICA GLOBAL ── */}
                <section className="inspector-module stack--tight">
                    <header className="module-header" style={{ marginBottom: 'var(--space-3)' }} title="Propiedades gráficas mutantes de este micro-apliación.">
                        <div className="indra-field-label">02 // ESTÉTICA_Y_DISEÑO</div>
                    </header>
                    <div className="module-content glass-light stack--tight" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <AEEGraphicPanel 
                            config={atom?.payload} 
                            onChange={(updatedConfig) => {
                                // Mapeamos las actualizaciones de graphic settings a live config completas
                                onConfigChange?.(prev => ({ ...prev, graphics: updatedConfig.graphics }));
                            }} 
                        />
                    </div>
                </section>

                {/* ── 03 // DESTINO DE DATOS (EXECUTOR) ── */}
                <section className="inspector-module stack--tight">
                    <header className="module-header" style={{ marginBottom: 'var(--space-3)' }} title="El motor que procesará el formulario al envío.">
                        <div className="indra-field-label">03 // DESTINO_DE_DATOS</div>
                    </header>
                    <div className="module-content glass-light stack--tight" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
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
                            label="EJECUTOR_ENLAZADO"
                            atomClass={executorType}
                            value={executorId}
                            onSelect={(val) => handleChange('executor_id', val)}
                        />
                        {selectedExecutor && (
                            <div className="shelf--tight" style={{ opacity: 0.6, marginTop: '4px' }}>
                                <IndraIcon name="CHECK" size="10px" style={{ color: 'var(--color-success)' }} />
                                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)' }}>{selectedExecutor.handle?.label}_VINCULADO</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 04 // ANATOMÍA DEL GATILLO ── */}
                <section className="inspector-module stack--tight">
                    <header className="module-header" style={{ marginBottom: 'var(--space-3)' }} title="Propiedades del botón de acción principal.">
                        <div className="indra-field-label">04 // CONFIGURACIÓN_DEL_BOTÓN</div>
                    </header>
                    <div className="module-content glass-light stack--tight" style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div className="stack--tight">
                            <label className="font-mono" style={{ fontSize: '8px', opacity: 0.5 }}>LABEL_DEL_BOTÓN</label>
                            <input 
                                className="input-base font-mono"
                                type="text"
                                style={{ fontSize: '10px', padding: '6px' }}
                                placeholder="ENVIAR DATOS"
                                value={localButtonLabel}
                                onChange={(e) => handleChange('button_label', e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
