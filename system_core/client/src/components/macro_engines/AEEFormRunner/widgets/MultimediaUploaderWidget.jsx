import React, { useState, useEffect } from 'react';
import { ingestManager } from '../../../../services/multimedia_core/PeristalticIngestManager';
import { useIngestBridge } from '../../../../services/multimedia_core/useIngestBridge';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * MultimediaUploaderWidget - El Widget Camaleón
 * 
 * Este widget es la pieza de Lego fundamental para la ingesta nativa en el AEE.
 * No tiene estilos fijos para permitir total flexibilidad visual.
 */
export function MultimediaUploaderWidget({ field, value, onChange, disabled, bridge: aeeBridge }) {
    const bridge = useIngestBridge(aeeBridge);
    const [queue, setQueue] = useState([]);

    // Suscripción al motor peristáltico global
    useEffect(() => {
        const unsubscribe = ingestManager.subscribe((state) => {
            const currentQueue = state.queue || [];
            setQueue(currentQueue);
            
            // Notificar al AEE sobre los archivos completados para la persistencia del formulario
            const completed = currentQueue
                .filter(i => i.status === 'COMPLETED')
                .map(i => ({ id: i.fileId, name: i.name }));
            
            if (onChange) {
                onChange(field.alias, completed);
            }
        });
        
        // PROTOCOLO DE RESURRECCIÓN NATIVO: El widget hereda la capacidad de recuperar sesiones
        ingestManager.resurrectQueue();
        
        return () => unsubscribe();
    }, [field.alias, onChange]);

    const handleSmartSelection = async () => {
        /**
         * AXIOMA DE SOBERANÍA NATIVA (v9.0)
         * El widget ahora utiliza tipos MIME obscuros para evadir la sanitización de iOS/Android.
         */
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'application/pkcs8'; // BYPASS: Fuerza al sistema a abrir el explorador de archivos
        input.onchange = async (e) => {
            if (e.target.files?.length) {
                await ingestManager.addFiles(Array.from(e.target.files), { uploader: 'User' });
                await ingestManager.processQueue();
            }
        };
        input.click();
    };

    const handleBulkRelink = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*'; 
        input.onchange = async (e) => {
            if (e.target.files) {
                await ingestManager.bulkRelink(Array.from(e.target.files));
            }
        };
        input.click();
    };

    return (
        <div className={`indra-mie indra-mie--${bridge.mode.toLowerCase()}`}>
            <div 
                className="indra-mie__dropzone" 
                onClick={() => !disabled && handleSmartSelection()}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative' }}
            >
                <div style={{ position: 'absolute', top: '5px', right: '10px', fontSize: '8px', opacity: 0.5, fontFamily: 'monospace' }}>
                    SINC. SOBERANA v9.0
                </div>
                <IndraIcon name="ADD" size="30px" />
                <span>{queue.length > 0 ? 'AÑADIR MÁS' : 'SUBIR ARCHIVOS'}</span>
                {/* El input nativo ha sido ocultado y sustituido por el disparador inteligente */}
            </div>

            {queue.some(q => q.status === 'ERROR' && q.errorMsg?.includes('[I/O]')) && (
                <div style={{ padding: '8px', background: '#F8F8F8', borderRadius: '8px', marginBottom: '10px' }}>
                    <button onClick={handleBulkRelink} style={{ width: '100%', padding: '5px', background: '#4B5563', color: '#FFF', borderRadius: '6px', fontSize: '8px', fontWeight: 800, border: 'none' }}>
                        🔗 REVINCULACIÓN INTELIGENTE DE LOTE
                    </button>
                </div>
            )}

            {queue.length > 3 && (
                <div className="indra-mie__status-summary">
                    {queue.filter(i => i.status === 'COMPLETED').length} / {queue.length} completados
                </div>
            )}

            <div className="indra-mie__queue">
                {queue.map(item => (
                    <div key={item.id} className={`indra-mie__item indra-mie__item--${item.status.toLowerCase()}`}>
                        <div className="indra-mie__item-info">
                            <span className="indra-mie__item-name">{item.name}</span>
                            <span className="indra-mie__item-progress">
                                {Math.round((item.progress || 0) * 100)}%
                            </span>
                        </div>
                        <div className="indra-mie__item-bar-container">
                            <div 
                                className="indra-mie__item-bar" 
                                style={{ width: `${(item.progress || 0) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
