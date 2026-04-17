import { createContext, useContext, useState } from 'react';

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
    const [selectedId, setSelectedId] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);

    const selectNode = (id) => setSelectedId(id);
    const deselect = () => setSelectedId(null);
    const setHover = (id) => setHoveredId(id);

    return (
        <SelectionContext.Provider value={{
            selectedId,
            hoveredId,
            selectNode,
            deselect,
            setHover
        }}>
            {children}
        </SelectionContext.Provider>
    );
}

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
};
