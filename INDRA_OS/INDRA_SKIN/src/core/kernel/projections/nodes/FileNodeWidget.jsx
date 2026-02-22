import React from 'react';

/**
 * FileNodeWidget (v10.5)
 * DHARMA: Proyección de Artefactos de Almacenamiento.
 * Semiótica: "Tipo", "Extensión", "Volumen".
 */
const FileNodeWidget = ({ data, execute }) => {
    const { LABEL, data: fileData = {} } = data;
    const extension = fileData.extension || (LABEL && LABEL.includes('.') ? LABEL.split('.').pop() : 'bin');
    const size = fileData.size ? `${(fileData.size / 1024).toFixed(1)} KB` : '---';

    const getIcon = (ext) => {
        const icons = {
            'pdf': '📕',
            'doc': '📘',
            'docx': '📘',
            'xls': '📗',
            'xlsx': '📗',
            'jpg': '🖼️',
            'png': '🖼️',
            'zip': '📦',
            'gs': '📜'
        };
        return icons[ext.toLowerCase()] || '📄';
    };

    return (
        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/5 group-hover:border-[var(--accent)]/30 transition-all">
            <div className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                {getIcon(extension)}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-[var(--text-soft)] truncate tracking-tight">
                    {LABEL}
                </span>
                <div className="flex gap-2 items-center">
                    <span className="text-[8px] font-mono text-[var(--accent)] uppercase font-bold px-1 bg-[var(--accent)]/10 rounded">
                        {extension}
                    </span>
                    <span className="text-[7px] font-mono text-[var(--text-dim)]">
                        {size}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FileNodeWidget;




