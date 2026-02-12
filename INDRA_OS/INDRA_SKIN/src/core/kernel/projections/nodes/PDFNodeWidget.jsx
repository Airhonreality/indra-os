import React from 'react';

/**
 * PDFNodeWidget (v10.5)
 * DHARMA: Proyección de Documentos Técnicos.
 * Semiótica: "Lectura", "Contenido", "Referencia".
 */
const PDFNodeWidget = ({ data, execute }) => {
    const { label, data: fileData = {} } = data;
    const hasThumbnail = !!fileData.thumbnailLink;

    return (
        <div className="flex flex-col gap-2 p-1">
            {/* Vista Previa de Miniatura */}
            <div className="relative w-full h-24 bg-black/40 rounded border border-white/10 overflow-hidden flex items-center justify-center">
                {hasThumbnail ? (
                    <img
                        src={fileData.thumbnailLink}
                        alt="Preview"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl opacity-20">📕</span>
                        <span className="text-[8px] font-mono text-[var(--text-dim)] uppercase tracking-tighter">No Preview Available</span>
                    </div>
                )}

                {/* Overlay Interactivo Focus */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <button
                        className="w-full py-1 bg-[var(--accent)] text-black text-[8px] font-black uppercase rounded shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(fileData.webViewLink, '_blank');
                        }}
                    >
                        Focus Reader
                    </button>
                </div>
            </div>

            {/* Metadatos */}
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-bold text-[var(--text-soft)] truncate max-w-[120px]">{label}</span>
                <span className="text-[8px] font-mono text-[var(--text-dim)]">PDF</span>
            </div>
        </div>
    );
};

export default PDFNodeWidget;
