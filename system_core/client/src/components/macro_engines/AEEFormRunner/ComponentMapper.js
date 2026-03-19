import { GenericInput } from './widgets/GenericInput';
import { ImageUploader } from './widgets/ImageUploader';
import { DatePickerWidget } from './widgets/DatePickerWidget';
import { SelectWidget } from './widgets/SelectWidget';
import { CurrencyWidget } from './widgets/CurrencyWidget';
import { FileAttachmentWidget } from './widgets/FileAttachmentWidget';

/**
 * Mapeo de Tipos Semánticos a Componentes de UI.
 * Sigue el Axioma de Independencia (Suh): Decoupling FR-DP.
 */
export const COMPONENT_MAP = {
    'TEXT': GenericInput,
    'NUMBER': GenericInput,
    'LONG_TEXT': GenericInput,
    'DATE': DatePickerWidget,
    'SELECT': SelectWidget,
    'RELATION_SELECT': SelectWidget,
    'IMAGE': ImageUploader,          // Solo imágenes — preview visual
    'FILE_ATTACHMENT': FileAttachmentWidget, // Cualquier binario (SKP, CDR, PDF...) — ADR-023
    'CURRENCY': CurrencyWidget,
    'FILE': FileAttachmentWidget,    // Alias legacy → FileAttachmentWidget
    'DEFAULT': GenericInput
};

/**
 * Resuelve el componente correcto basado en el esquema del nodo.
 */
export function getComponentForNode(field) {
    const type = field.type?.toUpperCase();
    return COMPONENT_MAP[type] || COMPONENT_MAP['DEFAULT'];
}
