import { registry } from '../../../services/EngineRegistry';
import { WorkflowDesigner } from './index';

registry.register('WORKFLOW', WorkflowDesigner, {
    icon: 'WORKFLOW',
    label: 'WORKFLOW_DESIGNER',
    color: '#ff007c',
    canCreate: true,
    description: 'Orquestación de protocolos y lógica de negocio distribuida.',
});
