import React from 'react';
import { VParamField } from './VParamField';
import { IndraIcon } from '../../../utilities/IndraIcons';

/**
 * =============================================================================
 * COMPONENTE MIDI: VInspectorSidebar
 * RESPONSABILIDAD: Extraer parámetros del Átomo de Video.
 * AXIOMA DE SINCERIDAD: Envia directivas `mutateProject` que reemplazan en RAW 
 * la información al Motor Agnóstico. El motor entonces hidrata y repinta.
 * =============================================================================
 */

export function VInspectorSidebar({ selectedClip, mutateProject, onClose }) {

    if (!selectedClip) {
        return (
            <div className="v-inspector mca-surface p-4 text-hint" style={{ width: 280, borderLeft: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-base)' }}>
                <p>No clip selected.</p>
            </div>
        );
    }

    const handleUpdate = (field, newMsValue) => {
        // Enviar Mutacion Limpia (Inmutabilidad)
        mutateProject((ast) => {
            // Buscamos fisicamente en todo el AST el clip apuntado
            // (Para un app en producc se usa id track + id clip. Aquí recorremos)
            if (!ast.timeline?.tracks) return ast;

            for (const track of ast.timeline.tracks) {
                const clip = track.clips?.find(c => c.id === selectedClip.id);
                if (clip) {
                    clip[field] = newMsValue;

                    // Asegurar consistencia de duracion de AST general:
                    let maxTime = 0;
                    ast.timeline.tracks.forEach(tr => {
                        tr.clips.forEach(cl => {
                            maxTime = Math.max(maxTime, cl.start_at_ms + cl.duration_ms);
                        });
                    });

                    if (!ast.settings) ast.settings = {};
                    ast.settings.duration_ms = maxTime;
                    break;
                }
            }
            return ast;
        });
    };

    return (
        <div className="v-inspector mca-surface stack" style={{ width: 300, borderLeft: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-elevated)', height: '100%', overflowY: 'auto' }}>
            <div className="shelf--between p-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight text-hint">
                    <IndraIcon name="SETTINGS" size="14px" />
                    <span className="font-mono" style={{ fontSize: '11px' }}>INSPECTOR (SMPTE)</span>
                </div>
                <button className="btn btn--icon-only" onClick={onClose} title="Close Inspector">
                    <IndraIcon name="X" size="12px" />
                </button>
            </div>

            <div className="p-4">
                <div className="text-hint font-mono mb-4" style={{ fontSize: '10px', wordBreak: 'break-all', opacity: 0.5 }}>
                    ID: {selectedClip.id}
                    <br />
                    VAULT: {selectedClip.vault_id}
                </div>

                <VParamField
                    label="IN POINT (Start)"
                    valueMs={selectedClip.start_at_ms}
                    onChangeMs={(val) => handleUpdate('start_at_ms', val)}
                />

                <VParamField
                    label="DURATION"
                    valueMs={selectedClip.duration_ms}
                    onChangeMs={(val) => handleUpdate('duration_ms', val)}
                />

                {/* El 'Out Point' matematicamente seria Start + Duration, 
                 mostrándolo como solo lectura o provocando cambio sobre Duration si se edita. 
                 En M.C.A limitamos variables entrelazadas (Single Source of Truth) */}

                <div className="v-param-field stack--tight mt-4 pt-4" style={{ borderTop: '1px dotted var(--color-border)' }}>
                    <label className="text-hint font-mono" style={{ fontSize: '10px' }}>
                        OUT POINT (Calculated)
                    </label>
                    <span className="font-mono" style={{ color: 'var(--color-primary)' }}>
                        {/* Out Point es calculo = start + duration */}
                        {(() => {
                            const ms = selectedClip.start_at_ms + selectedClip.duration_ms;
                            const fps = 30;
                            const frames = Math.floor((ms % 1000) * fps / 1000);
                            const s = Math.floor(ms / 1000);
                            const ss = s % 60;
                            const m = Math.floor(s / 60) % 60;
                            const h = Math.floor(s / 3600);
                            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
                        })()}
                    </span>
                </div>
            </div>
        </div>
    );
}
