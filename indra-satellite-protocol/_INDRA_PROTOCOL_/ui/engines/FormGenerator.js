/**
 * =============================================================================
 * INDRA FORM GENERATOR (Agnostic Rendering Engine v1.1)
 * =============================================================================
 * Responsabilidad: Dibujar formularios dinámicos basados en esquemas (ADN).
 * Diseño Axiomático: No contiene estilos, solo estructura semántica.
 * =============================================================================
 */

export class FormGenerator {
    /**
     * Renderiza un esquema en un contenedor.
     * @param {Object} schema - El ADN del formulario.
     * @param {HTMLElement} container - Donde se inyectará.
     * @param {Object} options - Callbacks (onChange, onSubmit).
     */
    static render(schema, container, options = {}) {
        if (!container) return;
        container.innerHTML = '';
        
        const form = document.createElement('div');
        form.className = 'indra-form-container';
        
        // Soporte para esquemas anidados (axioma de flexibilidad)
        const fields = schema.fields || schema.items || schema.payload?.fields || [];
        const initialData = options.initialData || {};
        
        fields.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'indra-field-group';
            wrapper.style.marginBottom = '15px';
            
            const label = document.createElement('label');
            label.className = 'indra-label';
            label.innerText = field.label || field.id;
            label.style.display = 'block'; label.style.fontSize = '10px'; label.style.marginBottom = '5px'; label.style.opacity = '0.7';
            
            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                (field.options || []).forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.id || opt;
                    o.innerText = opt.label || opt;
                    input.appendChild(o);
                });
            } else {
                input = document.createElement('input');
                // Soporte para password y otros tipos nativos
                input.type = (field.type || 'text').toLowerCase();
            }
            
            input.id = `input-${field.id}`;
            input.className = 'indra-input';
            
            // Prioridad: initialData > field.value > empty
            input.value = initialData[field.id] || field.value || '';
            input.placeholder = field.placeholder || '';
            
            input.style = "width: 100%; padding: 10px; box-sizing: border-box; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; font-family: inherit; font-size: 13px;";
            
            if (options.onChange) {
                input.oninput = (e) => options.onChange(field.id, e.target.value);
            }
            
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            form.appendChild(wrapper);
        });
        
        container.appendChild(form);
    }
}
