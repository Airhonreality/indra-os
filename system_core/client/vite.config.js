import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import version from './src/version.js';

export default defineConfig({
    plugins: [react()],
    base: '/indra-os/',
    define: {
        __INDRA_VERSION__: JSON.stringify(version.INDRA_VERSION_CORE),
        __INDRA_STATUS__: JSON.stringify(version.INDRA_STATUS),
        __INDRA_DHARMA__: JSON.stringify(version.INDRA_DHARMA)
    },
    server: {
        port: 3000,
        open: true
    }
});
