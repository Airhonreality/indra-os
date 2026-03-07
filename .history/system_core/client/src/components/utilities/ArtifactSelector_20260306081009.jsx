import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { executeDirective } from '../../services/directive_executor.js';
import { useAppState } from '../../state/app_state.js';
import { IndraIcon } from './IndraIcons.jsx';

// ── Mapa determinista de class canónica a ícono (DATA_CONTRACTS §2.3) ──────────
const CLASS_ICONS = {
    FOLDER: 'FOLDER',
    TABULAR: 'TABLE',
    DOCUMENT: 'DOCUMENT',
    DATA_SCHEMA: 'RESONANCE',
    SYSTEM: 'CORE',
    SILO: 'Source',
    LOGIC_ENGINE: 'FORMULA',
    ACCOUNT_IDENTITY: 'CORE',
    WORKSPACE: 'CORE',
    PIN: 'Pin'
};

// ── Categorías de Pestañas (Filtrado Semántico) ─────────────────────────────
const TABS = [
    { id: 'PINS', label: 'Escenario', icon: 'Pin' },
    { id: 'ALL', label: 'Trastero', icon: 'Source' },
    { id: 'DOCUMENT', label: 'Diseños', icon: 'DOCUMENT', classes: ['DOCUMENT', 'DATA_SCHEMA'] },
    { id: 'TABULAR', label: 'Datos', icon: 'TABLE', classes: ['TABULAR'] },
    { id: 'FOLDER', label: 'Estructura', icon: 'FOLDER', classes: ['FOLDER', 'SILO'] },
];

// Clases que permiten navegar hacia adentro (drill-down).
const NAVIGABLE_CLASSES = new Set(['FOLDER', 'SILO']);

/**
 * resolveLabel: Extrae el nombre visible de un átomo de forma determinista.
 */
function resolveLabel(item) {
    return (item?.handle?.label) || item?.id || '—';
}

/**
 * ArtifactSelector: Explorador Universal de Infraestructura y Objetos.
 */
