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
        
        return () => unsubscribe();
    }, [field.alias, onChange]);

    const handleFile = (e) => {
        if (!e.target.files.length) return;
        
        // Inyectamos los archivos en el manager
        ingestManager.addFiles(Array.from(e.target.files), { 
            uploader: 'User'
        });
        
        // Disparar procesamiento de cola
        ingestManager.processQueue();
    };

    return (
        <div className={`indra-mie indra-mie--${bridge.mode.toLowerCase()}`}>
            <div 
                className="indra-mie__dropzone" 
                onClick={() => !disabled && document.getElementById(field.alias).click()}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative' }}
            >
                <div style={{ position: 'absolute', top: '5px', right: '10px', fontSize: '8px', opacity: 0.5, fontFamily: 'monospace' }}>
                    MODO: {bridge.mode}
                </div>
                <IndraIcon name="ADD" size="30px" />
                <span>{queue.length > 0 ? 'AÑADIR MÁS' : 'SUBIR ARCHIVOS'}</span>
                <input 
                    id={field.alias} 
                    type="file" 
                    multiple 
                    onChange={handleFile} 
                    style={{ display: 'none' }} 
                    disabled={disabled}
                />
            </div>

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
