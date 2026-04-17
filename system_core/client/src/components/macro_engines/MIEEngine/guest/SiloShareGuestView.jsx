import { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';
import { FractalFolderTree } from './FractalFolderTree';
import { SiloFileViewer } from './SiloFileViewer';
import { useMIE } from '../widgets/useMIE';

/**
 * SiloShareGuestView (Vista Pública V2)
 * RESPONSABILIDAD: Layout maestro para el gestor colaborativo de silos.
 * AXIOMA: Soberanía delegada. El usuario navega el silo del propietario sin login.
 * Usa executeAs:USER_DEPLOYING del macro-core.
 */
export const SiloShareGuestView = ({ mieState: providedMieState }) => {
    // Aquí el `session` es el token V2 inyectado por LandingView.jsx

    const session = useAppState(s => s.ingestSessionToken);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [selectedFolderName, setSelectedFolderName] = useState(null);

    if (!session || session.mode !== 'SILO_SHARE') {
        return <div className="center fill stack--tight">
            <IndraIcon name="WARN" size="32px" color="var(--color-danger)" />
            <span className="font-syncopate">ERROR BIFROST: PUENTE COLAPSADO O INVÁLIDO</span>
        </div>;
    }

    // Instanciar motor MIE si no fue proveído por wrapper
    const defaultPreset = session?.miePreset || 'BALANCED';
    const localMieState = useMIE({ defaultPreset });
    const activeMieState = providedMieState || localMieState;

    const initialFolderId = session.rootFolderId;
    const activeFolderId = selectedFolderId || initialFolderId;
    const activeFolderName = selectedFolderName || session.rootFolderName;

    return (
        <div className="guest-view-container stack fill" style={{ background: 'var(--color-bg-void)' }}>
            
            <header className="silo-share-header shelf--between" style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--color-bg-surface)', backdropFilter: 'blur(32px)' }}>
                <div className="shelf--tight" style={{ gap: '24px' }}>
                    <div className="center" style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(123, 47, 247, 0.1)', border: '1px solid rgba(123, 47, 247, 0.3)' }}>
                        <IndraIcon name="FOLDER" size="24px" color="#7b2ff7" />
                    </div>
                    <div className="stack--none">
                        <span className="util-label" style={{ fontSize: '10px', color: '#7b2ff7' }}>SILO COMPARTIDO</span>
                        <h1 className="font-syncopate" style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>{session.label.toUpperCase()}</h1>
                    </div>
                </div>

                <div className="shelf--tight" style={{ gap: '16px' }}>
                    <div className="owner-badge shelf--tight glass-pill" style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.02)' }}>
                        <img src={session.ownerAvatar || "https://ui-avatars.com/api/?name=OWNER"} alt="owner" style={{ width: '24px', borderRadius: '50%' }} />
                        <div className="stack--none" style={{ marginLeft: '12px' }}>
                            <span style={{ fontSize: '9px', opacity: 0.5 }}>PROPIETARIO SOVERANO</span>
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{session.ownerEmail}</span>
                        </div>
                    </div>
                    <button className="btn btn--icon btn--ghost" onClick={() => useAppState.getState().closeTool()} title="Salir">
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </div>
            </header>


            <div className="silo-share-body shelf fill" style={{ overflow: 'hidden' }}>
                
                {/* PANEL IZQUIERDO: Árbol Fractal */}
                <aside className="silo-tree-panel stack--loose" style={{ width: '320px', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '24px', background: 'var(--color-bg-deep)', overflowY: 'auto' }}>
                    <h3 className="util-label" style={{ fontSize: '10px' }}>ESTRUCTURA DEL SILO</h3>
                    
                    <FractalFolderTree 
                        rootId={session.rootFolderId}
                        rootName={session.rootFolderName}
                        selectedFolderId={activeFolderId}
                        onFolderSelect={(id, name) => {
                            setSelectedFolderId(id);
                            setSelectedFolderName(name);
                        }}
                    />
                </aside>

                {/* PANEL CENTRAL: File Viewer & Uploader */}
                <main className="silo-files-panel fill center">
                    <SiloFileViewer 
                        folderId={activeFolderId}
                        folderName={activeFolderName}
                        session={session}
                        mieState={activeMieState}
                    />
                </main>
            </div>
        </div>
    );
};
