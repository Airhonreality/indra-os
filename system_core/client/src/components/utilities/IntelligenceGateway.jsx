/**
 * IntelligenceGateway.jsx
 * PORTAL GLOBAL DE INTELIGENCIA SOBERANA
 */

import { useAppState } from '../../state/app_state';
import { IntelligencePortal } from '../utilities/IntelligencePortal';
import { IndraIcon } from '../utilities/IndraIcons';
import { useLexicon } from '../../services/lexicon';

export function IntelligenceGateway() {
    const isPortalOpen = useAppState(s => s.isIntelligencePortalOpen);
    const togglePortal = useAppState(s => s.toggleIntelligencePortal);
    const t = useLexicon();

    if (!isPortalOpen) return null;

    return (
        <div className="intelligence-gateway-overlay" style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="intelligence-gateway-modal glass hud-deco-corners" style={{
                width: '400px',
                padding: 'var(--space-6)',
                border: '1px solid var(--color-accent-soft)',
                boxShadow: '0 0 50px rgba(109, 40, 217, 0.2)'
            }}>
                <header className="spread" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="shelf">
                        <IndraIcon name="COGNITIVE" color="var(--color-accent)" size="20px" />
                        <h2 className="text-mono" style={{ margin: 0, fontSize: '18px' }}>
                            {t('ui_agent_config')}
                        </h2>
                    </div>
                    <button className="btn--ghost" onClick={() => togglePortal(false)}>
                        <IndraIcon name="CLOSE" />
                    </button>
                </header>

                <div className="text-body" style={{ fontSize: '12px', opacity: 0.7, marginBottom: 'var(--space-6)' }}>
                    {t('ui_config_required_desc')}
                </div>

                <IntelligencePortal onUpdate={() => {}} />

                <footer className="center" style={{ marginTop: 'var(--space-8)' }}>
                    <button className="btn btn--accent full" onClick={() => togglePortal(false)}>
                        {t('action_finish')}
                    </button>
                </footer>
            </div>
        </div>
    );
}
