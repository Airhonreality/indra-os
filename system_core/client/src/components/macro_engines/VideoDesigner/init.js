import { registry } from '../../../services/EngineRegistry';
import { VideoDesigner } from './VideoDesigner.jsx';

/**
 * Registro dinámico del motor de Edición de Video (Axioma de Descubrimiento).
 * Esto permite que ActionRail y AtomGrid sepan qué componente levantar
 * cuando se topan con un átomo `VIDEO_PROJECT`.
 */
registry.registerWithManifest('VIDEO_PROJECT', VideoDesigner, {
    icon: 'PLAY',
    label: 'Video Project',
    color: '#8B5CF6',
    canCreate: true,
    description: 'Motor local de edición paramétrica de video con aceleración WebGPU.'
});
