/**
 * =============================================================================
 * SATÉLITE: SchemaCard.jsx
 * Un card por esquema detectado. Muestra estado y acciones disponibles.
 * DHARMA: Sin imports de Indra. CSS propio via props de estilo inline.
 * =============================================================================
 */

import React, { useState } from 'react';
import { SCHEMA_STATUS } from '../hooks/useForgeSync';

const STATUS_CONFIG = {
  [SCHEMA_STATUS.LOCAL_ONLY]:  { color: '#ef4444', dot: '🔴', label: 'LOCAL_ONLY',   action: 'SINCRONIZAR ADN' },
  [SCHEMA_STATUS.DRIFTED]:     { color: '#f59e0b', dot: '🟡', label: 'DERIVADO',      action: 'ACTUALIZAR ADN' },
  [SCHEMA_STATUS.ORPHAN]:      { color: '#8b5cf6', dot: '🟣', label: 'EN_POTENCIA',   action: 'IGNITAR MATERIA' },
  [SCHEMA_STATUS.LIVE]:        { color: '#10b981', dot: '🟢', label: 'EN_VIVO',       action: null },
  [SCHEMA_STATUS.REMOTE_ONLY]: { color: '#6b7280', dot: '⚪', label: 'HUÉRFANO',      action: null },
  [SCHEMA_STATUS.IN_SYNC]:     { color: '#10b981', dot: '🟢', label: 'EN_SINCRONÍA',  action: null },
};

export function SchemaCard({ entry, onSync, onUpdate, onIgnite, disabled }) {
  const { alias, localSchema, coreAtom, status } = entry;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG[SCHEMA_STATUS.REMOTE_ONLY];
  const [isActing, setIsActing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('drive');

  const fieldCount = (localSchema?.fields || coreAtom?.payload?.fields || []).length;
  const siloId = coreAtom?.payload?.target_silo_id;

  const handleAction = async () => {
    setIsActing(true);
    try {
      if (status === SCHEMA_STATUS.LOCAL_ONLY) await onSync(alias);
      else if (status === SCHEMA_STATUS.DRIFTED) await onUpdate(alias);
      else if (status === SCHEMA_STATUS.ORPHAN) await onIgnite(alias, selectedProvider);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${cfg.color}33`,
      borderRadius: '10px',
      padding: '12px 14px',
      marginBottom: '8px',
      transition: 'all 0.2s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px' }}>{cfg.dot}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
            {alias}
          </span>
        </div>
        <span style={{ 
          fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.1em',
          color: cfg.color, background: `${cfg.color}22`,
          padding: '2px 6px', borderRadius: '4px'
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Meta */}
      <div style={{ marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
          {fieldCount} campo{fieldCount !== 1 ? 's' : ''}
          {localSchema?.label ? ` · ${localSchema.label}` : ''}
        </span>
        {siloId && (
          <span style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
            {siloId}
          </span>
        )}
      </div>

      {/* Provider selector for ORPHAN */}
      {status === SCHEMA_STATUS.ORPHAN && (
        <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
          {['drive', 'notion'].map(p => (
            <button key={p} onClick={() => setSelectedProvider(p)} style={{
              fontSize: '8px', fontFamily: 'monospace', padding: '2px 8px',
              borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: selectedProvider === p ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
              color: '#fff', letterSpacing: '0.05em'
            }}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Action Button */}
      {cfg.action && (
        <button onClick={handleAction} disabled={disabled || isActing} style={{
          marginTop: '10px', width: '100%', padding: '7px',
          background: isActing ? 'rgba(255,255,255,0.1)' : cfg.color,
          border: 'none', borderRadius: '7px', cursor: isActing ? 'wait' : 'pointer',
          color: '#fff', fontFamily: 'monospace', fontSize: '9px',
          fontWeight: 700, letterSpacing: '0.08em', transition: 'opacity 0.2s ease',
          opacity: disabled && !isActing ? 0.5 : 1
        }}>
          {isActing ? '⏳ PROCESANDO...' : `⚡ ${cfg.action}`}
        </button>
      )}
    </div>
  );
}
