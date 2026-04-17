import React from 'react';

/**
 * =============================================================================
 * PRIMITIVA: RenameDryRunModal.jsx
 * RESPONSABILIDAD: Gate visual canónico para commits de renombrado.
 * =============================================================================
 */
export function RenameDryRunModal({
    pendingRename,
    isCommitting = false,
    error = '',
    onCancel,
    onConfirm,
}) {
    if (!pendingRename) return null;

    const preview = pendingRename.preview || {};
    const collisions = Array.isArray(preview.collisions) ? preview.collisions : [];
    const hasBlockers = !!preview.has_blockers;

    return (
        <div className="glass modal-overlay center" style={{ zIndex: 9999 }} onClick={onCancel}>
            <div
                className="stack"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 'min(680px, 92vw)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-6)',
                    gap: 'var(--space-4)'
                }}
            >
                <div className="stack--tight">
                    <span className="micro-copy" style={{ letterSpacing: '0.08em' }}>DRY_RUN_RENAME</span>
                    <strong style={{ fontSize: '12px' }}>
                        {pendingRename.kind === 'ATOM_ALIAS' ? 'Confirmar renombrado de esquema' : 'Confirmar renombrado de campo'}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
                        {`Alias origen: ${preview.old_alias || '-'} → Alias destino: ${preview.new_alias || '-'}`}
                    </span>
                </div>

                {pendingRename.kind === 'ATOM_ALIAS' ? (
                    <div className="shelf" style={{ gap: 'var(--space-6)' }}>
                        <div className="stack--tight">
                            <span className="micro-copy">IMPACTED_WORKSPACES</span>
                            <strong>{preview.impacted_workspaces || 0}</strong>
                        </div>
                        <div className="stack--tight">
                            <span className="micro-copy">IMPACTED_PINS</span>
                            <strong>{preview.impacted_pins || 0}</strong>
                        </div>
                    </div>
                ) : (
                    <div className="shelf" style={{ gap: 'var(--space-6)' }}>
                        <div className="stack--tight">
                            <span className="micro-copy">IMPACTED_ARTIFACTS</span>
                            <strong>{preview.impacts?.impacted_artifacts || 0}</strong>
                        </div>
                        <div className="stack--tight">
                            <span className="micro-copy">IMPACTED_REFS</span>
                            <strong>{preview.impacts?.impacted_refs || 0}</strong>
                        </div>
                    </div>
                )}

                <div className="stack--tight" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <span className="micro-copy">COLLISION_SCAN</span>
                    {collisions.length === 0 ? (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Sin colisiones detectadas.</span>
                    ) : (
                        <div className="stack--tight">
                            {collisions.map((col, idx) => (
                                <div key={`${col.scope}_${col.field_id || col.atom_id || idx}`} className="shelf--tight" style={{ fontSize: '10px' }}>
                                    <span className="micro-copy" style={{ color: col.severity === 'BLOCKER' ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                                        {col.severity}
                                    </span>
                                    <span style={{ color: 'var(--color-text-dim)' }}>
                                        {col.scope} · {(col.schema_label || col.atom_label || '').toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '10px' }}>
                        {error}
                    </div>
                )}

                {hasBlockers && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '10px' }}>
                        Existen colisiones bloqueantes. Debes resolverlas antes de confirmar.
                    </div>
                )}

                <div className="shelf" style={{ justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                    <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={isCommitting}>CANCELAR</button>
                    <button
                        className="btn btn--sm"
                        style={{
                            border: '1px solid var(--color-accent)',
                            color: 'var(--color-accent)'
                        }}
                        onClick={onConfirm}
                        disabled={isCommitting || hasBlockers}
                    >
                        {isCommitting ? 'APLICANDO...' : 'CONFIRMAR_RENAME'}
                    </button>
                </div>
            </div>
        </div>
    );
}
