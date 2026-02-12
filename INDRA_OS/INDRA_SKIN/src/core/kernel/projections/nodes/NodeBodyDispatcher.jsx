import EmailNodeWidget from './EmailNodeWidget';
import FileNodeWidget from './FileNodeWidget';
import PDFNodeWidget from './PDFNodeWidget';
import DatabaseNodeWidget from './DatabaseNodeWidget';

/**
 * NodeBodyDispatcher (v10.5)
 * DHARMA: Director de Proyección de Artefactos.
 */
const NodeBodyDispatcher = ({ data, execute }) => {
    const { DOMAIN, schemaId, LABEL } = data;
    const extension = (LABEL && LABEL.includes('.')) ? LABEL.split('.').pop().toLowerCase() : '';

    // 1. Discriminación por Dominio (Semiótica Pura)
    if (DOMAIN === 'COMMUNICATION') {
        return <EmailNodeWidget data={data} execute={execute} />;
    }

    // 2. Discriminación por Arquetipo/Schema Especializado
    if (schemaId === 'PDF_NODE' || extension === 'pdf') {
        return <PDFNodeWidget data={data} execute={execute} />;
    }

    if (schemaId === 'FILE_NODE' || data.data?.type === 'FILE') {
        return <FileNodeWidget data={data} execute={execute} />;
    }

    if (schemaId === 'DATABASE_NODE' || data.ARCHETYPE === 'DATABASE' || DOMAIN === 'DATA_ENGINE' || data.data?.type === 'DATABASE') {
        return <DatabaseNodeWidget data={data} execute={execute} />;
    }

    // 3. Fallback: El Núcleo de Energía (Efecto decorativo por defecto)
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 animate-spin-slow"></div>
        </div>
    );
};

export default NodeBodyDispatcher;
