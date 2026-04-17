import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';

export const MIENavbar = () => {
    const closeTool = useAppState(s => s.closeTool);
    const activeTool = useAppState(s => s.activeTool);
    const isConnected = useAppState(s => s.isConnected);
    const googleUser = useAppState(s => s.googleUser);

    const isGuest = activeTool === 'INGEST_GUEST';

    return (
        <nav className="mie-engine-navbar" style={{ justifyContent: 'space-between' }}>
            <div className="shelf--tight">
                <button className="btn btn--icon btn--ghost" onClick={closeTool} title="SALIR DE MOTOR">
                    <IndraIcon name="BACK" size="14px" />
                </button>
                <div className="font-syncopate" style={{ marginLeft: '12px', fontWeight: 900, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    INDRA <span style={{ color: 'var(--color-accent)' }}>M.I.E</span>
                </div>
            </div>

            {isGuest && (
                <div className="util-label status-glow" style={{ color: 'var(--color-accent)' }}>
                    SESIÓN DE INGESTA ACTIVA
                </div>
            )}

            <div className="shelf--tight">
                {googleUser && (
                    <div className="shelf--tight glass-pill" style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--glass-light)', border: '1px solid var(--color-border)' }}>
                        <img src={googleUser.photoURL} alt="p" style={{ width: '20px', borderRadius: '50%' }} />
                        <span style={{ opacity: 0.9 }}>{googleUser.displayName.split(' ')[0]}</span>
                    </div>
                )}
                {!googleUser && !isGuest && (
                    <div className="util-hint" style={{ fontSize: '11px' }}>PROCESAMIENTO LOCAL</div>
                )}
            </div>
        </nav>
    );
};