export default function ArtifactSelector({
    title = 'Seleccionar Artefacto',
    onSelect,
    onCancel,
    filter = {},
    mode = 'modal', // 'modal' | 'drawer'
    initialContext = null
}) {
    const { services: manifest, pins, addPin, removePin, isPinned, activeWorkspaceId, coreUrl, sessionSecret } = useAppState();

    const [contextStack, setContextStack] = useState(initialContext ? [initialContext] : []);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = no hay búsqueda activa
    const [activeTab, setActiveTab] = useState(pins?.length > 0 ? 'PINS' : 'ALL');
    const [counts, setCounts] = useState({ PINS: pins?.length || 0, ALL: 0, DOCUMENT: 0, TABULAR: 0, FOLDER: 0 });
    const searchDebounce = useRef(null);

    useEffect(() => {
        if (initialContext) {
            setContextStack(prev => {
                if (prev.length > 0 && prev[0].id === initialContext.id && prev[0].provider === initialContext.provider) {
                    return prev;
                }
                return [initialContext];
            });
        } else if (mode === 'drawer') {
            setContextStack([]);
        }
    }, [initialContext, mode]);

    const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : null;

    const loadLevel = useCallback(async () => {
        setLoading(true);
        setSelectedItem(null);
        try {
            if (!currentContext) {
                setItems(manifest || []);
            } else {
                const { items: result } = await executeDirective({
                    provider: currentContext.provider,
                    protocol: 'HIERARCHY_TREE',
                    context_id: currentContext.id
                }, coreUrl, sessionSecret);
                setItems(result || []);
            }
        } catch (err) {
            console.error('[ArtifactSelector] Error loading level:', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [currentContext, manifest]);

    useEffect(() => {
        const newCounts = {
            PINS: pins.length,
            ALL: items.length,
            DOCUMENT: 0,
            TABULAR: 0,
            FOLDER: 0
        };
        items.forEach(it => {
            if (TABS[2].classes.includes(it.class)) newCounts.DOCUMENT++;
            if (TABS[3].classes.includes(it.class)) newCounts.TABULAR++;
            if (TABS[4].classes.includes(it.class)) newCounts.FOLDER++;
        });
        setCounts(newCounts);
    }, [items, pins]);

    useEffect(() => {
        setSearchTerm('');
        setSearchResults(null);
        loadLevel();
    }, [loadLevel]);

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        clearTimeout(searchDebounce.current);
        if (!term.trim()) {
            setSearchResults(null);
            return;
        }
        if (!currentContext) return;
        searchDebounce.current = setTimeout(async () => {
            setLoading(true);
            try {
                const { items: results } = await executeDirective({
                    provider: currentContext.provider,
                    protocol: 'SEARCH_DEEP',
                    query: { search_term: term.trim() }
                }, coreUrl, sessionSecret);
                setSearchResults(results || []);
            } catch (err) {
                console.error('[ArtifactSelector] SEARCH_DEEP error:', err);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    };

    const handleItemClick = (item) => {
        if (NAVIGABLE_CLASSES.has(item.class)) {
            setContextStack(prev => [...prev, item]);
        } else {
            setSelectedItem(item);
        }
    };

    const handleBack = () => {
        setContextStack(prev => prev.slice(0, -1));
    };

    const goToLevel = (index) => {
        setContextStack(prev => prev.slice(0, index + 1));
    };

    const goToRoot = () => {
        setContextStack([]);
        setSearchResults(null);
        setSearchTerm('');
    };

    const handlePinToggle = async (e, item) => {
        e.stopPropagation();
        const pinned = isPinned(item.id, item.provider || currentContext?.provider);
        if (pinned) {
            removePin(item.id, item.provider || currentContext?.provider);
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_UNPIN',
                    workspace_id: activeWorkspaceId,
                    context_id: item.id
                }, coreUrl, sessionSecret);
            } catch (err) { console.error("Error unpinning:", err); }
        } else {
            addPin(item);
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'SYSTEM_PIN',
                    workspace_id: activeWorkspaceId,
                    data: { atom: item }
                }, coreUrl, sessionSecret);
            } catch (err) { console.error("Error pinning:", err); }
        }
    };

    const isSelectable = (item) => {
        if (NAVIGABLE_CLASSES.has(item.class)) return false;
        if (filter.class && item.class !== filter.class) return false;
        if (filter.protocols && filter.protocols.length > 0) {
            const itemProtocols = item.protocols || [];
            if (!filter.protocols.some(p => itemProtocols.includes(p))) return false;
        }
        return true;
    };

    const filterByTab = (itemList) => {
        if (activeTab === 'PINS') {
            return pins.filter(p => isSelectable(p));
        }
        if (activeTab === 'ALL') {
            if (!currentContext) {
                const combined = [
                    ...pins.map(p => ({ ...p, _isPin: true })),
                    ...itemList
                ];
                return combined.filter((it, idx, self) =>
                    idx === self.findIndex(t => t.id === it.id && t.provider === it.provider)
                );
            }
            return itemList;
        }
        const targetTab = TABS.find(t => t.id === activeTab);
        return itemList.filter(item => targetTab.classes?.includes(item.class));
    };

    const rawItems = searchResults !== null ? searchResults : items;
    const displayedItems = filterByTab(rawItems);

    return (
        <div
            className={mode === 'drawer' ? "artifact-explorer-drawer" : "artifact-selector"}
            role={mode === 'modal' ? "dialog" : "complementary"}
            aria-modal={mode === 'modal' ? "true" : undefined}
            aria-label={mode === 'drawer' ? title : undefined}
        >
            <div className={mode === 'drawer' ? "artifact-explorer-drawer__inner anim-fade-in" : "artifact-selector__modal anim-fade-in"}>

                {/* ── Header + Breadcrumb ── */}
                <header className="artifact-selector__header">
                    <div className="hierarchy-header-top">
                        <h3 className="artifact-selector__title">
                            {mode === 'drawer'
                                ? `Explorando ${resolveLabel(contextStack[0]) || '...'}`
                                : title}
                        </h3>
                    </div>

                    <div className="artifact-selector__path">
                        <span className="artifact-selector__crumb" onClick={goToRoot}>
                            Indra
                        </span>
                        {contextStack.map((node, i) => (
                            <Fragment key={node.id || i}>
                                <span className="artifact-selector__path-sep">/</span>
                                <span
                                    className="artifact-selector__crumb"
                                    onClick={() => goToLevel(i)}
                                >
                                    {resolveLabel(node)}
                                </span>
                            </Fragment>
                        ))}
                    </div>

                    {currentContext && (
                        <div className="hierarchy-search">
                            <IndraIcon name="SEARCH" className="hierarchy-search__icon" />
                            <input
                                type="text"
                                className="hierarchy-search__input"
                                placeholder={`Buscar en ${resolveLabel(currentContext)}...`}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    className="hierarchy-search__clear"
                                    onClick={() => { setSearchTerm(''); setSearchResults(null); }}
                                    aria-label="Limpiar búsqueda"
                                >✕</button>
                            )}
                        </div>
                    )}

                    {items.length > 0 && (
                        <nav className="hierarchy-tabs">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`hierarchy-tab mca-grid ${activeTab === tab.id ? 'hierarchy-tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <div className="mca-nucleus">
                                        <IndraIcon name={tab.icon} className="hierarchy-tab__icon" />
                                    </div>
                                    <div className="mca-orbital">
                                        {counts[tab.id] > 0 && (
                                            <span className="hierarchy-tab__badge">{counts[tab.id]}</span>
                                        )}
                                    </div>
                                    <div className="mca-semantic">
                                        <span className="mca-truncate">{tab.label}</span>
                                    </div>
                                </button>
                            ))}
                        </nav>
                    )}
                </header>

                <main className={mode === 'drawer' ? "artifact-explorer-drawer__content" : "artifact-selector__content"}>
                    {loading ? (
                        <div className="artifact-selector__loading">
                            Cargando...
                        </div>
                    ) : (
                        <ul className="artifact-selector__list">
                            {contextStack.length > 0 && searchResults === null && (
                                <li
                                    className="artifact-selector__item artifact-selector__item--back"
                                    onClick={handleBack}
                                >
                                    <span className="artifact-selector__icon">
                                        <IndraIcon name="ArrowLeft" />
                                    </span>
                                    <span className="artifact-selector__name">Regresar</span>
                                </li>
                            )}

                            {displayedItems.length === 0 && (
                                <li className="artifact-selector__empty">
                                    {searchResults !== null
                                        ? `Sin resultados para "${searchTerm}"`
                                        : 'Sin elementos para mostrar.'}
                                </li>
                            )}

                            {displayedItems.map(item => {
                                const active = selectedItem?.id === item.id;
                                const selectable = isSelectable(item);
                                const navigable = NAVIGABLE_CLASSES.has(item.class);
                                const dimmed = !selectable && !navigable;

                                return (
                                    <li
                                        key={item.id}
                                        className={[
                                            'artifact-selector__item',
                                            active ? 'artifact-selector__item--active' : '',
                                            dimmed ? 'artifact-selector__item--dimmed' : '',
                                            item._isPin ? 'artifact-selector__item--pinned' : ''
                                        ].join(' ')}
                                        onClick={() => handleItemClick(item)}
                                        title={resolveLabel(item)}
                                    >
                                        <span className="artifact-selector__icon">
                                            <IndraIcon name={CLASS_ICONS[item.class] || 'Source'} />
                                        </span>
                                        <div className="artifact-selector__name">
                                            {resolveLabel(item)}
                                        </div>
                                        <div className="artifact-selector__meta">
                                            {item._isPin && <span className="pin-badge">Escenario</span>}
                                            {item.class}
                                        </div>

                                        {selectable && (
                                            <button
                                                className={`pin-btn ${isPinned(item.id, item.provider || currentContext?.provider) ? 'pin-btn--active' : ''}`}
                                                onClick={(e) => handlePinToggle(e, item)}
                                                title="Anclar al Workspace"
                                            >
                                                ◈
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </main>

                <footer className="artifact-selector__footer">
                    <div className="artifact-selector__status">
                        {loading ? 'Cargando...' : 'Sistema Nominal'}
                    </div>
                    <button className="btn btn--secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button
                        className="artifact-selector__btn-select"
                        disabled={!selectedItem}
                        onClick={() => selectedItem && onSelect(selectedItem)}
                    >
                        {mode === 'drawer' ? 'Abrir Átomo' : 'Vincular Artefacto'}
                    </button>
                </footer>

            </div>
        </div>
    );
}
