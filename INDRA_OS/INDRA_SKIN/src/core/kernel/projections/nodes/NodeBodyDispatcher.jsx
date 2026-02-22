import CommunicationNodeWidget from './CommunicationNodeWidget.jsx';
import FileNodeWidget from './FileNodeWidget.jsx';
import PDFNodeWidget from './PDFNodeWidget.jsx';
import DatabaseNodeWidget from './DatabaseNodeWidget.jsx';
import SlotNodeWidget from './SlotNodeWidget.jsx';

/**
 * NodeBodyDispatcher (v14.0 - Contract Driven)
 * DHARMA: Director de Proyección Basado Estrictamente en Rasgos y Capacidades (ADR-022).
 * 
 * PURGADO: No más heurística de extensiones, no más nombres de esquema hardcodeados.
 * El backend debe emitir CAPABILITIES y TRAITS coherentes.
 */
const NodeBodyDispatcher = ({ data, execute }) => {
    const { CAPABILITIES = {}, traits = [] } = data;

    const capIds = Object.values(CAPABILITIES).map(c => typeof c === 'object' ? c.id : c);

    // 1. CAPACIDAD DE PROYECCIÓN / COMPOSICIÓN
    if (capIds.includes('RECEIVE') || capIds.includes('PROJECTION') || traits.includes('COMPOSITOR') || traits.includes('SLOT')) {
        return <SlotNodeWidget data={data} execute={execute} />;
    }

    // 2. CAPACIDAD DE DATOS ESTRUCTURADOS (Bases de Datos / Grillas)
    const arch = String(data.ARCHETYPE || data.archetype || '').toUpperCase();
    if (capIds.includes('DATA_STREAM') || traits.includes('DATABASE') || traits.includes('GRID') || arch === 'DATABASE') {
        return <DatabaseNodeWidget data={data} execute={execute} />;
    }

    // 3. CAPACIDAD DE COMUNICACIÓN
    if (capIds.includes('SEND_REPLY') || capIds.includes('SEND_MESSAGE') || traits.includes('COMMUNICATION')) {
        return <CommunicationNodeWidget data={data} execute={execute} />;
    }

    // 4. CAPACIDAD DE LECTURA DE DOCUMENTOS / PDF
    if (capIds.includes('READ_PAGE') || traits.includes('DOCUMENT') || traits.includes('PDF')) {
        return <PDFNodeWidget data={data} execute={execute} />;
    }

    // 5. CAPACIDAD DE ARCHIVO / NAVEGACIÓN DE DIRECTORIO
    if (capIds.includes('LIST_FILES') || capIds.includes('BROWSE') || traits.includes('VAULT') || traits.includes('FILE_SYSTEM')) {
        return <FileNodeWidget data={data} execute={execute} />;
    }

    // Fallback: Modo "Core Energético" (Procesamiento puro sin Widget especializado)
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-12 h-12 rounded-full border border-dashed border-[var(--accent)]/40 animate-spin-slow" />
        </div>
    );
};

export default NodeBodyDispatcher;
