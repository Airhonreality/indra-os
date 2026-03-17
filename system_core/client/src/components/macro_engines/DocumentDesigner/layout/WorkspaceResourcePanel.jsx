/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/WorkspaceResourcePanel.jsx
 * RESPONSABILIDAD: Explorador de recursos del workspace para reclutamiento.
 * (ADR_018 §3.1.4 — Fase 3)
 *
 * Divide los recursos en 3 sub-tabs:
 * - SCHEMA: Schemas para insertar iteradores.
 * - SLOTS: Variables para insertar textos {{}}.
 * - OBJECTS: Silos y assets multimedia.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { Spinner } from '../../../utilities/primitives';
import { useAppState } from '../../../../state/app_state';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { useDocumentHydration } from '../hooks/useDocumentHydration';
import { SchemaMicroExplorer } from '../../../utilities/SchemaMicroExplorer';
import { useShell } from '../../../../context/ShellContext';
import { SchemaActionService } from '../../../../services/SchemaActionService';

export function WorkspaceResourcePanel({ atom, onNotify }) {
    const [subTab, setSubTab] = useState('SLOTS');
    const { pins } = useAppState();
    const { addNode, updateNode, findNode } = useAST();
    const { selectedId } = useSelection();
    const { openContextMenu } = useShell();
    const { slots, isLoading } = useDocumentHydration(atom);

    // ── Lógica de inserción (ADR_018 §A2) ───────────────────────────────────
    const insertResource = (type, props) => {
        let targetId = selectedId;
        // Si no hay seleccion o el target no es un contenedor, insertamos en root
        if (!targetId) targetId = 'root';
        
        const newId = addNode(type, targetId);
        if (props) {
            updateNode(newId, { props });
        }
        
        if (onNotify) onNotify(`INSERTED: ${type}`);
    };

    const copyPlaceholder = (label) => {
        const tag = `{{${label}}}`;
        navigator.clipboard.writeText(tag);
        if (onNotify) onNotify(`COPIED: ${tag}`);
    };

    // ── Filtrado de artefactos del Workspace ────────────────────────────────
    const schemas = pins.filter(p => p.class === 'DATA_SCHEMA');
    const objects = pins.filter(p => ['FOLDER', 'COLLECTION', 'ACCOUNT', 'SILO'].includes(p.class));

    return (
        <div className="workspace-resource-panel fill stack--none">
            {/* SUB-TABS (Minimalist TabBar) */}
            <div className="sub-tab-bar">
                {['SCHEMA', 'SLOTS', 'OBJECTS'].map(t => (
                    <button 
                        key={t}
                        onClick={() => setSubTab(t)}
                        className="sub-tab-btn"
                        data-active={subTab === t}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="fill overflow-y-auto" style={{ padding: 'var(--space-2)' }}>
                {isLoading && (
                    <div className="center fill" style={{ padding: 'var(--space-10)' }}>
                        <Spinner size="24px" label="HYDRATING_RESOURCES" />
                    </div>
                )}

                {!isLoading && subTab === 'SCHEMA' && (
                    <div className="stack--tight">
                        {schemas.length === 0 && <div className="text-hint center" style={{padding: '20px'}}>NO_SCHEMAS_FOUND</div>}
                        {schemas.map(s => (
                            <div key={s.id} className="stack--tight glass" style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                <div className="shelf--tight" style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border)', opacity: 0.6 }}>
                                    <IndraIcon name="SCHEMA" size="10px" />
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{s.label || s.id}</span>
                                    <div className="fill" />
                                    <button 
                                        className="btn btn--xs btn--ghost" 
                                        onClick={() => insertResource('ITERATOR', { source: s.id })}
                                        title="INSERT_ITERATOR"
                                    >
                                        <IndraIcon name="PLUS" size="10px" color="var(--color-accent)" />
                                    </button>
                                </div>
                                <SchemaMicroExplorer 
                                    schema={s}
                                    onContextMenu={(e, field) => {
                                        openContextMenu(e, [
                                            { 
                                                label: 'Añadir Hijo', 
                                                icon: 'PLUS', 
                                                action: () => SchemaActionService.addField(s, { parentId: field.id }, { url: useAppState.getState().protocolUrl, secret: useAppState.getState().protocolSecret }) 
                                            },
                                            { 
                                                label: 'Eliminar Campo', 
                                                icon: 'DELETE', 
                                                color: 'var(--color-danger)',
                                                action: () => SchemaActionService.removeField(s, field.id, { url: useAppState.getState().protocolUrl, secret: useAppState.getState().protocolSecret }) 
                                            },
                                            { type: 'SEPARATOR' },
                                            {
                                                label: 'Copiar Placeholder',
                                                icon: 'COPY',
                                                action: () => copyPlaceholder(`${s.label || s.id}.${field.alias || field.id}`)
                                            }
                                        ]);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && subTab === 'SLOTS' && (
                    <div className="stack--tight">
                        {slots.length === 0 && <div className="text-hint center" style={{padding: '20px'}}>NO_SLOTS_AVAILABLE</div>}
                        {slots.map(s => (
                            <ResourceRow 
                                key={s.id}
                                icon="LOGIC"
                                label={s.label}
                                sublabel={s.origin}
                                badge={s.type}
                                actions={[
                                    { icon: 'COPY', onClick: () => copyPlaceholder(s.label), title: 'COPY_PLACEHOLDER' },
                                    { icon: 'PLUS', onClick: () => insertResource('TEXT', { content: `{{${s.label}}}` }), title: 'INSERT_TEXT_NODE', color: 'var(--color-accent)' }
                                ]}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && subTab === 'OBJECTS' && (
                    <div className="stack--tight">
                        {objects.length === 0 && <div className="text-hint center" style={{padding: '20px'}}>NO_RESOURCES_FOUND</div>}
                        {objects.map(o => (
                            <ResourceRow 
                                key={o.id}
                                icon={o.class === 'FOLDER' ? 'FOLDER' : 'VAULT'}
                                label={o.label || o.id}
                                actions={[
                                    { icon: 'PLUS', onClick: () => insertResource('IMAGE', { src: o.id }), title: 'INSERT_AS_IMAGE', color: 'var(--color-accent)' }
                                ]}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .sub-tab-bar {
                    display: flex;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-bg-deep);
                }
                .sub-tab-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--color-text-secondary);
                    font-size: 8px;
                    font-family: var(--font-mono);
                    padding: 8px 0;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.05em;
                }
                .sub-tab-btn:hover {
                    background: var(--color-bg-hover);
                    color: var(--color-text-primary);
                }
                .sub-tab-btn[data-active="true"] {
                    color: var(--color-accent);
                    border-bottom-color: var(--color-accent);
                    background: var(--color-accent-dim);
                }
            `}</style>
        </div>
    );
}

function ResourceRow({ icon, label, sublabel, badge, actions }) {
    return (
        <div className="resource-row shelf--tight glass-hover">
            <IndraIcon name={icon} size="10px" style={{ opacity: 0.5 }} />
            <div className="stack--none fill overflow-hidden">
                <div className="shelf--tight">
                    <span className="resource-row__label">{label}</span>
                    {badge && <span className="resource-row__badge">{badge}</span>}
                </div>
                {sublabel && <span className="resource-row__sublabel">{sublabel}</span>}
            </div>
            <div className="shelf--tight">
                {actions.map((a, i) => (
                    <button 
                        key={i}
                        className="btn btn--xs btn--ghost"
                        onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                        title={a.title}
                        style={{ border: 'none', padding: '4px', color: a.color || 'inherit' }}
                    >
                        <IndraIcon name={a.icon} size="10px" />
                    </button>
                ))}
            </div>

            <style>{`
                .resource-row {
                    padding: 6px 8px;
                    border-radius: var(--radius-sm);
                    cursor: default;
                    border: 1px solid transparent;
                    transition: all 0.1s;
                }
                .resource-row:hover {
                    border-color: var(--color-border);
                    background: var(--color-bg-hover);
                }
                .resource-row__label {
                    font-size: 10px;
                    font-family: var(--font-mono);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .resource-row__sublabel {
                    font-size: 7px;
                    opacity: 0.3;
                    font-family: var(--font-mono);
                }
                .resource-row__badge {
                    font-size: 7px;
                    padding: 0 4px;
                    border: 1px solid var(--color-border);
                    border-radius: 2px;
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
}
