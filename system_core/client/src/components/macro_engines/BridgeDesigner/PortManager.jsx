/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/PortManager.jsx
 * RESPONSABILIDAD: Panel dual para gestión de fuentes (SOURCES) y destinos (TARGETS).
 *
 * DHARMA:
 *   - Simetría Operativa: Las entradas y salidas se gestionan con la misma dignidad.
 *   - Transparencia Identitaria: Muestra qué campos "ofrece" o "pide" el artefacto.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { IndraMicroHeader } from '../../utilities/IndraMicroHeader';
import { FieldMapper } from './FieldMapper';
import { useShell } from '../../../context/ShellContext';
import { SchemaActionService } from '../../../services/SchemaActionService';
import { useAppState } from '../../../state/app_state';

export function PortManager({ title, ids, schemas, configs = {}, mappings = {}, mappingOptions = [], onAdd, onRemove, onUpdateMapping, onUpdateConfig, type = 'SOURCE' }) {
    return (
        <aside className="indra-panel-vessel">
            {/* Header del Puerto (Micro-HUD) */}
            <IndraMicroHeader
                label={type === 'SOURCE' ? 'FUENTES DE ENTRADA' : 'DESTINOS DE SALIDA'}
                icon={type === 'SOURCE' ? 'LOGIC' : 'TARGET'}
                onExecute={onAdd}
                executeLabel="AÑADIR"
                metadata={`${ids.length} CONEXIONES`}
            />

            {/* Lista de Artefactos Conectados */}
            <div className="fill stack--tight" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {ids.map(id => (
                    <PortCard
                        key={id}
                        id={id}
                        schema={schemas[id]}
                        config={configs[id] || {}}
                        mapping={mappings[id]}
                        mappingOptions={mappingOptions}
                        onRemove={() => onRemove(id)}
                        onUpdateMapping={(m) => onUpdateMapping(id, m)}
                        onUpdateConfig={(c) => onUpdateConfig(id, c)}
                        type={type}
                    />
                ))}

                {ids.length === 0 && (
                    <div className="center fill stack" style={{ padding: 'var(--space-4)', opacity: 0.2 }}>
                        <IndraIcon name={type === 'SOURCE' ? 'LOGIC' : 'TARGET'} size="32px" />
                        <span style={{ fontSize: '10px', marginTop: 'var(--space-2)' }}>SIN {type === 'SOURCE' ? 'ENTRADAS' : 'SALIDAS'} CONECTADAS</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function PortCard({ id, schema, mapping, mappingOptions = [], config, onRemove, onUpdateMapping, onUpdateConfig, type }) {
    const [expanded, setExpanded] = React.useState(true);
    const [isEditingAlias, setIsEditingAlias] = React.useState(false);

    const defaultAlias = schema?.label || '...';
    const alias = config.alias || defaultAlias;
    const [tempAlias, setTempAlias] = React.useState(alias);

    const isBroken = schema?.error === true;
    const activeFields = config.activeFields || (schema?.fields?.map(f => f.id) || []);

    const toggleField = (fieldId) => {
        const next = activeFields.includes(fieldId)
            ? activeFields.filter(f => f !== fieldId)
            : [...activeFields, fieldId];
        onUpdateConfig({ activeFields: next });
    };

    const handleAliasCommit = () => {
        setIsEditingAlias(false);
        if (tempAlias !== alias && tempAlias.trim() !== '') {
            onUpdateConfig({ alias: tempAlias.trim() });
        } else {
            setTempAlias(alias);
        }
    };

    return (
        <div className={`indra-blueprint-node ${isBroken ? 'indra-blueprint-node--warning' : ''}`}>
            <div className="spread">
                <div
                    className="shelf--tight fill clickable"
                    onClick={() => !isEditingAlias && setExpanded(!expanded)}
                    style={{ overflow: 'hidden' }}
                >
                    <IndraIcon
                        name={expanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'}
                        size="10px"
                        style={{ opacity: 0.5, marginRight: 'var(--space-1)' }}
                    />
                    <IndraIcon
                        name={isBroken ? 'WARN' : (type === 'SOURCE' ? 'EYE' : 'TARGET')}
                        size="14px"
                        style={{ color: isBroken ? 'var(--color-danger)' : 'var(--color-accent)', flexShrink: 0 }}
                    />
                    <div className="stack--tight" style={{ overflow: 'hidden' }}>
                        {isEditingAlias ? (
                            <input
                                autoFocus
                                value={tempAlias}
                                onChange={e => setTempAlias(e.target.value)}
                                onBlur={handleAliasCommit}
                                onKeyDown={e => { if (e.key === 'Enter') handleAliasCommit(); }}
                                className="input-transparent-mono"
                            />
                        ) : (
                            <span
                                onDoubleClick={(e) => { e.stopPropagation(); setIsEditingAlias(true); }}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: isBroken ? 'var(--color-danger)' : 'var(--color-text-primary)'
                                }}
                            >
                                {alias}
                            </span>
                        )}
                        <span style={{ fontSize: '7px', opacity: 0.6, whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                            {isBroken ? 'VÍNCULO ROTO' : `ESQUEMA // ${id.substring(0, 16)}`}
                        </span>
                    </div>
                </div>

                <IndraActionTrigger
                    variant="destructive"
                    size="10px"
                    onClick={onRemove}
                    label="DESCONECTAR"
                />
            </div>

            {expanded && (
                <div style={{
                    marginTop: 'var(--space-2)',
                    paddingTop: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border)',
                    paddingLeft: 'var(--space-4)'
                }}>
                    {!schema ? (
                        <div className="center" style={{ padding: 'var(--space-4)', opacity: 0.3, fontSize: '9px' }}>
                            OBTENIENDO DATOS DEL ESQUEMA...
                        </div>
                    ) : (schema.fields && schema.fields.length > 0) ? (
                        type === 'TARGET' ? (
                            <FieldMapper
                                targetId={id}
                                config={config}
                                schema={schema}
                                mapping={mapping}
                                mappingOptions={mappingOptions}
                                onUpdateConfig={onUpdateConfig}
                                onUpdateMapping={onUpdateMapping}
                            />
                        ) : (
                            <div className="stack--tight">
                                <IndraFractalTree 
                                    data={schema.fields || []}
                                    renderItem={({ node, depth, isExpanded, hasChildren, toggleExpand }) => (
                                        <div 
                                            className="spread glass-hover p-2 pointer"
                                            style={{ 
                                                opacity: activeFields.includes(node.id) ? 1 : 0.5,
                                                paddingLeft: `calc(12px + ${depth * 8}px)`
                                            }}
                                            onClick={() => hasChildren && toggleExpand()}
                                        >
                                            <div className="shelf--tight">
                                                {hasChildren && (
                                                    <IndraIcon 
                                                        name={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} 
                                                        size="8px" 
                                                        style={{ opacity: 0.4 }}
                                                    />
                                                )}
                                                {!hasChildren && <div style={{ width: '12px' }} />}
                                                
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '2px',
                                                    border: `1px solid ${activeFields.includes(node.id) ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                                                    background: activeFields.includes(node.id) ? 'var(--color-accent)' : 'transparent',
                                                    flexShrink: 0
                                                }} onClick={(e) => { e.stopPropagation(); toggleField(node.id); }} />
                                                
                                                <span className="font-mono" style={{ fontSize: '9px', fontWeight: hasChildren ? 'bold' : 'normal' }}>
                                                    {node.label || node.id}
                                                </span>
                                            </div>
                                            <span className="font-mono opacity-30" style={{ fontSize: '7px' }}>{node.type}</span>
                                        </div>
                                    )}
                                />
                            </div>
                        )
                    ) : (
                        <div style={{ padding: 'var(--space-4)', opacity: 0.2, fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                            // NO SE ENCONTRARON CAMPOS EN ESTA FUENTE
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

