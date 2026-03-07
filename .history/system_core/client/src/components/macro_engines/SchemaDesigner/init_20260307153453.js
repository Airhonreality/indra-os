import { registry } from '../../services/EngineRegistry';
import { SchemaDesigner } from './index';

registry.register('DATA_SCHEMA', SchemaDesigner);
