import { registry } from '../../../services/EngineRegistry';
import { CalendarEngine } from './index';

/**
 * MANIFIESTO CALENDAR_ENGINE
 * Define las capacidades de visualización y gestión temporal.
 */
export const CALENDAR_MANIFEST = {
    id: 'CALENDAR_ENGINE',
    label: 'UNIVERSAL_CALENDAR',
    icon: 'CALENDAR',
    color: 'var(--color-accent-blue)', // Azul neutro indra
    description: 'Gestión multirrealidad de eventos y sincronización de silos.',
    canCreate: true
};

// Registro automático en el núcleo del frontend
registry.register('CALENDAR_HIVE', CalendarEngine, CALENDAR_MANIFEST); 
registry.register('CALENDAR_EVENT', CalendarEngine);

