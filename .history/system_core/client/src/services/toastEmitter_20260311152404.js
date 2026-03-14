/**
 * =============================================================================
 * SERVICIO: toastEmitter.js
 * RESPONSABILIDAD: Puente para emitir toasts desde fuera del árbol React.
 *
 * PROBLEMA: app_state (Zustand) es un store puro y no puede acceder
 * a hooks ni al contexto React. Este emisor permite que cualquier
 * módulo fuera del árbol de React (app_state, directive_executor, etc.)
 * emita una notificación toast al usuario.
 *
 * PATRÓN: Subscriber único — ToastProvider se suscribe al montar.
 *
 * USO DESDE STORES/SERVICES:
 *   import { toastEmitter } from './toastEmitter';
 *   toastEmitter.emit('error', 'Error al borrar el átomo');
 *
 * USO DESDE REACT (ToastProvider se suscribe automáticamente):
 *   <ToastProvider> — en App.jsx
 * =============================================================================
 */

class ToastEmitter {
    constructor() {
        this._listeners = new Set();
    }

    /**
     * Suscribirse a los eventos de toast.
     * @param {Function} listener  fn(type, message) → void
     * @returns {Function} unsubscribe
     */
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    /**
     * Emitir un toast. Seguro para llamar desde cualquier contexto.
     * @param {'success'|'error'|'info'} type
     * @param {string} message
     * @param {number} [duration]
     */
    emit(type, message, duration) {
        this._listeners.forEach(l => l(type, message, duration));
    }

    // Atajos convenientes
    success(msg, d) { this.emit('success', msg, d); }
    error(msg, d) { this.emit('error', msg, d || 5000); }
    info(msg, d) { this.emit('info', msg, d); }
}

export const toastEmitter = new ToastEmitter();
