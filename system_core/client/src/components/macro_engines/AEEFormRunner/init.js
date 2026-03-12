import { registry } from '../../../services/EngineRegistry';
import { AEEDashboard } from './AEE_Dashboard';

registry.register('AEE_RUNNER', AEEDashboard, {
    icon: 'PLAY',
    label: 'OPERATIONAL_RUNNER',
    color: 'var(--color-success)',
    canCreate: true,
    description: 'Proyección operativa de esquemas y captura de datos de negocio.',
});
