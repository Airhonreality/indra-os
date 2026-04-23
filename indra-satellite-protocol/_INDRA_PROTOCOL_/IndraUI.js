/**
 * =============================================================================
 * INDRA UI REGISTRY (Dynamic Catalog v1.0)
 * =============================================================================
 * Design Pattern: Lazy Loading / Factory.
 * Axiomatic Principle: Information Hiding & Independence.
 * Responsibility: Export UI components on-demand to keep the satellite light.
 * =============================================================================
 */

export const UI = {
    /**
     * Get the Agnostic Form Rendering Engine.
     * @returns {Promise<FormGenerator>}
     */
    getFormGenerator: async () => {
        const module = await import('./ui/engines/FormGenerator.js');
        return module.FormGenerator;
    },

    /**
     * Get the Schema Explorer (Composite Component).
     * @returns {Promise<SchemaExplorer>}
     */
    getSchemaExplorer: async () => {
        const module = await import('./ui/components/SchemaExplorer.js');
        return module.SchemaExplorer;
    },

    /**
     * Get the Workspace Controller (Nexus Manager).
     * @returns {Promise<WorkspaceController>}
     */
    getWorkspaceController: async () => {
        const module = await import('./ui/components/WorkspaceController.js');
        return module.WorkspaceController;
    }
};
