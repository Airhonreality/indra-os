/**
 * =============================================================================
 * ARTEFACTO: ServiceManager.jsx
 * RESPONSABILIDAD: Gestión centralizada de Bóveda y Proveedores (Infrastructure).
 * =============================================================================
 */

import React, { useState } from 'react';
import { useVault } from './useVault';
import { IndraIcon } from '../../utilities/IndraIcons';
import './ServiceManager.css';

export function ServiceManager({ onClose }) {
    const {
        services,
        pairingStatus,
        pairingError,
        pairService,
        unpairService,
        setPairingStatus
    } = useVault();

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
                            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', margin: 0 }}>INFRA_MANAGER</h1>
                            <div className="shelf">
                                <span className="vault-status">VAULT_ENCRYPTION: AES_256</span>
                                <div className="hud-line" style={{ width: '100px' }}></div>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn--ghost" onClick={onClose}>
                        <IndraIcon name="CLOSE" />
                        EXIT_INFRA
                    </button>
                </header>

                <div className="grid-split fill" style={{ gridTemplateColumns: '260px 1fr', gap: 'var(--space-8)' }}>

                    {/* COLUMNA A: STATUS & INFO */}
                    <aside className="stack" style={{ gap: 'var(--space-8)' }}>
                        <div className="stack--tight">
                            <label className="text-label" style={{ opacity: 0.5 }}>01 // OVERVIEW</label>
                            <div className="glass-void stack--tight" style={{ padding: 'var(--space-4)', borderLeft: '2px solid var(--color-accent)' }}>
                                <span className="text-hint">ACTIVE_SERVICES: {services.filter(s => s.isReady).length}</span>
                                <span className="text-hint">PENDING_PAIRING: {services.filter(s => !s.isReady).length}</span>
                            </div>
                        </div>

                        <div className="stack--tight">
                            <label className="text-label" style={{ opacity: 0.5 }}>02 // SECURITY_LOG</label>
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
                            <span className="text-label">AVAILABLE_PROVIDERS</span>
                            <div className="hud-line fill" style={{ opacity: 0.1 }}></div>
                        </div>

                        <div className="service-grid fill">
                            {services.map(svc => (
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
                                            {svc.isReady ? 'SYNC_ACTIVE' : 'READY_TO_PAIR'}
                                        </span>
                                    </div>

                                    {svc.isReady && (
                                        <button
                                            className="btn btn--mini btn--danger"
                                            style={{ position: 'absolute', top: '10px', right: '10px', padding: '2px 8px' }}
                                            onClick={(e) => { e.stopPropagation(); unpairService(svc.id); }}
                                        >
                                            DISCONNECT
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
                                    <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>PAIRING // {selectedService.label}</h2>
                                    <span className="text-hint">Ingrese las credenciales para autorizar el túnel de datos.</span>
                                </div>
                            </div>
                            <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>
                                <IndraIcon name="CLOSE" />
                            </button>
                        </header>

                        <div className="center fill stack" style={{ maxWidth: '400px', margin: '0 auto', gap: 'var(--space-8)' }}>
                            <div className="stack field-box slot-small">
                                <label className="util-label">PROVIDER_SECRET (API_KEY)</label>
                                <input
                                    className="input-base"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="••••••••••••••••••••••••"
                                    autoFocus
                                />
                                <span className="text-hint" style={{ fontSize: '9px', marginTop: '4px' }}>
                                    Las llaves nunca salen del core y son cifradas en reposo.
                                </span>
                            </div>

                            <div className="spread full">
                                <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>CANCEL</button>
                                <button
                                    className={`btn btn--accent ${pairingStatus === 'PAIRING' ? 'active' : ''}`}
                                    onClick={handlePair}
                                    disabled={!apiKey || pairingStatus === 'PAIRING'}
                                >
                                    {pairingStatus === 'PAIRING' ? 'ENCRYPTING...' : 'AUTHORIZE_AND_PAIR'}
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
                                    <span>CREDENTIAL_ACCEPTED_BY_VAULT</span>
                                    <button className="btn btn--sm btn--accent" style={{ marginTop: '10px' }} onClick={() => setSelectedService(null)}>FINISH</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
