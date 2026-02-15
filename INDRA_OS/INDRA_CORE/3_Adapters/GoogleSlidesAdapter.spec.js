/**
 * 🧪 GoogleSlidesAdapter.spec.js
 */

function testGoogleSlidesAdapter_Interface() {
    const mockErrorHandler = {
        createError: (code, msg) => ({ code, message: msg })
    };

    const adapter = createGoogleSlidesAdapter({
        errorHandler: mockErrorHandler
    });

    console.log('--- Testing GoogleSlidesAdapter Interface ---');
    if (typeof adapter.create !== 'function') throw new Error('Missing create()');
    if (typeof adapter.batchUpdate !== 'function') throw new Error('Missing batchUpdate()');
    if (typeof adapter.replacePlaceholders !== 'function') throw new Error('Missing replacePlaceholders()');
    if (typeof adapter.addSlide !== 'function') throw new Error('Missing addSlide()');

    return true;
}

function testGoogleSlidesAdapter_BatchLogic() {
    const mockErrorHandler = { createError: (code, msg) => ({ code, message: msg }) };
    const adapter = createGoogleSlidesAdapter({ errorHandler: mockErrorHandler });

    const originalSlides = globalThis.Slides;
    let capturedRequests = [];

    globalThis.Slides = {
        Presentations: {
            batchUpdate: (req, id) => {
                capturedRequests = req.requests;
                return { replies: [{ createSlide: { objectId: 'new-slide-id' } }] };
            }
        }
    };

    try {
        adapter.addSlide({
            presentationId: 'mock-pres',
            predefinedLayout: 'TITLE'
        });

        if (capturedRequests.length === 0) throw new Error('No requests generated for addSlide');
        if (!capturedRequests[0].createSlide) throw new Error('Incorrect request type for addSlide');

        console.log('✅ Slides Batch Logic PASSED');
        return true;
    } finally {
        globalThis.Slides = originalSlides;
    }
}





