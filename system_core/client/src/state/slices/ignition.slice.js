import { toastEmitter } from '../../services/toastEmitter';
import { OrchestratorService } from '../../services/google/OrchestratorService';
import { executeDirective } from '../../services/directive_executor';

function _loadInductionSnapshot_() {
    try {
        const raw = localStorage.getItem('indra-induction-ticket-snapshot');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export const createIgnitionSlice = (set, get) => ({
    installStatus: { step: null, progress: 0 }, // Seguimiento de la ignición
    inductionTicketId: localStorage.getItem('indra-induction-ticket-id') || null,
    inductionTicketSnapshot: _loadInductionSnapshot_(),

    startAuthPoller: async (coreUrl, satelliteKey) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(coreUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ protocol: 'HEALTH_CHECK' })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.metadata?.status === 'BOOTSTRAP') {
                        console.log('[Centinela] Motor despertado. Relanzando pacto de ignición...');
                        await fetch(coreUrl, {
                            method: 'POST',
                            mode: 'cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                protocol: 'SYSTEM_INSTALL_HANDSHAKE',
                                satellite_key: satelliteKey,
                                core_owner_uid: get().googleUser?.email
                            })
                        });
                    }

                    clearInterval(interval);
                    toastEmitter.success('¡Pacto de Identidad Validado!');
                    await get().setCoreConnection(coreUrl, satelliteKey);
                }
            } catch (e) {
                console.log('[Centinela] Esperando firma del pacto...');
            }
        }, 3000);

        setTimeout(() => clearInterval(interval), 600000);
    },

    installNewCore: async () => {
        const { googleUser } = get();
        if (!googleUser || !googleUser.accessToken) return;

        set({ isConnecting: true, error: null, installStatus: { step: '🔴 [v4.22-PROBE] INICIANDO_IGNICION...', progress: 5 } });
        console.log('🔴 [v4.22-PROBE] INICIANDO IGNICIÓN INDRA CORE...');
        try {
            const result = await OrchestratorService.installCore(
                googleUser.accessToken, 
                googleUser.email,
                (step, progress) => {
                    set({ installStatus: { step, progress } });
                }
            );

            if (result.ok) {
                const { core_url, satellite_key } = result.manifest;
                await get().setCoreConnection(core_url, satellite_key);
                toastEmitter.success('Indra ha sido instalado con éxito.');
            } else {
                if (result.error === 'AUTORIZACION_PENDIENTE') {
                    const { satellite_key } = result.manifest || {};
                    set({ 
                        isConnecting: false, 
                        error: 'AUTORIZACION_PENDIENTE',
                        pendingCoreUrl: result.coreUrl,
                        pendingEditorUrl: `https://script.google.com/home/projects/${result.manifest.script_id}/edit`,
                        installStatus: { step: 'AUTORIZACIÓN REQUERIDA', progress: 97 }
                    });
                    
                    get().startAuthPoller(result.coreUrl, satellite_key);
                } else {
                    let errorMessage = result.error;
                    if (errorMessage.includes('Apps Script API')) {
                        errorMessage = 'APPS_SCRIPT_API_DISABLED';
                    } else if (errorMessage.includes('quota')) {
                        errorMessage = 'DRIVE_QUOTA_EXCEEDED';
                    } else {
                        errorMessage = `IGNITION_FAILURE: ${result.error}`;
                    }
                    set({ isConnecting: false, error: errorMessage });
                }
            }
        } catch (err) {
            set({ isConnecting: false, error: err.message });
        }
    },

    purgePreviousInstall: async (manifestId) => {
        const { googleUser } = get();
        if (!googleUser || !googleUser.accessToken) return;
        
        set({ isConnecting: true, error: null });
        try {
            if (manifestId) {
                await OrchestratorService.deleteFile(googleUser.accessToken, manifestId);
            }
            await OrchestratorService.purgeGhostPersistence(googleUser.accessToken);
            set({ error: null, isConnecting: false }); 
            await get().discoverFromDrive(googleUser.accessToken); 
        } catch (err) {
            console.error('[ignition_slice] Purge failed:', err);
            set({ isConnecting: false, error: 'FALLO_AL_PURGAR_RASTRO' });
        }
    },

    setInductionTicket: (ticketId, snapshot = null) => {
        if (ticketId) {
            localStorage.setItem('indra-induction-ticket-id', ticketId);
        } else {
            localStorage.removeItem('indra-induction-ticket-id');
        }

        if (snapshot) {
            localStorage.setItem('indra-induction-ticket-snapshot', JSON.stringify(snapshot));
        } else {
            localStorage.removeItem('indra-induction-ticket-snapshot');
        }

        set({
            inductionTicketId: ticketId || null,
            inductionTicketSnapshot: snapshot || null
        });
    },

    clearInductionTicket: () => {
        localStorage.removeItem('indra-induction-ticket-id');
        localStorage.removeItem('indra-induction-ticket-snapshot');
        set({ inductionTicketId: null, inductionTicketSnapshot: null });
    },

    refreshInductionTicket: async () => {
        const { coreUrl, sessionSecret, inductionTicketId, clearInductionTicket } = get();
        if (!inductionTicketId || !coreUrl || !sessionSecret) return null;

        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'INDUCTION_STATUS',
                query: { ticket_id: inductionTicketId }
            }, coreUrl, sessionSecret);

            const ticket = result.metadata?.ticket || null;
            if (!ticket) return null;

            get().setInductionTicket(inductionTicketId, ticket);

            if (['COMPLETED', 'ERROR', 'CANCELLED'].includes(ticket.status)) {
                if (ticket.status === 'COMPLETED') {
                    setTimeout(() => clearInductionTicket(), 15000);
                }
            }

            return ticket;
        } catch (err) {
            console.warn('[ignition_slice] refreshInductionTicket failed:', err?.message || err);
            return null;
        }
    },
});
