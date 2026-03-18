/**
 * =============================================================================
 * UTILIDAD: Crystallizer (Cristalizador)
 * RESPONSABILIDAD: Aduana de Sinceridad en el guardado de Documentos.
 * AXIOMA: Antes de salir del navegador, todo token debe ser resuelto 
 * a un estado persistente (Snapshot).
 * =============================================================================
 */

import { AxiomRegistry } from '../../../services/AxiomRegistry';

export const Crystallizer = {
    /**
     * Procesa una lista de bloques y cristaliza sus propiedades de estilo.
     */
    cristalizar(blocks) {
        if (!blocks) return [];
        return blocks.map(block => this._procesarBloque(block));
    },

    _procesarBloque(block) {
        const bloqueCristalizado = { ...block };

        if (bloqueCristalizado.props) {
            const nuevasProps = { ...bloqueCristalizado.props };
            
            // Iterar sobre las props buscando tokens de diseño
            Object.keys(nuevasProps).forEach(key => {
                const valor = nuevasProps[key];
                
                // Si la propiedad es un token (comienza con var), la cristalizamos
                if (typeof valor === 'string' && valor.includes('var(')) {
                    nuevasProps[key] = AxiomRegistry.cristalizar(valor);
                }
            });

            bloqueCristalizado.props = nuevasProps;
        }

        // Procesamiento recursivo de hijos
        if (bloqueCristalizado.children && bloqueCristalizado.children.length > 0) {
            bloqueCristalizado.children = bloqueCristalizado.children.map(child => this._procesarBloque(child));
        }

        return bloqueCristalizado;
    }
};
