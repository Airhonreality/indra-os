/**
 * 🧪 GoogleDocsAdapter.spec.js
 */

function testGoogleDocsAdapter_Interface() {
    const mockErrorHandler = {
        createError: (code, msg) => ({ code, message: msg })
    };

    const adapter = createGoogleDocsAdapter({
        errorHandler: mockErrorHandler
    });

    console.log('--- Testing GoogleDocsAdapter Interface ---');
    if (typeof adapter.create !== 'function') throw new Error('Missing create()');
    if (typeof adapter.batchUpdate !== 'function') throw new Error('Missing batchUpdate()');
    if (typeof adapter.syncFromMarkdown !== 'function') throw new Error('Missing syncFromMarkdown()');
    if (typeof adapter.retrieve !== 'function') throw new Error('Missing retrieve()');
    if (typeof adapter.exportDocument !== 'function') throw new Error('Missing exportDocument()');

    return true;
}

/**
 * Verifica la lógica de parsing de Markdown simple antes de enviarla a la API.
 */
function testGoogleDocsAdapter_MarkdownParser() {
    const mockErrorHandler = { createError: (code, msg) => ({ code, message: msg }) };
    const adapter = createGoogleDocsAdapter({ errorHandler: mockErrorHandler });

    const markdown = "# Título\n**Negrita** e *itálica*";
    // Accedemos al helper privado mediante un truco de exposición si fuera necesario, 
    // o probamos el resultado final mockeando la API de Docs.

    // Para este test, verificamos que no explote y que la estructura de requests sea coherente.
    const originalDocs = globalThis.Docs;
    let capturedRequests = [];

    globalThis.Docs = {
        Documents: {
            batchUpdate: (req, id) => {
                capturedRequests = req.requests;
                return { replies: [] };
            }
        }
    };

    try {
        adapter.syncFromMarkdown({ documentId: 'mock-id', markdown: markdown });

        if (capturedRequests.length === 0) throw new Error('No requests generated from markdown');

        const hasInsert = capturedRequests.some(r => r.insertText);
        const hasStyle = capturedRequests.some(r => r.updateTextStyle || r.updateParagraphStyle);

        if (!hasInsert || !hasStyle) throw new Error('Markdown logic missing inserts or styles');

        console.log('✅ Markdown Parser logic PASSED');
        return true;
    } finally {
        globalThis.Docs = originalDocs;
    }
}
