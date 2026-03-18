/**
 * =============================================================================
 * INIT: DiagnosticHub
 * RESPONSABILIDAD: Registro del motor en el EngineRegistry.
 * =============================================================================
 */

import { registry } from '../../../services/EngineRegistry';
import { DiagnosticHub } from './index';

registry.register('DIAGNOSTIC_HUB', DiagnosticHub, {
    icon: 'TERMINAL',
    label: 'DIAGNOSTIC_HUB',
    color: '#00f5d4', // Color acento (Cian neón)
    canCreate: false,
    description: 'Consola de realidad para monitoreo, auditoría y depuración transversal del núcleo.',
});
