/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ArtifactCard.jsx
 * RESPONSABILIDAD: Proyectar la identidad de un Átomo Universal en la grilla.
 *
 * DHARMA:
 *   - Sinceridad Identitaria: Muestra el ID real y el label proyectado.
 *   - Reactividad Protocolar: Habilita acciones basadas en el array de protocols.
 * 
 * AXIOMAS:
 *   - La tarjeta no sabe qué es el átomo, solo sabe qué puede "hacerle".
 *   - Si el átomo no tiene handle, es un defecto de fábrica del núcleo.
 * 
 * RESTRICCIONES:
 *   - Prohibido modificar el átomo directamente. Solo disparar directivas.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { getEngineForClass } from '../../services/engine_manifests';
import { useAppState } from '../../state/app_state';
import { useLexicon } from '../../services/lexicon';

export function ArtifactCard({ atom, onOpen }) {
    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);
    const engine = getEngineForClass(atom.class);

    // Los protocolos definen las capacidades visuales
    const canRead = atom.protocols?.includes('ATOM_READ');
    const canUpdate = atom.protocols?.includes('ATOM_UPDATE');
    const canDelete = atom.protocols?.includes('ATOM_DELETE');

    return (
        <div
            className="mca-surface stack"
            style={{
                position: 'relative',
                minHeight: '140px',
                cursor: canRead ? 'pointer' : 'default',
                transition: 'all var(--transition-base)',
                borderColor: engine?.color || 'var(--color-border)',
                background: `linear-gradient(135deg, ${engine?.color}10 0%, transparent 100%)`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid var(--color-border)'
            }}
            onClick={() => canRead && onOpen(atom)}
        >
            {/* HUD Decoration Element */}
            <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: '30px', height: '30px',
                borderTop: `1px solid ${engine?.color || 'var(--color-border)'}`,
                borderRight: `1px solid ${engine?.color || 'var(--color-border)'}`,
                opacity: 0.3
            }}></div>

            {/* Header: Class + ID Metadata */}
            <div className="spread" style={{ opacity: 0.4 }}>
                <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                    {atom.class} // {atom.id?.substring(0, 8)}...
                </span>
                <IndraIcon name={engine?.icon || 'ATOM'} size="12px" style={{ color: engine?.color }} />
            </div>

            {/* Main Identity Slot */}
            <div className="fill center stack--tight" style={{ padding: 'var(--space-2) 0' }}>
                <h3 style={{
                    margin: 0,
                    fontSize: 'var(--text-lg)',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    {atom.handle?.label || t('status_unnamed')}
                </h3>
                <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                    {atom.handle?.alias || 'no_alias'}
                </span>
            </div>

            {/* Footer: Protocol Actions */}
            <div className="spread" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <div className="shelf--tight">
                    {canUpdate && <IndraIcon name="SETTINGS" size="10px" style={{ opacity: 0.5 }} />}
                    {canDelete && <IndraIcon name="DELETE" size="10px" style={{ opacity: 0.5, marginLeft: 'var(--space-1)' }} />}
                </div>

                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>
                    {new Date(atom.updated_at || Date.now()).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
