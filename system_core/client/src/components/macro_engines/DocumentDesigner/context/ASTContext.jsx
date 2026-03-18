import React, { createContext, useContext } from 'react';
import { useDocumentAST } from '../hooks/useDocumentAST';

const ASTContext = createContext();

/**
 * ASTProvider
 * Proporciona el estado y las funciones de mutación del documento de forma neural.
 */
export function ASTProvider({ initialBlocks, initialVariables, initialLayoutMeta, children }) {
    const ast = useDocumentAST(initialBlocks, initialVariables, initialLayoutMeta);

    return (
        <ASTContext.Provider value={ast}>
            {children}
        </ASTContext.Provider>
    );
}

export const useAST = () => {
    const context = useContext(ASTContext);
    if (!context) {
        throw new Error('useAST must be used within an ASTProvider');
    }
    return context;
};
