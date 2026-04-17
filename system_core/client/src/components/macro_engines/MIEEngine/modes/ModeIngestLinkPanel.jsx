import { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';
import { QRCodeSVG } from 'qrcode.react';

export const ModeIngestLinkPanel = ({ mieState }) => {
    const googleUser = useAppState(s => s.googleUser);
    const [selectedFolder, setSelectedFolder] = useState(null); // Sería similar al selector del Modo Drive
    const [generatedLink, setGeneratedLink] = useState('');
    const [expiryDays, setExpiryDays] = useState(7);

    const generateLink = () => {
        if (!selectedFolder) return alert("Selecciona carpeta primero.");

        const payload = {
            v: 1,
            label: `Evento: ${selectedFolder.name}`,
            folderId: selectedFolder.id,
            ownerEmail: googleUser.email,
            ownerToken: "...", // En prod: un scope limitado o proxy-token
            preset: mieState.currentPreset,
            expiresAt: new Date(Date.now() + (expiryDays * 24 * 60 * 60 * 1000)).toISOString()
        };

        const token = btoa(JSON.stringify(payload));
        const fullLink = `${window.location.origin}/#/ingest?token=${token}`;
        setGeneratedLink(fullLink);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        alert("Link copiado.");
    };

    return (
        <div className="mode-panel fill center stack--loose" style={{ padding: '80px' }}>
            {!generatedLink ? (
                <div className="generator-setup stack--loose center">
                    <IndraIcon name="SHARE" size="40px" color="#7b2ff7" />
                    <h2 className="font-syncopate">TERMINAL DE INGESTA</h2>
                    <p className="util-hint" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        Crea un puente directo para que fotógrafos o colaboradores suban material a tu Drive. 
                        Indra lo procesará en sus dispositivos automáticamente.
                    </p>

                    <div className="glass-card stack--loose" style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
                        {/* Selector de carpeta simplificado */}
                        <div className="shelf--between" onClick={() => setSelectedFolder({ id: 'dummy', name: 'Material Evento' })} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                            <div className="shelf--tight">
                                <IndraIcon name="FOLDER" size="12px" />
                                <span className="font-outfit">{selectedFolder?.name || 'SELECCIONAR CARPETA...'}</span>
                            </div>
                            <IndraIcon name="ARROW_DOWN" size="8px" />
                        </div>

                        <div className="shelf--between">
                            <span className="util-label" style={{ fontSize: '9px' }}>DURACIÓN DEL LINK</span>
                            <select 
                                value={expiryDays} 
                                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                style={{ background: 'transparent', border: 'none', color: '#7b2ff7', fontSize: '12px', fontWeight: 900 }}
                            >
                                <option value={1}>1 DÍA</option>
                                <option value={7}>7 DÍAS</option>
                                <option value={30}>30 DÍAS</option>
                            </select>
                        </div>

                        <button 
                            className="btn btn--primary fill" 
                            style={{ height: '50px' }}
                            onClick={generateLink}
                        >
                            GENERAR ACCESO SEGURO
                        </button>
                    </div>
                </div>
            ) : (
                <div className="success-state stack--loose center scale-in">
                    <QRCodeSVG value={generatedLink} size={200} bgColor={"transparent"} fgColor={"#7b2ff7"} level={"H"} includeMargin={true} />
                    
                    <div className="text-content center stack--tight">
                        <h1 className="font-syncopate" style={{ fontSize: '20px' }}>PUENTE ESTABLECIDO</h1>
                        <p className="util-hint" style={{ fontSize: '11px' }}>Comparte este código o el link de abajo con el proveedor.</p>
                    </div>

                    <div className="link-box shelf--between glass-pill" style={{ padding: '12px 20px', width: '100%', maxWidth: '500px', background: 'rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '9px', opacity: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '20px' }}>
                            {generatedLink}
                        </span>
                        <button className="btn btn--icon btn--ghost" onClick={copyToClipboard}>
                            <IndraIcon name="COPY" size="12px" />
                        </button>
                    </div>

                    <button className="btn btn--mini btn--ghost" onClick={() => setGeneratedLink('')}>
                        CREAR OTRO LINK
                    </button>
                </div>
            )}
        </div>
    );
};
