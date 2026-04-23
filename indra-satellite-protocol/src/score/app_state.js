import { IndraStateEngine } from '../../_INDRA_PROTOCOL_/core/bridge_modules/IndraStateEngine.js';

class AppState extends IndraStateEngine {
    constructor() {
        // DEFINICIÓN DEL ESTADO SOBERANO
        const initialState = {
            _persistent: ['atoms', 'collections'], // Áreas que se guardarán en el Vault automáticamente
            atoms: {},        
            collections: {},  
            pendingSyncs: new Set(), 
            ui: {             
                isLoading: false,
                activeModal: null,
                currentSlice: null
            }
        };

        // El Bridge inyectará el Vault aquí durante la ignición si es necesario
        super(initialState, null); 
    }

    /**
     * @dharma Inyección diferida del motor de memoria.
     */
    linkVault(vault) {
        this.vault = vault;
        this._hydrate();
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
        
        // Feedback visual automático
        const element = document.querySelector(`[data-id="${atomId}"]`);
        if (element) {
            element.setAttribute('data-resonance', isSyncing ? 'active' : 'idle');
        }
    }
}

export const appState = new AppState();
