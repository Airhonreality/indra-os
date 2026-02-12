/**
 * DataConventions.test.js
 * Tests unitarios para validar las convenciones de persistencia
 */

import {
    cleanArtifactForSnapshot,
    cleanRelationshipsForSnapshot,
    shouldPersistField,
    getCleaningReport,
    PERSISTENCE_RULES
} from '../DataConventions';

describe('DataConventions - Persistencia Selectiva', () => {

    test('cleanArtifactForSnapshot elimina campos volátiles', () => {
        const dirtyArtifact = {
            id: 'art_001',
            type: 'NOTION_ADAPTER',
            identity: { label: 'Test Node' },
            position: { x: 100, y: 200 },
            config: { databaseId: 'xyz' },

            // Campos que DEBEN eliminarse
            _isDirty: true,
            _simulated: false,
            _liveData: { price: 1500 },
            _cache: { foo: 'bar' },
            _fetching: false,
            _error: null
        };

        const clean = cleanArtifactForSnapshot(dirtyArtifact);

        // Verificar que se preservaron campos core
        expect(clean.id).toBe('art_001');
        expect(clean.type).toBe('NOTION_ADAPTER');
        expect(clean.identity).toEqual({ label: 'Test Node' });
        expect(clean.position).toEqual({ x: 100, y: 200 });
        expect(clean.config).toEqual({ databaseId: 'xyz' });

        // Verificar que se eliminaron campos volátiles
        expect(clean._isDirty).toBeUndefined();
        expect(clean._simulated).toBeUndefined();
        expect(clean._liveData).toBeUndefined();
        expect(clean._cache).toBeUndefined();
        expect(clean._fetching).toBeUndefined();
        expect(clean._error).toBeUndefined();
    });

    test('cleanRelationshipsForSnapshot elimina flags de UI', () => {
        const dirtyRelationships = [
            {
                id: 'rel_001',
                source: 'art_001',
                target: 'art_002',
                type: 'DATA_FLOW',
                _isDirty: true,
                _uiState: { selected: true }
            }
        ];

        const clean = cleanRelationshipsForSnapshot(dirtyRelationships);

        expect(clean).toHaveLength(1);
        expect(clean[0].id).toBe('rel_001');
        expect(clean[0].source).toBe('art_001');
        expect(clean[0].target).toBe('art_002');
        expect(clean[0]._isDirty).toBeUndefined();
        expect(clean[0]._uiState).toBeUndefined();
    });

    test('shouldPersistField identifica correctamente campos', () => {
        // Campos que siempre se persisten
        expect(shouldPersistField('id')).toBe(true);
        expect(shouldPersistField('type')).toBe(true);
        expect(shouldPersistField('position')).toBe(true);

        // Campos que nunca se persisten
        expect(shouldPersistField('_isDirty')).toBe(false);
        expect(shouldPersistField('_liveData')).toBe(false);
        expect(shouldPersistField('_cache')).toBe(false);
    });

    test('getCleaningReport genera reporte correcto', () => {
        const artifact = {
            id: 'art_001',
            type: 'NOTE',
            position: { x: 0, y: 0 },
            _isDirty: true,
            _liveData: {}
        };

        const report = getCleaningReport(artifact);

        expect(report.removed).toContain('_isDirty');
        expect(report.removed).toContain('_liveData');
        expect(report.preserved).toContain('id');
        expect(report.preserved).toContain('type');
        expect(report.preserved).toContain('position');
    });

    test('Preserva userContent (datos del usuario)', () => {
        const artifact = {
            id: 'art_note_001',
            type: 'NOTE',
            userContent: {
                note: 'Precio aprobado: $1500',
                approvedBy: 'Javier'
            },
            _liveData: { apiData: 'volatile' }
        };

        const clean = cleanArtifactForSnapshot(artifact);

        expect(clean.userContent).toEqual({
            note: 'Precio aprobado: $1500',
            approvedBy: 'Javier'
        });
        expect(clean._liveData).toBeUndefined();
    });

    test('Preserva config del adapter (configuración estática)', () => {
        const artifact = {
            id: 'art_notion_001',
            type: 'NOTION_ADAPTER',
            config: {
                databaseId: 'abc123',
                fields: ['precio', 'fecha']
            },
            _liveData: {
                lastFetchedPrice: 1500
            }
        };

        const clean = cleanArtifactForSnapshot(artifact);

        expect(clean.config).toEqual({
            databaseId: 'abc123',
            fields: ['precio', 'fecha']
        });
        expect(clean._liveData).toBeUndefined();
    });
});
