/**
 * ARTEFACTO: app_state.js
 * CAPA: Lógica de Negocio (Soberanía) / Proxy Reactivo
 * AXIOMA APLICADO: Espejo de Materia (Desacople Peristáltico)
 *
 * RESPONSABILIDAD:
 * Constituye la única fuente de verdad local para la UI.
 * Mantiene un espejo en memoria de los átomos cristalizados en el Core,
 * usando un Proxy para notificar a los componentes visuales automáticamente.
 */

class AppState {
    constructor() {
        this.listeners = new Map();
        
        // Proxy para interceptar cambios y notificar a la UI
        this.state = new Proxy({
            atoms: {},        // { atom_id: { ...atom_data } }
            collections: {},  // { schema_alias: [ atom_id_1, atom_id_2 ] }
            pendingSyncs: new Set(), // Nivel de Granularidad: IDs de átomos viajando por la red
            ui: {             // Estado efímero de la UI
                isLoading: false,
                activeModal: null,
                currentSlice: null
            }
        }, {
            set: (target, prop, value) => {
                target[prop] = value;
                this.notify(prop);
                return true;
            }
        });
    }

    /**
     * @dharma Suscribe un componente a una rama del estado.
     */
    subscribe(prop, callback) {
        if (!this.listeners.has(prop)) {
            this.listeners.set(prop, new Set());
        }
        this.listeners.get(prop).add(callback);
        
        // Retorna función para desuscribirse
        return () => this.listeners.get(prop).delete(callback);
    }

    /**
     * @dharma Notifica a los observadores cuando la materia cambia.
     */
    notify(prop) {
        if (this.listeners.has(prop)) {
            this.listeners.get(prop).forEach(callback => callback(this.state[prop]));
        }
        // Listener global
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => callback(prop, this.state[prop]));
        }
    }

    /**
     * @dharma Actualiza el espejo local combinando la respuesta del Core.
     */
    resonateWithCore(items, schemaAlias) {
        if (!items || !Array.isArray(items)) return;

        const newAtoms = { ...this.state.atoms };
        const newCollection = [];

        items.forEach(atom => {
            if (atom && atom.id) {
                newAtoms[atom.id] = atom;
                newCollection.push(atom.id);
            }
        });

        this.state.atoms = newAtoms;
        
        if (schemaAlias) {
            this.state.collections = {
                ...this.state.collections,
                [schemaAlias]: newCollection
            };
        }
    }

    /**
     * @dharma Controla el estado de Resonancia Individual (Loading granular).
     */
    setAtomSyncing(atomId, isSyncing) {
        const newSyncs = new Set(this.state.pendingSyncs);
        if (isSyncing) {
            newSyncs.add(atomId);
        } else {
            newSyncs.delete(atomId);
        }
        this.state.pendingSyncs = newSyncs;
        
        // Magia Peristáltica: Inyección directa al DOM para feedback visual automático
        const element = document.querySelector(`[data-id="${atomId}"]`);
        if (element) {
            element.setAttribute('data-resonance', isSyncing ? 'active' : 'idle');
        }
    }
}

export const appState = new AppState();
