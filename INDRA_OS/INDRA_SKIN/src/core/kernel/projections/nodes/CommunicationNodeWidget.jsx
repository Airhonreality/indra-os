import React from 'react';

/**
 * CommunicationNodeWidget (ex-EmailNodeWidget)
 * DHARMA: Proyección compacta del nodo de Comunicación en el Canvas del Grafo.
 * ARCHETYPE: COMMUNICATION / MAIL / MESSAGING / CHAT
 */
const CommunicationNodeWidget = ({ data, execute }) => {
    const { VITAL_SIGNS = {}, CAPABILITIES = {}, data: nodeData = {} } = data;

    const from = nodeData.from || nodeData.sender || data.LABEL || 'Sovereign Entity';
    const subject = nodeData.subject || nodeData.preview || '—';
    const isUrgent = VITAL_SIGNS.URGENCY?.value > 0.8 || subject.toLowerCase().includes('urgente');

    const handleAction = (capId) => {
        execute('EXECUTE_NODE_ACTION', {
            nodeId: data.id,
            capability: capId,
            payload: { messageId: nodeData.id }
        });
    };

    return (
        <div className="flex flex-col gap-2 p-1">
            {/* Cabecera del Mensaje */}
            <div className="flex flex-col border-l-2 border-[var(--accent)] pl-2 bg-white/5 p-2 rounded-r">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--accent)] truncate">{from}</span>
                    {isUrgent && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red] animate-pulse" />
                    )}
                </div>
                <div className="text-[9px] text-[var(--text-soft)] line-clamp-2 leading-tight italic">
                    "{subject}"
                </div>
            </div>

            {/* Acciones rápidas (de CAPABILITIES reales) */}
            <div className="flex gap-2 mt-1">
                {Object.keys(CAPABILITIES).includes('SEND_REPLY') && (
                    <button
                        onClick={() => handleAction('SEND_REPLY')}
                        className="px-2 py-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/40 border border-[var(--accent)]/30 rounded text-[8px] font-black uppercase transition-all"
                    >
                        Reply
                    </button>
                )}
                {Object.keys(CAPABILITIES).includes('ARCHIVE') && (
                    <button
                        onClick={() => handleAction('ARCHIVE')}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8px] font-black uppercase transition-all text-[var(--text-dim)]"
                    >
                        Archive
                    </button>
                )}
            </div>
        </div>
    );
};

export default CommunicationNodeWidget;

