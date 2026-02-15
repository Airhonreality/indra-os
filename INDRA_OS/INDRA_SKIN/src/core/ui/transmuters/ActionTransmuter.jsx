import bridge from '../../kernel/SovereignBridge';

/**
 * ACTION TRANSMUTER
 * Dharma: Manifestar la voluntad del usuario (Ignición y Control).
 */
export const ActionTransmuter = ({ atom }) => {
    // Mapeo de Roles a Clases Axiom
    const classes = {
        ACTION_PRIMARY: "axiom-atom-btn axiom-atom-btn-primary",
        ACTION_SECONDARY: "axiom-atom-btn axiom-atom-btn-secondary",
        ACTION_DANGER: "axiom-atom-btn axiom-atom-btn-danger"
    };

    const handleClick = () => {
        if (atom.action_core) {
            console.log(`🚀 [ActionTransmuter] Ejecutando: ${atom.action_core}`);
            // El bridge debe implementar executeAction
            if (bridge.executeAction) {
                bridge.executeAction(atom.action_core, atom.data_params);
            }
        }
    };

    return (
        <button
            id={atom.id}
            className={classes[atom.role] || "axiom-atom-btn"}
            onClick={handleClick}
        >
            {atom.label}
        </button>
    );
};



