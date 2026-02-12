import bridge from '../../kernel/SovereignBridge';

/**
 * ACTION TRANSMUTER
 * Dharma: Manifestar la voluntad del usuario (Ignición y Control).
 */
export const ActionTransmuter = ({ atom }) => {
    // Mapeo de Roles a Clases Stark
    const classes = {
        ACTION_PRIMARY: "stark-atom-btn stark-atom-btn-primary",
        ACTION_SECONDARY: "stark-atom-btn stark-atom-btn-secondary",
        ACTION_DANGER: "stark-atom-btn stark-atom-btn-danger"
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
            className={classes[atom.role] || "stark-atom-btn"}
            onClick={handleClick}
        >
            {atom.label}
        </button>
    );
};
