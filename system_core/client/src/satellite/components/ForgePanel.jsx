/**
 * =============================================================================
 * SATÉLITE: ForgePanel.jsx
 * Panel principal del HUD. Orquesta auth, sync, y la lista de esquemas.
 * DHARMA: Auto-contenido. No comparte state con la aplicación anfitriona.
 * =============================================================================
 */

import { useState } from 'react';
import { useCoreAuth } from '../hooks/useCoreAuth';
import { useForgeSync } from '../hooks/useForgeSync';
import { SchemaCard } from './SchemaCard';

// URL del endpoint de descubrimiento de Indra (configurable via window)
const DISCOVERY_URL = window.INDRA_DISCOVERY_URL || 'https://indra-os.com/satellite/discover';

export function ForgePanel({ onClose }) {
  const { session, isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useCoreAuth(DISCOVERY_URL);
  const { schemas, isLoading: syncLoading, error: syncError, refresh, syncSchema, updateSchema, ignite } = useForgeSync(session);
  const [isExpanded, setIsExpanded] = useState(true);

  const isLoading = authLoading || syncLoading;
  // const error = authError || syncError; // No usado segun linter

  const localCount = schemas.filter(s => s.status !== 'REMOTE_ONLY').length;
  const liveCount = schemas.filter(s => s.status === 'LIVE').length;

  if (!isExpanded) {
    return (
      <button onClick={() => setIsExpanded(true)} title="Abrir Indra Forge" style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        border: 'none', cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
        fontSize: '18px'
      }}>⚡</button>
    );
  }

  return (
    <div style={{
      width: '320px',
      background: 'rgba(12, 12, 20, 0.97)',
      backdropFilter: 'blur(20px)',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.2)',
      fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
      overflow: 'hidden'
    }}>
      {/* ─── Header ─── */}
      <div style={{
        padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚡</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
              INDRA FORGE
            </div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
              REMOTE CONTROLLER
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isAuthenticated && (
            <button onClick={refresh} disabled={isLoading} title="Refresh" style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px',
              color: '#fff', cursor: 'pointer', padding: '4px 7px', fontSize: '11px'
            }}>↻</button>
          )}
          <button onClick={() => setIsExpanded(false)} title="Minimizar" style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px',
            color: '#fff', cursor: 'pointer', padding: '4px 7px', fontSize: '11px'
          }}>─</button>
          {onClose && (
            <button onClick={onClose} title="Cerrar" style={{
              background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '6px',
              color: '#ef4444', cursor: 'pointer', padding: '4px 7px', fontSize: '11px'
            }}>✕</button>
          )}
        </div>
      </div>

      {/* ─── Body ─── */}
      <div style={{ padding: '14px', maxHeight: '480px', overflowY: 'auto' }}>
        {/* Auth State */}
        {!isAuthenticated ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛰️</div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: 1.5 }}>
              Conecta tu cuenta de Google para vincular este proyecto con tu Core de Indra.
            </p>
            <button onClick={login} disabled={authLoading} style={{
              width: '100%', padding: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              color: '#fff', fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em'
            }}>
              {authLoading ? '⏳ CONECTANDO...' : '🔐 CONECTAR CON GOOGLE'}
            </button>
            {authError && (
              <p style={{ fontSize: '9px', color: '#ef4444', marginTop: '8px' }}>{authError}</p>
            )}
          </div>
        ) : (
          <>
            {/* Session Info */}
            <div style={{
              padding: '8px 10px', borderRadius: '8px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              marginBottom: '14px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>CONECTADO COMO</div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                  {session?.user_handle || 'Arquitecto'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>{liveCount}/{localCount} LIVE</div>
                <button onClick={logout} style={{
                  fontSize: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', padding: 0, textDecoration: 'underline'
                }}>desconectar</button>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && schemas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                ⏳ Escaneando esquemas...
              </div>
            )}

            {/* Error */}
            {syncError && (
              <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', marginBottom: '10px' }}>
                <p style={{ fontSize: '9px', color: '#ef4444', margin: 0 }}>⚠️ {syncError}</p>
              </div>
            )}

            {/* Schema Cards */}
            {schemas.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌑</div>
                No se detectaron esquemas en <code>window.INDRA_SCHEMAS</code>.
              </div>
            )}
            {schemas.map(entry => (
              <SchemaCard
                key={entry.alias}
                entry={entry}
                onSync={syncSchema}
                onUpdate={updateSchema}
                onIgnite={ignite}
                disabled={isLoading}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
