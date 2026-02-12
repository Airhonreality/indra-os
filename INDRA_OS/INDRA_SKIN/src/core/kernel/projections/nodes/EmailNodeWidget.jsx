import React from 'react';

/**
 * EmailNodeWidget (v10.5)
 * DHARMA: Proyección del Adaptador de Correo.
 * Semiótica: "Mensaje", "Urgencia", "Origen".
 */
const EmailNodeWidget = ({ data, execute }) => {
    const { label, VITAL_SIGNS = {}, CAPABILITIES = {}, data: emailData = {} } = data;

    // Simulación de metadatos si no vienen en data (PoC)
    const from = emailData.from || "Sovereign Entity";
    const subject = emailData.subject || label;
    const isUrgent = VITAL_SIGNS.URGENCY?.value > 0.8 || subject.toLowerCase().includes('urgente');

    const handleAction = (capId) => {
        execute('EXECUTE_NODE_ACTION', {
            nodeId: data.id,
            capability: capId,
            payload: { emailId: emailData.id }
        });
    };

    return (
        <div className="flex flex-col gap-2 p-1">
            {/* Cabecera del Correo */}
            <div className="flex flex-col border-l-2 border-[var(--accent)] pl-2 bg-white/5 p-2 rounded-r">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--accent)] truncate">{from}</span>
                    {isUrgent && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red] animate-pulse"></span>
                    )}
                </div>
                <div className="text-[9px] text-[var(--text-soft)] line-clamp-2 leading-tight italic">
                    "{subject}"
                </div>
            </div>

            {/* Puertos de Acción Rápidos (Capabilities) */}
            <div className="flex gap-2 mt-1">
                {Object.keys(CAPABILITIES).includes('SEND_REPLY') && (
                    <button
                        onClick={() => handleAction('SEND_REPLY')}
                        className="px-2 py-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40 border border-[var(--accent)]/30 rounded text-[8px] font-black uppercase transition-all"
                    >
                        Reply
                    </button>
                )}
                <button
                    onClick={() => handleAction('ARCHIVE')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8px] font-black uppercase transition-all text-[var(--text-dim)]"
                >
                    Archive
                </button>
            </div>
        </div>
    );
};

export default EmailNodeWidget;
