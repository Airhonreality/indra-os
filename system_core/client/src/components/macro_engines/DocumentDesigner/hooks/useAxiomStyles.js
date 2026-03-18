/**
 * =============================================================================
 * HOOK: useAxiomStyles (Estilos Axiomáticos)
 * RESPONSABILIDAD: Hidratar propiedades en tiempo real (Página Vivo).
 * AXIOMA: Si el vínculo vivo existe en la realidad, se prefiere al snapshot.
 * =============================================================================
 */

import { useMemo } from 'react';
import { AxiomRegistry } from '../../../../services/AxiomRegistry';

export function useAxiomStyles(props = {}) {
    // Resolvemos el objeto de propiedades hidratadas
    const propsHidratadas = useMemo(() => {
        const resultado = { ...props };
        
        Object.keys(resultado).forEach(key => {
            const valor = resultado[key];
            
            // Si es un objeto de cristalización { _vinc, _snap }, lo hidratamos
            if (valor && typeof valor === 'object' && valor._vinc) {
                resultado[key] = AxiomRegistry.hidratar(valor);
            }
        });
        
        return resultado;
    }, [props]);

    // Detectamos si hay alguna discrepancia con la marca actual (Deriva)
    const tieneDeriva = useMemo(() => AxiomRegistry.detectarDeriva(props), [props]);

    return { propsHidratadas, tieneDeriva };
}
