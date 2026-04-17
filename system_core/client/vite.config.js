import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { INDRA_VERSION_CORE, INDRA_STATUS, INDRA_DHARMA } from './src/version.js';

export default defineConfig({
    plugins: [react()],
    base: '/indra-os/',
    define: {
        __INDRA_VERSION__: JSON.stringify(INDRA_VERSION_CORE),
        __INDRA_STATUS__: JSON.stringify(INDRA_STATUS),
        __INDRA_DHARMA__: JSON.stringify(INDRA_DHARMA)
    },
    server: {
        port: 3000,
        open: true
    }
});
