/**
 * c:\Users\javir\Documents\DEVs\INDRA FRONT END\INDRA_OS\INDRA_SKIN\src\core\StarkProjector.jsx
 * ⚡ STARK PROJECTOR (Indra OS Stark v8.0)
 * DHARMA: Renderizado ultra-directo de realidades canonizadas.
 */

import React, { Suspense } from 'react';
import { resolveCanonComponent } from './Indra_Canon_Registry';

/**
 * El StarkProjector es el único punto de entrada visual para los datos del Core.
 * No pregunta "quién" envió el dato, sino "qué canon" habla.
 */
const StarkProjector = ({ data, slot }) => {
    if (!data) return null;

    // Detectar el canon (prioridad absoluta a la soberanía semántica)
    const canonId = data.indra_canon || data.canon || (Array.isArray(data) ? 'Collection' : 'DEFAULT');

    const Component = resolveCanonComponent(canonId);

    return (
        <div className={`stark-projection-wrapper slot-${slot}`}>
            <Suspense fallback={<div className="stark-loading">Igniting Projection...</div>}>
                <Component data={data} slot={slot} />
            </Suspense>
        </div>
    );
};

export default StarkProjector;
