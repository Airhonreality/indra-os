import { registry } from '../../../services/EngineRegistry';
import { DocumentDesigner } from './index';

registry.register('DOCUMENT', DocumentDesigner, {
    icon: 'DOCUMENT',
    label: 'DOCUMENT_DESIGNER',
    color: 'var(--color-warm)',
    canCreate: true,
    description: 'Editor de plantillas de documento con bloques.',
});
