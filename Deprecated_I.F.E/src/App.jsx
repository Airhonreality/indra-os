import React, { useState, useEffect } from 'react';
import useCoreStore from './core/state/CoreStore';
import ConnectionPanel from './presentation/ConnectionPanel';
import { validateConfig } from './core/integrity/ConfigValidator';
import { resolver } from './core/bridge/SchemaResolver';
import { VaultManager } from './core/vault/VaultManager';
import UniversalRenderer from './presentation/Shell/UniversalRenderer';

/**
 * 🛰️ INDRA SOVEREIGN CONSOLE (V5.5 Purified)
 * Root Bootloader.
 */
const App = () => {
    const { status, setStatus, safeModeActive, session, coreUrl, setContracts, setLaws, bootCompleted, setBootCompleted } = useCoreStore();
    const [configStatus, setConfigStatus] = useState(null);
    const activeTheme = session?.theme || 'theme-obsidian';

    useEffect(() => {
        if (bootCompleted) {
            console.log("[BOOT] Already booted. Skipping.");
            return;
        }

        console.log("[BOOT] App mounted. Status:", status);
        setConfigStatus(validateConfig());

        const bootHandshake = async () => {
            console.log("[BOOT] Running bootHandshake...");

            let config = null;
            try {
                config = VaultManager.getConfig();
            } catch (e) {
                console.error("[BOOT] Vault Error:", e);
            }

            const url = config?.deploymentUrl || coreUrl;
            console.log("[BOOT] Resolved URL:", url);

            if (url && (status === 'disconnected' || status === 'unknown' || !status)) {
                console.log("[BOOT] Imperative Re-handshake starting...");
                setStatus('negotiating');

                try {
                    const { discoverCore, default: CoreBridge } = await import('./core/bridge/CoreBridge');
                    console.log("[BOOT] Bridge imported. Discovering...");

                    const health = await discoverCore(url, config?.sessionToken);
                    console.log("[BOOT] Core discovered:", health.status);

                    const lawsResult = await CoreBridge.callCore('public', 'getSovereignLaws');
                    if (lawsResult?.laws) {
                        setLaws(lawsResult.laws);
                        console.log("[BOOT] Laws re-infused.");
                    }

                    const result = await CoreBridge.callAction('getSystemContracts');
                    if (result) {
                        setContracts(result);
                        await resolver.loadSystemContext();
                        setStatus('synchronized');
                        setBootCompleted(true);
                        console.log("[BOOT] Ready.");
                    }
                } catch (e) {
                    console.error("[BOOT] Handshake Fail:", e);
                    setStatus('disconnected');
                }
            } else if (status === 'synchronized' && !resolver.isLoaded) {
                console.log("[BOOT] Librarian recover...");
                await resolver.loadSystemContext();
            }
        };

        bootHandshake();
    }, []);

    // GATEWAY logic
    if (status !== 'synchronized') {
        let hasVault = false;
        try {
            hasVault = !!VaultManager.getConfig()?.deploymentUrl;
        } catch (e) { }

        if (hasVault || status === 'negotiating') {
            return (
                <div className={`stage-gateway ${activeTheme}`}>
                    <div className="gateway-card text-center mono" style={{ opacity: 0.8 }}>
                        <div className="mb-4 text-xs tracking-widest text-accent-primary">[ RECONSTRUCTING_REALITY ]</div>
                        <div className="pulsing-text text-[10px] opacity-50 uppercase">Sensing Sovereign Law...</div>
                        <div className="mt-8 h-[1px] w-full bg-border-dim overflow-hidden">
                            <div className="h-full bg-accent-primary progress-bar-active" />
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`stage-gateway ${activeTheme}`}>
                <div className="gateway-card">
                    <h2 className="mono-bold mb-6 border-b pb-2">GATEWAY_INIT</h2>
                    <ConnectionPanel mode="GATEWAY" />
                    {configStatus?.warnings.map((w, i) => (
                        <div key={i} className="mt-4 text-[10px] text-accent-warning mono uppercase">
                            [!] {w}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={activeTheme}>
            {safeModeActive && (
                <div className="safe-mode-banner pulsing-red fixed top-0 w-full z-[1000] h-6 flex items-center justify-center">
                    <span className="mono-bold text-[10px]">DANGER: SYSTEM IN SAFE MODE [HALTS_BYPASSED]</span>
                </div>
            )}
            <UniversalRenderer />
        </div>
    );
};

export default App;
