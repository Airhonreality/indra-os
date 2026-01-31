import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// =============================================================================
// INDRA OS - Configuración de Compilación (Producción)
// =============================================================================
// ⚙️  PROPÓSITO: Compilar React (JSX) → HTML/CSS/JS estático para GitHub Pages
// 
// 🚫 NO ES PARA DESARROLLO LOCAL - Es el COMPILADOR de producción
// ✅ Usado por: npm run build (instalación) y GitHub Actions (deploy)
//
// 📦 PROCESO:
//    1. npm run build → Vite lee este config
//    2. Compila src/ → dist/ (archivos estáticos optimizados)
//    3. GitHub Actions sube dist/ a gh-pages
//    4. GitHub Pages sirve esos archivos al público
// =============================================================================

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // CONFIGURACIÓN DE COMPILACIÓN (npm run build)
  build: {
    target: 'es2015',  // Compatibilidad con navegadores modernos
    minify: 'terser',  // Minificación agresiva para tamaño óptimo
    sourcemap: true,   // Para debugging en producción
    rollupOptions: {
      output: {
        // Code splitting inteligente (mejor performance de carga)
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'store': ['zustand'],
          'ui': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000  // Límite de tamaño de chunk (KB)
  },
  
  // NOTA: Las secciones 'server' y 'preview' son parte del estándar de Vite
  // pero NO se usan en el flujo de instalación/deploy de INDRA OS
  server: {
    port: 5173,
    open: true
  },
  
  preview: {
    port: 4173
  },
  
  // Variables de entorno en tiempo de compilación
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString())
  }
})
