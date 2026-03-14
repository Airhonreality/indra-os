import { registry } from '../../../services/EngineRegistry';
import { SchemaDesigner } from './index';

registry.register('DATA_SCHEMA', SchemaDesigner, {
    icon: 'SCHEMA',
    label: 'DATA_SCHEMA',
    color: 'var(--color-accent)',
    canCreate: true,
    description: 'Diseñador de esquemas de datos estructurados.',
});
