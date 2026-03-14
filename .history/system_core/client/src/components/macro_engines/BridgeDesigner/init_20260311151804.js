import { registry } from '../../../services/EngineRegistry';
import { BridgeDesigner } from './index';

registry.register('BRIDGE', BridgeDesigner, {
    icon: 'BRIDGE',
    label: 'LOGIC_BRIDGE',
    color: 'var(--color-cold)',
    canCreate: true,
    description: 'Pipeline de transformación lógica de datos.',
});
