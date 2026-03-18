/**
 * =============================================================================
 * ARTEFACTO: ServiceManager.jsx
 * RESPONSABILIDAD: Gestión centralizada de Bóveda y Proveedores (Infrastructure).
 * =============================================================================
 */

import React, { useState } from 'react';
import { useVault } from './useVault';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useLexicon } from '../../../services/lexicon';
import { DataProjector } from '../../../services/DataProjector';
import './ServiceManager.css';

export function ServiceManager({ onClose, filter: propFilter }) {
    const globalFilter = useAppState(s => s.serviceFilter);
    const globalClose = useAppState(s => s.closeServiceManager);
    
    const filter = propFilter || globalFilter;
    const handleClose = onClose || globalClose;

    const {
        services: rawServices,
        pairingStatus,
        pairingError,
        pairService,
        unpairService,
        setPairingStatus
    } = useVault();
    const t = useLexicon();

    // AXIOMA DE PROYECCIÓN: Los servicios se proyectan en la frontera del componente.
    const services = (rawServices || []).map(s => DataProjector.projectService(s));

    const [selectedService, setSelectedService] = useState(null);
    const [apiKey, setApiKey] = useState('');

    const handlePair = async () => {
        if (!selectedService || !apiKey) return;
        await pairService(selectedService.id, { api_key: apiKey });
        setApiKey('');
    };

    return (
        <div className="service-manager-overlay">
            <div className="service-manager-content glass hud-deco-corners">

                {/* ── HEADER HUD ── */}
                <header className="spread service-manager__header">
                    <div className="shelf--loose">
                        <IndraIcon name="VAULT" size="28px" style={{ color: 'var(--color-accent)' }} />
                        <div className="stack--tight">
                            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', margin: 0 }}>
                                {filter === 'intelligence' ? t('ui_agent_config') : t('ui_infra_manager')}
                            </h1>
                            <div className="shelf">
                                <span className="vault-status">{t('ui_vault_encryption')}</span>
                                <div className="hud-line" style={{ width: '100px' }}></div>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn--ghost" onClick={handleClose}>
                        <IndraIcon name="CLOSE" />
                        {t('ui_exit_infra')}
                    </button>
                </header>

                <div className="grid-split fill" style={{ gridTemplateColumns: '260px 1fr', gap: 'var(--space-8)' }}>

                    {/* COLUMNA A: STATUS & INFO */}
                    <aside className="stack" style={{ gap: 'var(--space-8)' }}>
                        <div className="stack--tight">
                            <label className="text-label" style={{ opacity: 0.5 }}>01 // {t('ui_overview')}</label>
                            <div className="glass-void stack--tight" style={{ padding: 'var(--space-4)', borderLeft: '2px solid var(--color-accent)' }}>
                                <span className="text-hint">{t('ui_active_services')}: {services.filter(s => s.isReady).length}</span>
                                <span className="text-hint">{t('ui_pending_pairing')}: {services.filter(s => !s.isReady).length}</span>
                            </div>
                        </div>

                        <div className="stack--tight">
                            <label className="text-label" style={{ opacity: 0.5 }}>02 // {t('ui_security_log')}</label>
                            <div className="text-hint" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.4 }}>
                                [ {new Date().toLocaleTimeString()} ] INFRA_OPENED<br />
                                [ {new Date().toLocaleTimeString()} ] VAULT_AUTH_VERIFIED<br />
                                [ {new Date().toLocaleTimeString()} ] SCANNING_PROVIDERS...
                            </div>
                        </div>
                    </aside>

                    {/* COLUMNA B: SERVICE GRID */}
                    <main className="fill stack" style={{ minHeight: 0 }}>
                        <div className="shelf--loose" style={{ marginBottom: 'var(--space-4)' }}>
                            <span className="text-label">{t('ui_providers')}</span>
                            <div className="hud-line fill" style={{ opacity: 0.1 }}></div>
                        </div>

                        <div className="service-grid fill">
                            {services
                                .filter(svc => !filter || svc.id.startsWith(filter) || svc.raw?.category === filter)
                                .map(svc => (
                                <div
                                    key={svc.id}
                                    className={`service-card hud-deco-corners ${svc.isReady ? 'is-paired' : ''} ${svc.error ? 'is-error' : ''}`}
                                    onClick={() => !svc.isReady && setSelectedService(svc)}
                                >
                                    <div className="spread" style={{ marginBottom: 'var(--space-4)' }}>
                                        <div className="service-card__icon">
                                            <IndraIcon name={svc.icon || 'SERVICE'} size="32px" />
                                        </div>
                                        <div className="service-card__status-dot"></div>
                                    </div>

                                    <div className="stack--tight">
                                        <h3 style={{ margin: 0, fontFamily: 'var(--font-mono)', color: svc.isReady ? 'var(--color-accent)' : 'white' }}>
                                            {svc.label}
                                        </h3>
                                        <span className="text-hint" style={{ fontSize: '10px', opacity: 0.6 }}>
                                            {svc.isReady ? t('status_active') : t('status_ready_pair')}
                                        </span>
                                    </div>

                                    {svc.isReady && (
                                        <button
                                            className="btn btn--mini btn--danger"
                                            style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 8px' }}
                                            onClick={(e) => { e.stopPropagation(); unpairService(svc.id); }}
                                        >
                                            {t('action_disconnect')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </main>
                </div>

                {/* ── PAIRING PANEL (MODAL) ── */}
                {selectedService && (
                    <div className="pairing-panel glass hud-deco-corners">
                        <header className="spread pairing-panel__header">
                            <div className="shelf--loose">
                                <IndraIcon name="LOCK" size="24px" style={{ color: 'var(--color-accent)' }} />
                                <div className="stack--tight">
                                    <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>{t('ui_pairing')} // {selectedService.label}</h2>
                                    <span className="text-hint">{t('ui_pairing_desc')}</span>
                                </div>
                            </div>
                            <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>
                                <IndraIcon name="CLOSE" />
                            </button>
                        </header>

                        <div className="center fill stack" style={{ maxWidth: '400px', margin: '0 auto', gap: 'var(--space-8)' }}>
                            <div className="stack field-box slot-small">
                                <label className="util-label">{t('ui_provider_secret')}</label>
                                <input
                                    className="input-base"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="••••••••••••••••••••••••"
                                    autoFocus
                                />
                                <span className="text-hint" style={{ fontSize: '9px', marginTop: '4px' }}>
                                    {t('ui_vault_notice')}
                                </span>
                            </div>

                            <div className="spread full">
                                <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>{t('action_cancel')}</button>
                                <button
                                    className={`btn btn--accent ${pairingStatus === 'PAIRING' ? 'active' : ''}`}
                                    onClick={handlePair}
                                    disabled={!apiKey || pairingStatus === 'PAIRING'}
                                >
                                    {pairingStatus === 'PAIRING' ? t('status_encrypting') : t('action_authorize')}
                                </button>
                            </div>

                            {pairingStatus === 'ERROR' && (
                                <div className="danger-text stack--tight center bubble" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                                    <IndraIcon name="ERROR" />
                                    <span>{pairingError}</span>
                                </div>
                            )}

                            {pairingStatus === 'SUCCESS' && (
                                <div className="success-text stack--tight center" style={{ color: 'var(--color-accent)' }}>
                                    <IndraIcon name="OK" />
                                    <span>{t('status_vault_ok')}</span>
                                    <button className="btn btn--sm btn--accent" style={{ marginTop: '10px' }} onClick={() => setSelectedService(null)}>{t('action_finish')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
