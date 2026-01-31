/**
 * 🔒 VaultManager.js
 * Manages secure runtime configuration for the Skin.
 * Replaces build-time .env hardcoding.
 */

const VAULT_KEY = 'ORBITAL_VAULT_V1';
const TOKEN_KEY = 'ORBITAL_TOKENS_V1';

export const VaultManager = {
    /**
     * Stores core configuration (Public API endpoint, etc.)
     */
    setConfig(config) {
        if (!config.deploymentUrl) throw new Error("Vault: deploymentUrl required");
        const payload = JSON.stringify({ ...config, timestamp: new Date().toISOString() });
        localStorage.setItem(VAULT_KEY, btoa(encodeURIComponent(payload)));
    },

    getConfig() {
        const secured = localStorage.getItem(VAULT_KEY);
        if (!secured) return null;
        try {
            return JSON.parse(decodeURIComponent(atob(secured)));
        } catch (e) {
            localStorage.removeItem(VAULT_KEY);
            return null;
        }
    },

    /**
     * Sovereign Token Management (MCEP Compliance)
     */
    setToken(provider, tokenData) {
        const tokens = this.getAllTokens();
        tokens[provider] = {
            ...tokenData,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(TOKEN_KEY, btoa(encodeURIComponent(JSON.stringify(tokens))));
    },

    deleteToken(provider) {
        const tokens = this.getAllTokens();
        if (tokens[provider]) {
            delete tokens[provider];
            localStorage.setItem(TOKEN_KEY, btoa(encodeURIComponent(JSON.stringify(tokens))));
            return true;
        }
        return false;
    },

    getToken(provider) {
        return this.getAllTokens()[provider] || null;
    },

    getAllTokens() {
        const secured = localStorage.getItem(TOKEN_KEY);
        if (!secured) return {};
        try {
            const decoded = decodeURIComponent(atob(secured));
            return JSON.parse(decoded);
        } catch (e) {
            console.error("Vault: Token Recovery Failure", e);
            return {};
        }
    },

    isConfigured() {
        return !!this.getConfig();
    },

    clear() {
        localStorage.removeItem(VAULT_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }
};
