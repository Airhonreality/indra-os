/**
 * =============================================================================
 * LIBRERÍA: IndraPrintEngine.js
 * RESPONSABILIDAD: Puente para la generación de PDF Vectorial Alta Fidelidad.
 * AXIOMAS:
 *   - Independence: El Backend no modela UI para reportes, el Frontend usa @media print.
 *   - Information: Usa el DOM renderizado (React) sin librerías pesadas (jspdf).
 * =============================================================================
 */

export class IndraPrintEngine {
    
    /**
     * Activa el print-CSS con la configuración óptima para diagramas vectoriales.
     * @param {string} containerId - Elemento opcional para aislar impresión. 
     *                               Si nulo, asume que el root maneja la clase print-mode.
     * @param {string} orientation - 'portrait' o 'landscape'
     */
    static printDocument(containerId = null, orientation = 'portrait') {
        const resetStyle = this._injectPrintStyles(orientation);

        // Disparo asíncrono para permitir al DOM repintar los print-styles si fuera necesario
        setTimeout(() => {
            window.print();
            
            // Limpieza (Sinceridad de Estado)
            setTimeout(() => {
                resetStyle();
            }, 500);
        }, 300);
    }

    /**
     * Inyecta reglas Print-CSS a fuego en tiempo de ejecución
     */
    static _injectPrintStyles(orientation) {
        const style = document.createElement('style');
        style.setAttribute('data-indra-print', 'true');
        // Obliga opciones de impresión de alta resolución. 
        // En Chrome/Edge: Activa color-adjust exacto y remueve márgenes de navegador.
        style.textContent = `
            @page {
                size: A4 ${orientation};
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                /* Hide everything except print-container */
                .no-print, header, nav, .macro-header {
                    display: none !important;
                }
            }
        `;

        document.head.appendChild(style);

        return () => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }
}
