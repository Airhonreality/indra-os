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
import { useAppState } from '../../../state/app_state';
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
    const [formData, setFormData] = useState({});
    const [label, setLabel] = useState('');

    const handlePair = async () => {
        if (!selectedService) return;
        await pairService(selectedService.id, formData, { label });
        setFormData({});
        setLabel('');
    };

    const handleFieldChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
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
                                {filter === 'intelligence' ? t('ui_agent_config') : 'GESTOR DE CONECTORES'}
                            </h1>
                             <div className="shelf">
                                <span className="vault-status">SEGURIDAD NIVEL CORE</span>
                                <div className="hud-line" style={{ width: '100px' }}></div>
                            </div>
                        </div>
                    </div>
                     <button className="btn btn--ghost" onClick={handleClose}>
                        <IndraIcon name="CLOSE" />
                        SALIR
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
                    <main className="fill stack" style={{ minHeight: 0, gap: 'var(--space-6)' }}>
                        <div className="shelf--loose">
                             <span className="util-label">{"// EXPLORADOR"}</span>
                            <label className="text-label" style={{ letterSpacing: '0.2em' }}>CONECTORES DISPONIBLES</label>
                            <div className="hud-line fill" style={{ opacity: 0.1 }}></div>
                        </div>

                        <div className="service-list fill scroll-y" style={{ paddingRight: 'var(--space-4)' }}>
                            {services
                                .filter(svc => {
                                    // REQUERIMIENTO: Solo mostrar servicios externos configurables o vinculables.
                                    const raw = svc.raw || {};
                                    const hasConfig = raw.config_schema && raw.config_schema.length > 0;
                                    // EXCEPCIÓN: Si ya está vinculado (externo) o tiene esquema, se muestra.
                                    // Si es un motor interno (system), se queda fuera.
                                    return (svc.id.includes(':') || !svc.isReady || hasConfig) && svc.id !== 'system';
                                })
                                .filter(svc => !filter || svc.id.startsWith(filter) || svc.raw?.category === filter)
                                .map(svc => (
                                <div
                                    key={svc.id}
                                    className={`service-tile ${svc.isReady ? 'is-active' : 'is-pending'} ${svc.error ? 'is-error' : ''}`}
                                    onClick={() => !svc.isReady && setSelectedService(svc)}
                                >
                                    {/* Cabecera / Status Slot */}
                                    <div className="service-tile__status">
                                        <div className={`status-dot ${svc.isReady ? 'breathing-pulse' : ''}`}></div>
                                    </div>

                                    {/* Icono Principal */}
                                    <div className="service-tile__icon-box">
                                        <div className="icon-glow"></div>
                                        <IndraIcon name={svc.icon || 'SERVICE'} size="20px" />
                                    </div>

                                    {/* Información Central */}
                                    <div className="service-tile__body stack--tight">
                                        <div className="shelf">
                                            <h3 className="service-tile__title">{svc.label}</h3>
                                            <span className="badge badge--dark">{svc.id.split(':')[0].toUpperCase()}</span>
                                        </div>
                                        <div className="shelf--tight opacity-40" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                            <span style={{ color: svc.isReady ? 'var(--color-success)' : 'var(--color-warm)' }}>
                                                {svc.isReady ? 'STATUS_CONNECTED' : 'STATUS_WAITING_SECRET'}
                                            </span>
                                            <span>{"//"}</span>
                                            <span>{svc.id}</span>
                                        </div>
                                    </div>

                                    {/* Acción Lateral */}
                                    <div className="service-tile__actions">
                                        {svc.isReady ? (
                                            <button
                                                className="btn btn--mini btn--ghost-danger ripple"
                                                onClick={(e) => { e.stopPropagation(); unpairService(svc.id); }}
                                                style={{ borderStyle: 'dashed' }}
                                            >
                                                {t('action_disconnect')}
                                            </button>
                                        ) : (
                                            <div className="shelf--tight opacity-40">
                                                <span style={{ fontSize: '9px' }}>CONFIGURAR</span>
                                                <IndraIcon name="ARROW_RIGHT" size="10px" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Decoración HUD de Línea de Conexión */}
                                    <div className="service-tile__cabling"></div>
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
                                     <h2 style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>VINCULACIÓN // {selectedService.label}</h2>
                                    <span className="text-hint">Ingrese credenciales para autorizar el túnel.</span>
                                </div>
                            </div>
                            <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>
                                <IndraIcon name="CLOSE" />
                            </button>
                        </header>

                        <div className="center fill stack" style={{ maxWidth: '400px', margin: '0 auto', gap: 'var(--space-8)', padding: '40px 0' }}>
                            {pairingStatus !== 'SUCCESS' && (
                                <div className="stack" style={{ gap: 'var(--space-6)', width: '100%' }}>
                                    {/* Campo Universal: Nombre de la Conexión */}
                                    <div className="stack field-box slot-small">
                                        <label className="util-label">NOMBRE DE LA CONEXIÓN</label>
                                        <input
                                            className="input-base"
                                            type="text"
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            placeholder="Ej: Notion Personal, Empresa..."
                                        />
                                    </div>

                                    {/* Campos Dinámicos Inducidos por el ADN del Proveedor */}
                                    {(selectedService.raw?.config_schema || [
                                        { id: 'api_key', label: t('ui_provider_secret'), type: 'password' }
                                    ]).map(field => (
                                        <div key={field.id} className="stack field-box slot-small">
                                            <label className="util-label">{field.label.toUpperCase()}</label>
                                            <input
                                                className="input-base"
                                                type={field.type || 'text'}
                                                value={formData[field.id] || ''}
                                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                placeholder={field.placeholder || "••••••••••••••••••••••••"}
                                            />
                                        </div>
                                    ))}

                                    <span className="text-hint" style={{ fontSize: '9px', marginTop: '4px' }}>
                                        {t('ui_vault_notice')}
                                    </span>

                                    <div className="spread full" style={{ marginTop: 'var(--space-4)' }}>
                                        <button className="btn btn--ghost" onClick={() => setSelectedService(null)}>{t('action_cancel')}</button>
                                        <button
                                            className={`btn btn--accent ${pairingStatus === 'PAIRING' ? 'active' : ''}`}
                                            onClick={handlePair}
                                            disabled={pairingStatus === 'PAIRING'}
                                        >
                                            {pairingStatus === 'PAIRING' ? t('status_encrypting') : t('action_authorize')}
                                        </button>
                                    </div>
                                </div>
                            )}

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
