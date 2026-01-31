import React, { useState, useEffect } from 'react';
import useCoreStore from '../core/state/CoreStore';
import CoreBridge, { discoverCore } from '../core/bridge/CoreBridge';
import { VaultManager } from '../core/vault/VaultManager';
import { getBackendUrl } from '../core/integrity/ConfigValidator';
import { Network, LogOut } from 'lucide-react';
import NanoForm from './NanoForm';
import { resolver } from '../core/bridge/SchemaResolver';

/**
 * 📡 ConnectionPanel: Dual-Mode Access Controller
 * Axiom: Conditional Visibility. Full control when needed, minimal when operational.
 */

const CONNECTION_SCHEMA = {
    deploymentUrl: {
        label: 'Core_Endpoint',
        type: 'url',
        placeholder: 'https://script.google.com/...',
        required: true
    },
    masterKey: {
        label: 'Master_Key',
        type: 'password',
        placeholder: 'INDRA-KEY-****************',
        required: false
    }
};

const ConnectionPanel = ({ mode = "STATUS" }) => {
    const { status, setStatus, setContracts, coreUrl, setCoreUrl, setSafeMode, setLaws } = useCoreStore();
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        deploymentUrl: '',
        masterKey: ''
    });

    useEffect(() => {
        const config = VaultManager.getConfig();
        setFormData(prev => ({
            ...prev,
            deploymentUrl: config?.deploymentUrl || coreUrl || getBackendUrl() || ''
        }));
    }, [coreUrl]);

    const handleFieldChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const doConnect = async () => {
        const { deploymentUrl, masterKey } = formData;
        setError(null);
        setStatus('negotiating');

        try {
            const health = await discoverCore(deploymentUrl, masterKey);

            // 1. Fetch System Health (includes Safe Mode flag)
            const healthResult = await CoreBridge.callCore('public', 'getSystemStatus');
            if (healthResult) {
                setSafeMode(healthResult.safeModeActive || false);
            }

            // 2. Fetch Sovereign Laws (MasterLaw)
            const lawsResult = await CoreBridge.callCore('public', 'getSovereignLaws');
            if (lawsResult && lawsResult.laws) {
                setLaws(lawsResult.laws);
            }

            // 3. Fetch Contracts
            const result = await CoreBridge.callAction('getSystemContracts');
            if (result) {
                setContracts(result);

                // 4. Synchronize Librarian (SchemaResolver)
                await resolver.loadSystemContext();

                setCoreUrl(deploymentUrl);
                setStatus('synchronized');
            }
        } catch (e) {
            setError(e.message);
            setStatus('disconnected');
        }
    };

    const doDisconnect = () => {
        VaultManager.clear();
        setCoreUrl('');
        setStatus('disconnected');
        window.location.reload(); // Force hard reset
    };

    // --- RENDER: STATUS MODE (Operational Header) ---
    if (mode === "STATUS") {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Network size={14} color="var(--accent-success)" />
                    <span className="mono" style={{ fontSize: '10px', fontWeight: 900 }}>v1.0.0_READY</span>
                </div>
                <button
                    onClick={doDisconnect}
                    className="mono"
                    style={{ padding: '2px 8px', fontSize: '9px', background: 'transparent' }}
                >
                    <LogOut size={10} /> DISCONNECT
                </button>
            </div>
        );
    }

    // --- RENDER: GATEWAY MODE (Bootstrap Stage) ---
    return (
        <div className="connection-gateway">
            {error && (
                <div className="code-block" style={{ color: 'var(--accent-error)', borderColor: 'var(--accent-error)', marginBottom: 'var(--space-md)' }}>
                    [AUTH_FAIL] {error}
                </div>
            )}

            <NanoForm
                schema={CONNECTION_SCHEMA}
                data={formData}
                onChange={handleFieldChange}
                onSubmit={doConnect}
                submitLabel={status === 'negotiating' ? 'HANDSHAKING...' : 'INITIATE_SATELLITE_LINK'}
                disabled={status === 'negotiating'}
            />

            <div className="mono" style={{ marginTop: 'var(--space-lg)', fontSize: '9px', opacity: 0.5, textAlign: 'center' }}>
                AXIOM: SOVEREIGN_ACCESS_PROTOCOL_V4
            </div>
        </div>
    );
};

export default ConnectionPanel;
