/**
 * =============================================================================
 * PRIMITIVA: ToastNotification.jsx + ToastProvider
 * RESPONSABILIDAD: Sistema de feedback flotante para acciones del usuario.
 *
 * AXIOMA: Errores críticos no deben vivir solo en console.error.
 * El usuario debe ver feedback visual para: éxito, error, e info.
 *
 * USO:
 *   1. Envolver App con <ToastProvider>
 *   2. Usar el hook useToast() en cualquier componente:
 *      const { toast } = useToast();
 *      toast.success('Workspace guardado');
 *      toast.error('Fallo al eliminar');
 *      toast.info('Sincronizando...');
 *
 * PROPS del ToastProvider: children
 * PROPS de ToastNotification: message, type, duration, onDismiss
 * =============================================================================
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toastEmitter } from '../../../services/toastEmitter';

// ── CONTEXT ──
const ToastContext = createContext(null);

// ── HOOK DE USO ──
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('[Indra] useToast debe usarse dentro de ToastProvider');
    return ctx;
}

// ── PROVIDER ──
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    // ── PUENTE: Escuchar eventos del toastEmitter (desde app_state / servicios) ──
    useEffect(() => {
        const unsub = toastEmitter.subscribe((type, message, duration) => {
            addToast(message, type, duration);
        });
        return unsub; // Cleanup al desmontar
    }, [addToast]);

    const toast = {
        success: (msg, d) => addToast(msg, 'success', d),
        error: (msg, d) => addToast(msg, 'error', d || 5000),
        info: (msg, d) => addToast(msg, 'info', d),
    };

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

// ── CONTENEDOR GLOBAL ──
function ToastContainer({ toasts, onDismiss }) {
    if (!toasts.length) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 'var(--space-8)',
            right: 'var(--space-8)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            pointerEvents: 'none',
        }}>
            {toasts.map(t => (
                <ToastNotification
                    key={t.id}
                    message={t.message}
                    type={t.type}
                    duration={t.duration}
                    onDismiss={() => onDismiss(t.id)}
                />
            ))}
        </div>
    );
}

// ── ITEM INDIVIDUAL ──
export function ToastNotification({ message, type = 'info', duration = 3500, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const COLOR_MAP = {
        success: 'var(--color-success)',
        error: 'var(--color-danger)',
        info: 'var(--color-accent)',
    };

    const ICON_MAP = { success: '✓', error: '✕', info: 'i' };
    const color = COLOR_MAP[type] || COLOR_MAP.info;

    return (
        <div
            style={{
                pointerEvents: 'all',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'rgba(8, 8, 12, 0.95)',
                border: `1px solid ${color}40`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '4px',
                boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${color}10`,
                backdropFilter: 'blur(12px)',
                minWidth: '240px',
                maxWidth: '380px',
                animation: 'indra-toast-in 0.2s ease-out',
                cursor: 'pointer',
            }}
            onClick={onDismiss}
        >
            <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: `${color}20`,
                border: `1px solid ${color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color,
                fontWeight: 700,
                flexShrink: 0,
            }}>
                {ICON_MAP[type]}
            </span>
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.04em',
                color: 'white',
                lineHeight: 1.4,
                flex: 1,
            }}>
                {message}
            </span>
        </div>
    );
}
