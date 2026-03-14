import { registry } from '../../../services/EngineRegistry';
import { WorkflowDesigner } from './index';

export const WORKFLOW_DESIGN_MANIFEST = {
    id: 'WORKFLOW_DESIGNER',
    name: 'WORKFLOW_DESIGNER',
    icon: 'TERMINAL',
    color: '#FF9F43',
    description: 'Orquestación de protocolos y lógica de negocio distribuida.'
};

registry.register('WORKFLOW', WorkflowDesigner);
