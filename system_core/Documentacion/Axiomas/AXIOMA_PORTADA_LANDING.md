# AXIOMA: Portada Landing y Geometría Fractal (Solar Punk Edition)

> **Dharma**: La interfaz es el primer contacto con la soberanía. Debe ser matemática, pura y resonante.

## 1. Composición Geométrica del Logo (FractalLogo)

El logo de INDRA no es una imagen; es un **motor de geometría sagrada** renderizado en tiempo real mediante `Three.js` (BufferGeometry). Sigue los siguientes principios:

### 1.1 El Proporcional Áureo (φ)
*   **Axioma**: Todo radio, longitud y gap se deriva de la Proporción Áurea (φ ≈ 1.618).
*   **Implementación**: Las dimensiones del núcleo, la longitud de los rayos y la escala de las ramificaciones se multiplican/dividen por potencias de φ.

### 1.2 El Sol Fractal (Rhizome)
*   **Estructura**: Un núcleo solar central de donde emergen 8 rayos principales (distribución radial).
*   **Ramificación**: De cada rayo nace un rizoma neuronal que sigue un modelo fractal de **L-system** de 4 generaciones.
*   **Ángulo de Divergencia**: Las ramas se separan siguiendo el **Ángulo Áureo (137.5°)**, garantizando una distribución orgánica pero matemáticamente perfecta.

### 1.3 Nodos de Geometría Sagrada (Ojos)
*   **Simbología**: En cada terminación de la red (nodos), aparece un "Ojo" conformado por la **Flor de la Vida** (círculos concéntricos y secantes).
*   **Significado**: Representa la conciencia en cada punto de la red de datos.

## 2. Arquitectura de la Página de Bienvenida (LandingView)

La página se ha modularizado para ser un "Front Desk" agnóstico de la sesión.

### 2.1 Pestañas de Conocimiento (Tabs)
1.  **BIENVENIDA**: Presentación del propósito industrial y soberano.
2.  **INSTALACIÓN**: Los dos caminos (Soberanía Local vs. Zero-Install).
3.  **ARQUITECTURA**: Esquema del flujo Core-Silo-Client.
4.  **MANUALES**: Acceso a los ADRs y Manifiestos.

### 2.2 Restricciones de UI (Ley de Aduana)
*   **Cero Texturas**: No se usan imágenes `.png` o `.jpg`. Todo es código, SVG o WebGL.
*   **Integridad Visual**: Utiliza los tokens de `ADR_004` (Cyan neón para acentos, Void para fondos).
*   **Soberanía del CSS**: Los estados de las pestañas y el hover de los botones se gestionan mediante el motor de CSS de INDRA, sin lógica de estilo inline.

## 3. Filosofía de Despliegue (Respuesta Arquitectónica)

### 3.1 El Modelo "Proyector Universal"
INDRA funciona como un proyector de realidades. El Cliente (esta web) es agnóstico del Core. 
*   **Escenario A (Libertad)**: El usuario usa una instancia pública de INDRA y se loguea con su Core.
*   **Escenario B (Soberanía)**: El usuario despliega su propio Front en GitHub Pages, eliminando cualquier dependencia de terceros.

---
*Documento generado bajo el mandato de la Geometría Sagrada.*
