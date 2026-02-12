/**
 * 🧪 GoogleDriveRestAdapter.spec.js
 */

function testGoogleDriveRestAdapter_Interface() {
    const mockErrorHandler = {
        createError: (code, msg) => ({ code, message: msg })
    };

    const mockTokenManager = {
        getToken: () => ({ apiKey: 'mock-token' })
    };

    const adapter = createGoogleDriveRestAdapter({
        errorHandler: mockErrorHandler,
        tokenManager: mockTokenManager
    });

    console.log('--- Testing GoogleDriveRestAdapter Interface ---');
    if (typeof adapter.find !== 'function') throw new Error('Missing find()');
    if (typeof adapter.retrieve !== 'function') throw new Error('Missing retrieve()');
    if (typeof adapter.store !== 'function') throw new Error('Missing store()');
    if (typeof adapter.resolvePath !== 'function') throw new Error('Missing resolvePath()');
    if (typeof adapter.createFolder !== 'function') throw new Error('Missing createFolder()');

    return true;
}

function testGoogleDriveRestAdapter_ResolvePath() {
    const mockErrorHandler = { createError: (code, msg) => ({ code, message: msg }) };
    const originalUrlFetchApp = globalThis.UrlFetchApp;

    let callCount = 0;
    globalThis.UrlFetchApp = {
        fetch: (url) => {
            callCount++;
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ files: [{ id: 'subfolder_' + callCount, name: 'part' }], id: 'new_folder' }),
                getAllHeaders: () => ({ 'Content-Type': 'application/json' })
            };
        }
    };

    try {
        const adapter = createGoogleDriveRestAdapter({ errorHandler: mockErrorHandler });
        const result = adapter.resolvePath({
            rootFolderId: 'root',
            path: 'A/B',
            accessToken: 'test',
            createIfNotExists: true
        });

        if (!result.folderId) throw new Error('Failed to resolve folderId');
        console.log('✅ ResolvePath (REST) PASSED');
        return true;
    } finally {
        globalThis.UrlFetchApp = originalUrlFetchApp;
    }
}


function testGoogleDriveRestAdapter_AuthInjection() {
    const mockErrorHandler = {
        createError: (code, msg) => ({ code, message: msg })
    };

    // Mock global UrlFetchApp for GAS environment tests
    const originalUrlFetchApp = globalThis.UrlFetchApp;
    let capturedOptions = null;

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            capturedOptions = options;
            return {
                getContentText: () => JSON.stringify({ files: [] }),
                getResponseCode: () => 200,
                getAllHeaders: () => ({ 'Content-Type': 'application/json' })
            };
        }
    };

    try {
        const adapter = createGoogleDriveRestAdapter({ errorHandler: mockErrorHandler });

        adapter.find({
            query: "name = 'test'",
            accessToken: 'valid-test-token'
        });

        if (!capturedOptions.headers.Authorization.includes('valid-test-token')) {
            throw new Error('Authorization header not injected correctly');
        }

        console.log('✅ Auth Injection PASSED');
        return true;
    } finally {
        globalThis.UrlFetchApp = originalUrlFetchApp;
    }
}
