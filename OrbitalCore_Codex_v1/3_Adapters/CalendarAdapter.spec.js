/**
 * ======================================================================
 * ARTEFACTO: 3_Adapters/CalendarAdapter.spec.js
 * DHARMA: Validar el contrato axiomático del CalendarAdapter.
 * ======================================================================
 */

function _setupCalendarAdapterTests() {
    const originals = {
        CalendarApp: globalThis.CalendarApp,
        Calendar: globalThis.Calendar
    };

    let _calendarDB = {
        'primary': {
            events: []
        }
    };

    const mocks = {
        mockErrorHandler: {
            createError: (code, msg, details) => {
                const e = new Error(msg);
                e.code = code;
                e.details = details;
                return e;
            }
        }
    };

    // MOCK: CalendarApp (Servicio Integrado)
    globalThis.CalendarApp = {
        getCalendarById: (id) => {
            if (!_calendarDB[id]) _calendarDB[id] = { events: [] };
            return {
                getId: () => id,
                getName: () => `Mock Calendar ${id}`
            };
        }
    };

    // MOCK: Calendar (Servicio Avanzado / API v3)
    globalThis.Calendar = {
        Events: {
            list: (calendarId, args = {}) => {
                const cal = _calendarDB[calendarId] || { events: [] };
                let filtered = cal.events;

                // Simular filtrado por tiempo si es necesario
                if (args.timeMin) {
                    const min = new Date(args.timeMin).getTime();
                    filtered = filtered.filter(e => new Date(e.start.dateTime || e.start.date).getTime() >= min);
                }

                return {
                    items: filtered,
                    nextSyncToken: 'mock-sync-token-' + Date.now(),
                    nextPageToken: null
                };
            },
            insert: (resource, calendarId) => {
                const cal = _calendarDB[calendarId] || { events: [] };
                const newEvent = {
                    ...resource,
                    id: resource.id || 'evt_' + Math.random().toString(36).substr(2, 9),
                    updated: new Date().toISOString()
                };
                cal.events.push(newEvent);
                return newEvent;
            },
            patch: (resource, calendarId, eventId) => {
                const cal = _calendarDB[calendarId];
                if (!cal) throw new Error("Calendar not found");
                const eventIndex = cal.events.findIndex(e => e.id === eventId);
                if (eventIndex === -1) throw new Error("Event not found");

                // Estrategia Patch: Mezcla profunda básica
                const existing = cal.events[eventIndex];
                const patched = { ...existing, ...resource };
                if (resource.extendedProperties) {
                    patched.extendedProperties = {
                        private: { ...(existing.extendedProperties?.private || {}), ...(resource.extendedProperties.private || {}) },
                        shared: { ...(existing.extendedProperties?.shared || {}), ...(resource.extendedProperties.shared || {}) }
                    };
                }

                cal.events[eventIndex] = patched;
                return patched;
            },
            remove: (calendarId, eventId) => {
                const cal = _calendarDB[calendarId];
                if (!cal) throw new Error("Calendar not found");
                cal.events = cal.events.filter(e => e.id !== eventId);
            }
        }
    };

    return { mocks, originals, _db: _calendarDB };
}

function _teardownCalendarAdapterTests(originals) {
    globalThis.CalendarApp = originals.CalendarApp;
    globalThis.Calendar = originals.Calendar;
}

// ============================================================
// TESTS
// ============================================================

function testCalendarAdapter_createEvent_shouldCreateWithMetadata() {
    const setup = _setupCalendarAdapterTests();
    try {
        const adapter = createCalendarAdapter({ errorHandler: setup.mocks.mockErrorHandler });
        const payload = {
            calendarId: 'primary',
            eventPayload: {
                summary: 'Test Event',
                start: { dateTime: '2026-01-05T10:00:00Z' },
                end: { dateTime: '2026-01-05T11:00:00Z' },
                extendedProperties: {
                    private: { orbitalId: 'task-123' }
                }
            }
        };

        const result = adapter.createEvent(payload);

        assert.isNotNull(result.id, "Debe tener un ID generado.");
        assert.strictEqual(result.summary, 'Test Event');
        assert.strictEqual(result.extendedProperties.private.orbitalId, 'task-123', "Debe persistir metadatos orbitales.");

        return true;
    } finally {
        _teardownCalendarAdapterTests(setup.originals);
    }
}

function testCalendarAdapter_updateEvent_shouldUsePatch() {
    const setup = _setupCalendarAdapterTests();
    try {
        const adapter = createCalendarAdapter({ errorHandler: setup.mocks.mockErrorHandler });

        // 1. Crear evento inicial
        const initial = adapter.createEvent({
            calendarId: 'primary',
            eventPayload: {
                summary: 'Original Title',
                description: 'Original Desc',
                start: { dateTime: '2026-01-05T10:00:00Z' },
                end: { dateTime: '2026-01-05T11:00:00Z' }
            }
        });

        // 2. Patch solo el título
        const updated = adapter.updateEvent({
            calendarId: 'primary',
            eventId: initial.id,
            eventPayload: {
                summary: 'Updated Title'
            }
        });

        assert.strictEqual(updated.summary, 'Updated Title');
        assert.strictEqual(updated.description, 'Original Desc', "Debe preservar campos no tocados (PATCH).");

        return true;
    } finally {
        _teardownCalendarAdapterTests(setup.originals);
    }
}

function testCalendarAdapter_listEvents_shouldReturnSyncToken() {
    const setup = _setupCalendarAdapterTests();
    try {
        const adapter = createCalendarAdapter({ errorHandler: setup.mocks.mockErrorHandler });

        const result = adapter.listEvents({ calendarId: 'primary' });

        assert.isNotNull(result.items, "Debe retornar items.");
        assert.isNotNull(result.nextSyncToken, "Debe retornar un syncToken para sincronización incremental.");

        return true;
    } finally {
        _teardownCalendarAdapterTests(setup.originals);
    }
}

function testCalendarAdapter_deleteEvent_shouldRemove() {
    const setup = _setupCalendarAdapterTests();
    try {
        const adapter = createCalendarAdapter({ errorHandler: setup.mocks.mockErrorHandler });
        const event = adapter.createEvent({
            calendarId: 'primary',
            eventPayload: { summary: 'To be deleted', start: { date: '2026-01-06' }, end: { date: '2026-01-07' } }
        });

        adapter.deleteEvent({ calendarId: 'primary', eventId: event.id });

        const list = adapter.listEvents({ calendarId: 'primary' });
        const found = list.items.find(e => e.id === event.id);
        assert.isUndefined(found, "El evento ya no debe existir.");

        return true;
    } finally {
        _teardownCalendarAdapterTests(setup.originals);
    }
}
