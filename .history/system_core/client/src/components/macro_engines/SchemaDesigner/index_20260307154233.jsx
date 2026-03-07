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

import { LayersPanel } from './LayersPanel';
import { BlueprintCanvas } from './BlueprintCanvas';
import { DNAInspector } from './DNAInspector';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useLexicon } from '../../../services/lexicon';

export function SchemaDesigner({ atom, bridge }) {
    const [localAtom, setLocalAtom] = useState(atom);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    const lastSavedRef = React.useRef(JSON.stringify(atom));
    const hasHydrated = React.useRef(false);

    // 1. Hidratación Única (Sinceridad Estructural)
    useEffect(() => {
        if (hasHydrated.current && localAtom.id === atom.id) return;

        const hydrate = async () => {
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_READ',
                    context_id: atom.id
                }, coreUrl, sessionSecret);
                if (result.items?.[0]) {
                    const fullAtom = result.items[0];
                    setLocalAtom(fullAtom);
                    lastSavedRef.current = JSON.stringify(fullAtom);
                    hasHydrated.current = true;
                }
            } catch (err) {
                console.error('[SchemaDesigner] Hydration failed:', err);
            }
        };
        hydrate();
    }, [atom.id, coreUrl, sessionSecret]);

    // 2. Persistencia Silenciosa (Optimistic)
    useEffect(() => {
        const currentData = JSON.stringify(localAtom);
        if (currentData === lastSavedRef.current) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                const result = await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_UPDATE',
                    context_id: atom.id,
                    data: localAtom
                }, coreUrl, sessionSecret);

                if (result.items?.[0]) {
                    lastSavedRef.current = JSON.stringify(result.items[0]);
                }
            } catch (err) {
                console.error('[SchemaDesigner] Auto-save failed:', err);
            } finally {
                setIsSaving(false);
            }
        }, 2000); // 2s para mayor estabilidad al escribir

        return () => clearTimeout(timer);
    }, [localAtom, atom.id, coreUrl, sessionSecret]);

    const fields = localAtom.payload?.fields || [];

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
        <div className="stack" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-void)', color: 'white', zIndex: 100, overflow: 'hidden' }}>

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
                        icon="CLOSE"
                        label="EXIT_DESIGNER"
                        onClick={() => bridge.close()}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        requiresHold={false}
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
