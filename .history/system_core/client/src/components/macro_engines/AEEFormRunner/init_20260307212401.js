import { registry } from '../../../services/EngineRegistry';
import { AEEDashboard } from './AEE_Dashboard';

export const AEE_FORM_RUNNER_MANIFEST = {
    id: 'AEE_FORM_RUNNER',
    name: 'OPERATIONAL_RUNNER',
    icon: 'PLAY',
    color: '#00D2D3',
    description: 'Proyección operativa de esquemas y captura de datos de negocio.'
};

registry.register('AEE_RUNNER', AEEDashboard);
