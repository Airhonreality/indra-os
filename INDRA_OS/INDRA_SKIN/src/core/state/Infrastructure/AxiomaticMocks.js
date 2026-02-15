/**
 * 🃏 PROJECTION MOCK SUITE (Axiomatic Fallback System)
 * DHARMA: "Si la realidad falla, la imaginación sostiene el puente."
 * 
 * PROPÓSITO: Proveer estructuras de datos sintéticas pero semánticamente correctas
 * para evitar colapsos visuales (Empty States) cuando los adaptadores fallan o están vacíos.
 */

export const MOCK_SUITE = {
    // --- COMUNICACIÓN UNIFICADA ---
    MAIL: {
        threads: [
            { id: 'm1', sender: 'Indra Protocol', subject: 'Welcome to the Nexus', preview: 'Initial synchronization estab...', time: 'Now', unread: true, type: 'MAIL' },
            { id: 'm2', sender: 'System Core', subject: 'Weekly Digest', preview: 'Performance metrics are stable.', time: '10:00 AM', unread: false, type: 'MAIL' },
            { id: 'm3', sender: 'Void Observer', subject: 'Anomaly Detected', preview: 'Sector 7 is showing irregular...', time: 'Yesterday', unread: true, type: 'MAIL' }
        ]
    },
    MESSAGING: {
        threads: [
            { id: 'c1', sender: 'Sarah Connor', preview: 'Are you online?', time: '10:05 AM', unread: true, type: 'CHAT' },
            { id: 'c2', sender: 'Dev Team', preview: 'Deployment successful.', time: '09:30 AM', unread: false, type: 'CHAT' }
        ]
    },
    SOCIAL: {
        feed: [
            { id: 's1', user: 'Design Bot', content: 'New layout patterns available.', likes: 42, type: 'POST' },
            { id: 's2', user: 'System', content: 'v2.0 is live.', likes: 128, type: 'ANNOUNCEMENT' }
        ]
    },

    // --- ALMACENAMIENTO Y ESTRUCTURA ---
    DRIVE: {
        items: [
            { id: 'd1', name: 'Project Alpha', type: 'DIRECTORY', mimeType: 'application/vnd.google-apps.folder', lastUpdated: 'Today' },
            { id: 'd2', name: 'Specs.pdf', type: 'FILE', mimeType: 'application/pdf', lastUpdated: 'Yesterday' },
            { id: 'd3', name: 'Budget.xlsx', type: 'FILE', mimeType: 'application/vnd.google-apps.spreadsheet', lastUpdated: 'Mon' }
        ]
    },
    NOTION: {
        items: [
            { id: 'n1', name: 'Product Roadmap', type: 'PAGE', url: 'notion://mock/1', lastUpdated: 'Today' },
            { id: 'n2', name: 'Design System', type: 'Database', url: 'notion://mock/2', lastUpdated: '3 days ago' },
            { id: 'n3', name: 'Meeting Notes', type: 'PAGE', url: 'notion://mock/3', lastUpdated: 'Last week' }
        ]
    },

    // --- MEDIA & TIEMPO ---
    MEDIA: {
        playlist: [
            { id: 'v1', title: 'Demo Reel 2026', duration: '02:30', type: 'VIDEO' },
            { id: 'a1', title: 'System Ambience', duration: '45:00', type: 'AUDIO' }
        ]
    },
    CALENDAR: {
        events: [
            { id: 'e1', title: 'Deep Work Session', start: '10:00', end: '12:00', type: 'FOCUS' },
            { id: 'e2', title: 'Team Sync', start: '14:00', end: '14:30', type: 'MEETING' }
        ]
    }
};

/**
 * Inyector Inteligente de Mocks
 * @param {string} archetype - El arquetipo a rescatar
 * @param {string} domain - El dominio (opcional, para mayor precisión)
 * @returns {object} La estructura de datos mockeada
 */
export const injectAxiomaticMock = (archetype, domain = 'SYSTEM') => {
    console.warn(`[AxiomaticFallback] 🛡️ Injecting Mock Data for ${archetype} (${domain})`);

    // 1. Búsqueda Directa por Arquetipo
    if (MOCK_SUITE[archetype]) return MOCK_SUITE[archetype];

    // 2. Inferencia por Dominio
    if (domain === 'COMMUNICATION') return { ...MOCK_SUITE.MAIL, ...MOCK_SUITE.MESSAGING };
    if (domain === 'SENSING') return MOCK_SUITE.Drive;

    // 3. Fallback Genérico
    return { items: [], message: 'No mock data available for this archetype.' };
};

export default MOCK_SUITE;



