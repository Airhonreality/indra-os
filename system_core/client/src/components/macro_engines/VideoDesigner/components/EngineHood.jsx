import { IndraEngineHood } from '../../../utilities/IndraEngineHood';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useLexicon } from '../../../../services/lexicon';

/**
 * Módulo: EngineHood
 * Dharma: Gestión de sincronía y persistencia global.
 */
export const EngineHood = ({ atom, isSaving, onSave, onExport, project }) => {
    const t = useLexicon();
    return (
        <IndraEngineHood
            leftSlot={
                <div className="engine-hood__capsule">
                    <IndraIcon name="VIDEO_PROJECT" size="12px" color="var(--indra-dynamic-accent)" />
                    <span className="font-mono" style={{ fontSize: '9px', opacity: 0.5, marginLeft: 'var(--space-1)' }}>
                        {`${t('ui_project_id')} // ${atom?.id?.slice(-8)}`}
                    </span>
                </div>
            }
            rightSlot={
                <div className="shelf--tight">
                    <button 
                        className="btn btn--xs" 
                        onClick={onSave}
                        disabled={isSaving}
                        style={{ 
                            borderRadius: 'var(--indra-ui-radius)', 
                            backgroundColor: 'var(--indra-dynamic-bg)', 
                            border: '1px solid var(--indra-dynamic-accent)',
                            color: 'var(--indra-dynamic-accent)',
                            padding: '2px 12px' 
                        }}
                    >
                        <IndraIcon name={isSaving ? "LOAD" : "SAVE"} size="10px" color="var(--indra-dynamic-accent)" className={isSaving ? 'spin' : ''} />
                        <span style={{ marginLeft: "6px" }}>{isSaving ? t('status_loading') : t('action_save')}</span>
                    </button>
                    
                    <button 
                        className="btn btn--ghost btn--xs" 
                        onClick={onExport}
                        style={{ 
                            borderRadius: 'var(--indra-ui-radius)', 
                            padding: '2px 12px', 
                            fontSize: '9px', 
                            borderColor: 'var(--color-info)', 
                            color: 'var(--color-info)', 
                            background: 'rgba(56, 189, 248, 0.05)' 
                        }}
                    >
                        <IndraIcon name="FLOW" size="10px" color="var(--color-info)" />
                        <span style={{ marginLeft: "6px" }}>{t('action_export')}</span>
                    </button>
                </div>
            }
        />
    );
};
