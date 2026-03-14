import React, { useState } from 'react';
import { IndraIcon } from './IndraIcons';
import { useVault } from '../shell/ServiceManager/useVault';

/**
 * =============================================================================
 * COMPONENTE: NexusServiceSlot
 * RESPONSABILIDAD: Panel de estado de un proveedor, invocable desde cualquier Motor.
 *
 * AXIOMA COGNOAGENTIVO:
 *   Si el proveedor es nativo (needs_setup: false), muestra estado activo directamente.
 *   Si requiere configuración manual, muestra el formulario de credenciales.
 *   El usuario no debe saber de tokens ni autenticaciones. Solo VE si está activo o no.
 * =============================================================================
 */
export function NexusServiceSlot({ providerId, label, description }) {
    const { services } = useVault();
    const service = services.find(s => s.id === providerId || s.id?.startsWith(`${providerId}:`));

    const [apiKey, setApiKey] = useState('');
    const [showManual, setShowManual] = useState(false);

    // AXIOMA: Si needs_setup = false (proveedor nativo), siempre está listo.
    // No hay nada que configurar. No hay botón de "vincular".
    const isNative = service?.raw?.needs_setup === false;
    const isReady  = isNative || service?.isReady;
    const activeColor = isReady ? 'var(--color-success)' : 'var(--color-warning)';

    if (!service) {
        return (
            <div className="indra-container p-3" style={{ opacity: 0.4 }}>
                <span className="font-mono" style={{ fontSize: '10px' }}>PROVIDER_NOT_DETECTED: {providerId}</span>
            </div>
        );
    }

    return (
        <div className="nexus-service-slot indra-container p-3"
             style={{ borderLeft: `3px solid ${activeColor}` }}>

            {/* Header del Slot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <IndraIcon name={service.icon || 'SERVICE'} size="18px" style={{ color: activeColor }} />
                    <div>
                        <div className="font-mono" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {label || service.label}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {isNative ? 'NATIVE_GAS_SESSION' : (isReady ? 'SYNC_ACTIVE' : 'CONFIGURATION_REQUIRED')}
                        </div>
                    </div>
                </div>

                {/* Indicador de estado */}
                {isReady ? (
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--color-success)',
                        boxShadow: '0 0 8px var(--color-success)'
                    }} />
                ) : (
                    /* Solo muestra botón MANUAL si el proveedor realmente requiere credenciales */
                    !isNative && !showManual && (
                        <button className="btn btn--xs btn--ghost" onClick={() => setShowManual(true)}>
                            CONFIGURAR
                        </button>
                    )
                )}
            </div>

            {/* Formulario manual — solo aparece si no es nativo y el usuario lo solicita */}
            {showManual && !isReady && !isNative && (
                <div style={{ marginTop: '12px' }} className="animate-fade-in">
                    <p style={{ fontSize: '10px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
                        {description || 'Introduce las credenciales para autorizar el acceso.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="password"
                            className="input-base"
                            style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                            placeholder="API_KEY / TOKEN"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                        />
                        <button className="btn btn--xs btn--accent" disabled={!apiKey}>
                            VINCULAR
                        </button>
                        <button className="btn btn--xs btn--ghost" onClick={() => setShowManual(false)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
