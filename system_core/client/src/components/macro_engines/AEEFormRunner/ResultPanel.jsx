/**
 * =============================================================================
 * ARTEFACTO: ResultPanel.jsx
 * RESPONSABILIDAD: Proyectar el resultado de la ejecución lógica (AEE).
 *
 * ADR-023: Detecta campos INDRA_MEDIA en el resultado y los renderiza
 * como imágenes o links de archivo, no como JSON crudo.
 * Incluye botón de exportación PDF via CSS Print.
 * =============================================================================
 */

import { useRef } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { Spinner } from '../../utilities/primitives';
import { DataProjector } from '../../../services/DataProjector';
import { useLexicon } from '../../../services/lexicon';

/**
 * Detecta y proyecta un valor de resultado: si es INDRA_MEDIA, renderiza
 * el contenido visual. Si es primitivo, renderiza como texto.
 */
function SmartValueRenderer({ value }) {
    if (value === null || value === undefined) return <span style={{ opacity: 0.3 }}>—</span>;

    // INDRA_MEDIA individual
    if (typeof value === 'object' && value.type === 'INDRA_MEDIA') {
        const media = DataProjector.projectMedia(value)[0];
        if (!media) return <span style={{ opacity: 0.3 }}>MEDIA_SIN_URL</span>;
        return media.is_image
            ? <img src={media.canonical_url} alt={media.alt || 'media'} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            : <a href={media.canonical_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{media.alt || media.canonical_url}</a>;
    }

    // Array (puede contener INDRA_MEDIA o primitivos)
    if (Array.isArray(value)) {
        const medias = DataProjector.projectMedia(value);
        if (medias.length > 0) {
            return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {medias.map((m, i) => m.is_image
                        ? <img key={i} src={m.canonical_url} alt={m.alt || 'media'} style={{ maxWidth: '120px', maxHeight: '100px', borderRadius: '4px', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        : <a key={i} href={m.canonical_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', fontSize: '9px' }}>{m.alt || 'archivo'}</a>
                    )}
                </div>
            );
        }
        return <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{JSON.stringify(value)}</span>;
    }

    // Objeto genérico
    if (typeof value === 'object') {
        return <pre style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', opacity: 0.8 }}>{JSON.stringify(value, null, 2)}</pre>;
    }

    // Primitivo
    return <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{String(value)}</span>;
}

export function ResultPanel({ result, status, error, onReset }) {
    const t = useLexicon();
    const printRef = useRef(null);

    const handlePrint = () => {
        if (!printRef.current) return;
        printRef.current.classList.add('indra-print-scope--active');
        window.print();
        printRef.current.classList.remove('indra-print-scope--active');
    };

    if (status === 'EXECUTING') {
        return (
            <div className="aee-result glass stack center">
                <Spinner size="60px" color="var(--color-accent)" label={t('status_executing_logic')} />
            </div>
        );
    }

    if (status === 'ERROR' || error) {
        return (
            <div className="aee-result glass stack center">
                <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>
                    <IndraIcon name="ERROR" size="80px" />
                </div>
                <h3 className="util-label">{t('error_fatal_logic')}</h3>
                <p className="text-hint" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    {error || t('error_core_rejection')}
                </p>
                <button className="btn btn--ghost" style={{ marginTop: 'var(--space-6)' }} onClick={onReset}>
                    {t('action_retry')}
                </button>
            </div>
        );
    }

    const hasData = result && Object.keys(result).length > 0;
    const humanMessage = result?.message || result?.msg || result?.notificacion;

    // Separar campos known-media de campos primitivos para proyección inteligente
    const mediaFields = hasData ? Object.entries(result).filter(([, v]) =>
        (typeof v === 'object' && v?.type === 'INDRA_MEDIA') ||
        (Array.isArray(v) && v.some(item => item?.type === 'INDRA_MEDIA'))
    ) : [];
    const dataFields = hasData ? Object.entries(result).filter(([k, v]) =>
        !mediaFields.find(([mk]) => mk === k) && k !== 'message' && k !== 'msg' && k !== 'notificacion'
    ) : [];

    return (
        <>
            {/* PRINT CSS: solo el ref sale al imprimir cuando tiene la clase activa */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    .indra-print-scope--active { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
                }
            `}</style>

            <div className="aee-result glass stack center" ref={printRef}>
                <div style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
                    <IndraIcon name="OK" size="80px" />
                </div>
                <h3 className="util-label">{t('status_resonance_success')}</h3>

                <div className="result-projection stack" style={{ marginTop: 'var(--space-4)', width: '100%', maxWidth: '600px', gap: 'var(--space-4)' }}>

                    {/* Mensaje humano */}
                    {humanMessage && (
                        <p style={{ fontSize: '14px', textAlign: 'center', color: 'white', fontWeight: '500' }}>
                            {humanMessage}
                        </p>
                    )}

                    {/* Campos MEDIA: renderizados visualmente */}
                    {mediaFields.length > 0 && (
                        <div className="stack--tight" style={{ gap: 'var(--space-3)' }}>
                            {mediaFields.map(([key, val]) => (
                                <div key={key} className="stack--tight">
                                    <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', opacity: 0.4, letterSpacing: '0.1em' }}>{key.toUpperCase()}</span>
                                    <SmartValueRenderer value={val} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Campos de datos */}
                    {dataFields.length > 0 && (
                        <div className="glass-void stack--tight" style={{ width: '100%', padding: 'var(--space-4)' }}>
                            <header className="shelf--between" style={{ marginBottom: 'var(--space-3)', opacity: 0.5 }}>
                                <span className="util-label" style={{ fontSize: '8px' }}>DATOS_OPERATIVOS</span>
                                <IndraIcon name="SCHEMA" size="10px" />
                            </header>
                            {dataFields.map(([key, val]) => (
                                <div key={key} className="shelf--tight" style={{ gap: 'var(--space-3)', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5, minWidth: '100px', flexShrink: 0 }}>{key}</span>
                                    <SmartValueRenderer value={val} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Acciones del resultado */}
                <div className="shelf--tight" style={{ marginTop: 'var(--space-6)', gap: 'var(--space-3)' }}>
                    <button className="btn btn--ghost btn--xs" onClick={handlePrint} title="Exportar resultado como PDF">
                        <IndraIcon name="DOCUMENT" size="12px" />
                        <span style={{ fontSize: '9px' }}>EXPORTAR PDF</span>
                    </button>
                    <button className="btn btn--accent" onClick={onReset}>
                        {t('action_finish_session')}
                    </button>
                </div>
            </div>
        </>
    );
}
