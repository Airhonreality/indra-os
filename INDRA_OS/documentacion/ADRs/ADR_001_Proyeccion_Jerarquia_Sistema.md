# ADR 001: Arquitectura de Proyección de Jerarquía del Sistema

*   **Estado:** Aceptado
*   **Fecha:** 2026-02-02
*   **Contexto:** El sistema OrbitalCore sobre Google Apps Script sufre de latencia inherente (~2s por llamada), lo que impide una experiencia "SPA reactiva" si se navega directamente en Drive.
*   **Decisión:** Adoptar una arquitectura de **"Proyección de Jerarquía del Sistema"**.
    *   **Backend:** Genera un árbol JSON (la "Proyección") que mapea la estructura completa de archivos desde la Raíz (Root) una sola vez.
    *   **Frontend:** Descarga esta Proyección y navega por ella en memoria (0ms latencia). Solo se conecta al Backend para acciones de escritura o para abrir contenidos de archivos pesados.
    *   **Jerarquía:** Se define una ley estricta (`System_Hierarchy.gs`) que clasifica los objetos en `ROOT` (Raíz), `DIRECTORY` (Directorio) o `FILE` (Archivo).
*   **Consecuencias:**
    *   Mejora radical en la percepción de velocidad de navegación.
    *   Requiere lógica de invalidación de caché (crear un archivo requiere regenerar o parchear la Proyección local).
    *   Separación clara entre la "Soberanía de Datos" (estructura física) y la "Realidad de la UI" (vista proyectada).
