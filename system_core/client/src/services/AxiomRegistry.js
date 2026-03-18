/**
 * =============================================================================
 * SERVICIO: RegistroAxioma (AxiomRegistry)
 * RESPONSABILIDAD: Gestión centralizada de tokens de diseño atómicos.
 * AXIOMA: Un token es un vínculo vivo con la marca, pero un snapshot físico
 * de soberanía para el documento. (Modelo Figma).
 * =============================================================================
 */

export const AxiomRegistry = {
    tokens: {},

    /**
     * Inicializa el registro con los tokens descubiertos en el DOM.
     */
    inicializar(discoveredTokens) {
        this.tokens = { ...discoveredTokens };
        console.log("[RegistroAxioma] Inicializado con", Object.keys(this.tokens).length, "tokens.");
    },

    /**
     * Resuelve un valor (sea un token o un literal) a su valor físico actual.
     */
    resolver(valor) {
        if (typeof valor === 'string' && valor.includes('var(')) {
            // Extraer el nombre de la variable: var(--color) -> --color
            const match = valor.match(/var\(([^)]+)\)/);
            const tokenName = match ? match[1] : valor;
            return this.tokens[tokenName] || valor;
        }
        return valor;
    },

    /**
     * Transforma un valor en un objeto de persistencia soberano.
     * Guarda la referencia viva y un snapshot del valor actual.
     */
    cristalizar(valor) {
        if (typeof valor === 'string' && valor.includes('var(')) {
            return {
                _vinc: valor, // Referencia viva (vínculo)
                _snap: this.resolver(valor) // Snapshot físico (soberanía)
            };
        }
        return valor;
    },

    /**
     * Inverso de cristalización: decide qué valor usar al cargar.
     */
    hidratar(valorPersistido) {
        if (valorPersistido && typeof valorPersistido === 'object' && valorPersistido._vinc) {
            const valorVivoActual = this.resolver(valorPersistido._vinc);
            
            // Si el valor vivo es distinto al snapshot, hay una "Deriva de Realidad"
            // Por defecto seguimos el Vínculo Vivo si existe.
            return valorVivoActual || valorPersistido._snap;
        }
        return valorPersistido;
    },

    /**
     * Detecta si un bloque completo tiene discrepancias con la realidad actual.
     */
    detectarDeriva(props) {
        return Object.values(props).some(v => 
            v && typeof v === 'object' && v._vinc && this.resolver(v._vinc) !== v._snap
        );
    }
};
