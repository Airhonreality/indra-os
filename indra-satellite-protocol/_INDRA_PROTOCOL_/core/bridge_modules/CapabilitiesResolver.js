/**
 * =============================================================================
 * INDRA CAPABILITIES RESOLVER (The Oracle v1.0)
 * =============================================================================
 * Responsabilidad: Eliminar el hardcode del Satélite resolviendo nombres de
 * clases, protocolos y proveedores directamente desde el Manifest del Core.
 */

export class CapabilitiesResolver {
    constructor(bridge) {
        this.bridge = bridge;
        this._manifest = null;
    }

    /**
     * Sincroniza el manifiesto de capacidades desde el Core.
     */
    async sync() {
        try {
            // Unidireccionalidad: Solo el sistema puede dar el manifiesto
            const response = await this.bridge.execute({
                protocol: 'SYSTEM_MANIFEST',
                provider: 'system'
            });
            if (response.metadata?.status === 'OK' && response.items?.[0]) {
                this._manifest = response.items[0];
                return true;
            }
            return false;
        } catch (e) {
            console.warn("⚠️ [Oracle] No se pudo sincronizar manifiesto. Usando fallbacks seguros.");
            return false;
        }
    }

    /**
     * Resuelve el proveedor preferido para una clase de átomo.
     */
    getPreferredProvider(className) {
        if (!this._manifest) return 'system'; // Fallback seguro
        // Buscar en la configuración del nexo si hay mapeos de clase específicos
        const mapping = this._manifest.payload?.class_mappings?.[className];
        return mapping || 'system';
    }

    /**
     * Resuelve la clase de esquema canónica.
     */
    getSchemaClass() {
        return 'DATA_SCHEMA'; // Valor constante en el ecosistema Indra
    }

    /**
     * Verifica si el Core soporta un protocolo específico.
     */
    supportsProtocol(protocol) {
        if (!this._manifest) return true; // Asumimos soporte en modo ciego
        return this._manifest.payload?.protocols?.includes(protocol);
    }
}
