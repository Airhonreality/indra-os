/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner.jsx
 * RESPONSABILIDAD: El Orquestador de la Arquitectura de Datos.
 *
 * DHARMA:
 *   - Sinceridad Estructural: Refleja el AST del esquema sin ruido.
 *   - Transparencia Core: Se dobla ante los protocolos ATOM_READ/UPDATE del GAS.
 * 
 * AXIOMAS:
 *   - El esquema es una colección recursiva de campos.
 *   - No inventa lógica; delega el procesamiento al Bridge.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { LayersPanel } from './SchemaDesigner/LayersPanel';
import { BlueprintCanvas } from './SchemaDesigner/BlueprintCanvas';
import { DNAInspector } from './SchemaDesigner/DNAInspector';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';
import { useLexicon } from '../../services/lexicon';

export function SchemaDesigner({ atom }) {
    const { coreUrl, sessionSecret, closeArtifact } = useAppState();
    const [localAtom, setLocalAtom] = useState(atom);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    // Hidratación Inicial síncrona con el Back
    useEffect(() => {
        const hydrate = async () => {
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_READ',
                    context_id: atom.id
                }, coreUrl, sessionSecret);
                if (result.items?.[0]) setLocalAtom(result.items[0]);
            } catch (err) {
                console.error('[SchemaDesigner] Hydration failed:', err);
            }
        };
        hydrate();
    }, [atom.id, coreUrl, sessionSecret]);

    const fields = localAtom.payload?.fields || [];

    const handleUpdate = async (newData) => {
        setIsSaving(true);
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: atom.id,
                data: newData
            }, coreUrl, sessionSecret);
            if (result.items?.[0]) setLocalAtom(result.items[0]);
        } catch (err) {
            console.error('[SchemaDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // AUTOGUARDADO (Optimistic Persistence)
    useEffect(() => {
        // No guardar si el átomo local es idéntico al último guardado o si está vacío
        if (!localAtom || localAtom === atom) return;

        const timer = setTimeout(() => {
            handleUpdate(localAtom);
        }, 1500); // 1.5s de debounce para paz electromagnética

        return () => clearTimeout(timer);
    }, [localAtom]);

    const updateFields = (newFields) => {
        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, fields: newFields }
        }));
    };

    const updateLabel = (newLabel) => {
        setLocalAtom(prev => ({
            ...prev,
            handle: { ...prev.handle, label: newLabel }
        }));
    };

    return (
        <div className="fill stack" style={{ background: 'var(--color-bg-void)', color: 'white', overflow: 'hidden' }}>

            {/* ── HEADER HUD (Resonancia) ── */}
            <header className="spread glass" style={{
                padding: 'var(--space-4) var(--space-8)',
                borderBottom: '1px solid var(--color-border-strong)',
                zIndex: 100
            }}>
                <div className="shelf--loose fill">
                    <IndraIcon name="SCHEMA" size="24px" style={{ color: 'var(--color-accent)' }} />
                    <div className="stack--tight fill" style={{ maxWidth: '400px' }}>
                        <input
                            type="text"
                            value={localAtom.handle?.label || ''}
                            onChange={(e) => updateLabel(e.target.value)}
                            placeholder="SCHEMA_NAME_REQUIRED..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid transparent',
                                color: 'white',
                                fontSize: 'var(--text-lg)',
                                fontFamily: 'var(--font-mono)',
                                width: '100%',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-accent)'}
                            onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                        />
                        <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                            AST_RESONANCE: {isSaving ? 'SYNCING...' : 'STABLE'} // ID: {atom.id}
                        </span>
                    </div>
                </div>

                <div className="shelf">
                    <button
                        className={`btn btn--sm ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                        style={{ border: 'none', opacity: previewMode ? 1 : 0.6 }}
                        onClick={() => setPreviewMode(!previewMode)}
                    >
                        {previewMode ? 'EDIT_MODE' : 'PREVIEW_MODE'}
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 var(--space-2)' }}></div>

                    <IndraActionTrigger
                        icon="OK"
                        label="SAVE_RESONANCE"
                        onClick={handleSave}
                        color="var(--color-accent)"
                        activeColor="var(--color-accent)"
                    />

                    <IndraActionTrigger
                        icon="CLOSE"
                        label="DISCARD_CHANGES"
                        onClick={closeArtifact}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        requiresHold={true}
                        holdTime={800}
                    />
                </div>
            </header>

            {/* ── MAIN DESIGN WORKSPACE ── */}
            <main className="fill shelf" style={{ overflow: 'hidden' }}>

                {/* 1. LAYERS PANEL (Navegación Jerárquica) */}
                {!previewMode && (
                    <LayersPanel
                        fields={fields}
                        setFields={updateFields}
                        selectedId={selectedFieldId}
                        onSelect={setSelectedFieldId}
                    />
                )}

                {/* 2. BLUEPRINT CANVAS (Previsualización Viva) */}
                <BlueprintCanvas
                    fields={fields}
                    selectedId={selectedFieldId}
                    onSelect={setSelectedFieldId}
                    previewMode={previewMode}
                />

                {/* 3. DNA INSPECTOR (Propiedades Atómicas) */}
                {!previewMode && selectedFieldId && (
                    <DNAInspector
                        field={fields.find(f => f.id === selectedFieldId)}
                        onUpdate={(updatedField) => {
                            const newFields = fields.map(f => f.id === selectedFieldId ? updatedField : f);
                            updateFields(newFields);
                        }}
                    />
                )}
            </main>
        </div>
    );
}
