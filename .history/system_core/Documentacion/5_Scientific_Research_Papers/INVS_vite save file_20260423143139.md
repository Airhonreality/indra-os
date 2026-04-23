# 🏛️ INDRA SCIENTIFIC RESEARCH: VITE PERSISTENCE ANOMALY (INVS-042)

## 1. ABSTRACT
Esta investigación documenta un fenómeno de **Recursión Fantasma** detectado durante la implementación de un sistema de persistencia de archivos locales (Handshake Persistence) a través de un middleware de Vite. El sistema falla al resolver rutas relativas dentro de la carpeta `public`, creando estructuras de directorios redundantes y comprometiendo la portabilidad del satélite.

## 2. EL FENÓMENO: RECURSIÓN VIRTUAL
Al ejecutar una petición `POST` desde el satélite hacia el endpoint `/indra-sync/save-file`, el middleware de Vite interpreta la ruta de destino de forma anómala.

### 2.1 Evidencia del Error
*   **Ruta Esperada**: `system_core/client/public/indra-satellite-protocol/indra_config.js`
*   **Ruta Resultante (Anomalía)**: `system_core/client/public/indra-satellite-protocol/public/indra-satellite-protocol/indra_config.js`

El sistema parece estar concatenando la ruta relativa enviada por el cliente con la ruta virtual que Vite ya está sirviendo, resultando en una estructura de carpetas tipo "Inception".

## 3. HIPÓTESIS DEL FALLO (ROOT CAUSE)
El middleware en `vite.config.js` utiliza:
```javascript
const absolutePath = path.resolve(__dirname, filePath);
```
Se sospecha que:
1.  `__dirname` se resuelve correctamente a la raíz del cliente.
2.  Sin embargo, si `filePath` comienza con `public/`, y el comando de ejecución de Vite se lanza desde un contexto que ya incluye `public` en su resolución simbólica, se produce una duplicación de nodos en el árbol de archivos.

## 4. IMPACTO EN LA PORTABILIDAD
Para diagnosticar el error, se implementó una **Ruta Absoluta de Emergencia** (`c:/Users/...`). 
*   **Logro**: La persistencia del Handshake funciona y es determinista en el PC local.
*   **Fallo**: El sistema se vuelve **No-Portátil**. Si el satélite se instala en otro entorno, el "sellado" fallará catastróficamente.

## 5. LÍNEAS DE INVESTIGACIÓN FUTURA (DEEP RESEARCH)
*   **Agnosticismo de Raíz**: Investigar el uso de `process.cwd()` en lugar de `__dirname` para estandarizar la raíz del proyecto.
*   **Mapeo de Rutas de Vite**: Determinar cómo Vite maneja los punteros a la carpeta `public` dentro de su propio middleware.
*   **Normalización del Path**: Implementar una función de limpieza que elimine el prefijo `public/` si ya está detectado en la raíz del transportista.

## 6. CONCLUSIÓN PROVISIONAL
La persistencia estructural ha sido lograda, pero la elegancia del sistema está comprometida. Se requiere una refactorización de la resolución de rutas para restaurar la **Soberanía Portátil** de Indra.

---
**Investigado por**: Antigravity (AI Architect) & Indra Core Owner
**Fecha**: 2026-04-23
**Estado**: DIAGNÓSTICO SELLADO - REFACTORIZACIÓN PENDIENTE
