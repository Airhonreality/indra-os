import React, { useState } from 'react';
import { MIEDropzone } from '../widgets/MIEDropzone';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';
import { getFileFingerprint, getUploadHistory } from '../../../../services/multimedia_core/MIEOrchestrator';

/**
 * IngestGuestView
 * RESPONSABILIDAD: El "Landing" del colaborador externo (Fotógrafo).
 * AXIOMA: Máxima simplicidad, Cero Fricción.
 * MEJORA: Filtra automáticamente archivos ya subidos anteriormente desde el mismo dispositivo.
 */
export const IngestGuestView = ({ mieState }) => {
    const session = useAppState(s => s.ingestSessionToken);
    const [duplicatesFound, setDuplicatesFound] = useState(0);

    if (!session) return <div className="center fill stack--tight">
        <IndraIcon name="WARN" size="32px" color="var(--color-danger)" />
        <span className="font-syncopate">SESIÓN NO ENCONTRADA</span>
        <p style={{ fontSize: '10px', opacity: 0.5 }}>EL TOKEN HA EXPIRADO O ES INVÁLIDO</p>
    </div>;

    const handleFiles = (incomingFiles) => {
        const history = getUploadHistory();
        const toProcess = [];
        let dupesInRange = 0;

        incomingFiles.forEach(file => {
            const fp = getFileFingerprint(file);
            if (history.includes(fp)) {
                dupesInRange++;
            } else {
                toProcess.push(file);
            }
        });

        if (dupesInRange > 0) {
            setDuplicatesFound(dupesInRange);
        } else {
            setDuplicatesFound(0);
        }

        if (toProcess.length > 0) {
            mieState.addFiles(toProcess);
        }
    };

    return (
        <div className="guest-view-container fill center stack--loose" style={{ padding: '24px' }}>
            <header className="guest-header center stack--tight">
                <IndraIcon name="INDRA" size="32px" color="#7b2ff7" />
                <div className="util-label" style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '0.2em', marginTop: '20px' }}>
                    TERMINAL DE INGESTA COLABORATIVA
                </div>
                <h1 className="font-syncopate" style={{ fontSize: '28px', marginTop: '10px' }}>{session.label.toUpperCase()}</h1>
                <div className="owner-badge shelf--tight glass-pill" style={{ padding: '6px 16px', marginTop: '10px' }}>
                    <div className="dot" style={{ width: '6px', height: '6px', background: 'var(--color-success)', borderRadius: '50%' }} />
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>DESTINO // {session.rootFolderName}</span>
                </div>
            </header>

            <MIEDropzone 
                onFiles={handleFiles}
                isProcessing={mieState.isProcessing}
                globalProgress={mieState.globalProgress}
            />

            {duplicatesFound > 0 && (
                <div className="status-badge warn shelf--between" style={{ 
                    width: '100%', maxWidth: '400px', padding: '12px 16px', 
                    background: 'rgba(255, 193, 7, 0.08)', border: '1px solid #ffc107', 
                    borderRadius: '8px', marginTop: '10px' 
                }}>
                    <div className="shelf--tight">
                        <IndraIcon name="WARN" size="14px" color="#ffc107" />
                        <div className="stack--minimal">
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffc107' }}>{duplicatesFound} DUPLICADOS EVITADOS</span>
                            <span style={{ fontSize: '9px', opacity: 0.6 }}>Archivos ya presentes en tu historial de carga.</span>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={() => setDuplicatesFound(0)}>
                        <IndraIcon name="CLOSE" size="10px" />
                    </button>
                </div>
            )}

            <footer className="center stack--tight" style={{ opacity: 0.4, marginTop: 'auto' }}>
                <p style={{ fontSize: '10px' }}>EL PROYECCIÓN ESTÁ UTILIZANDO TU GPU PARA TRANSCODIFICAR LA MATERIA ANTES DE SUBIRLA.</p>
                <div className="shelf--tight">
                    <IndraIcon name="SHIELD_LOCK" size="10px" />
                    <span style={{ fontSize: '8px' }}>MEMORIA LOCAL ACTIVA // SIN CARGAS REPETIDAS</span>
                </div>
            </footer>
        </div>
    );
};
