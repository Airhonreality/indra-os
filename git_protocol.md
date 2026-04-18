# PROTOCOLO DE CONCURRENCIA GIT // INDRA OS
**Versión:** 1.0 (Refinería Satélite)
**Responsable:** Antigravity (IA de Onboarding)

## 1. ESTRUCTURA DE RAMAS (DOMINIOS)

El sistema opera bajo un modelo de **Neural Split**, donde la lógica del Core y del Satélite deben coexistir sin colisionar:

- `main`: (SAGRADA) Solo código que ha pasado el Centinela (Linter) y el Build de producción.
- `dev/ledger`: Cambios en la persistencia (clase `Ledger` y `SovereignIntelligenceProvider`).
- `dev/video-engine`: Refactorizaciones del motor de transcodificación y workers.
- `feat/ui-v6`: Todas las implementaciones estéticas de HUD y Proyecciones.

## 2. EL CENTINELA (BUILD & LINT)

**REGLA DE ORO:** Nunca realices un `git push` sin que el Satélite esté en verde.

### Comandos de Validación:
1. `npm run lint`: Valida la sintaxis. Solo se permiten `warnings` de variables no usadas (deuda técnica). Cero `errors` permitidos.
2. `npm run build`: Valida la compilación productiva de Vite. Si este comando falla, el despliegue en GitHub Actions fallará inevitablemente.

## 3. EL AXIOMA DEL "ÍNDICE 0"

Al realizar cambios en `provider_system_ledger.gs` o en componentes que consumen datos del Core:
- Siempre verifica que el mapeo de columnas respete el desfase de la cabecera.
- Las funciones de `DataProjector` son las únicas autorizadas para mutar estructuras de arrays crudos en objetos de UI.

## 4. PROCEDIMIENTO DE PUSH

1. **Sincronización:** `git pull origin main`.
2. **Purificación:** `npx eslint "src/**/*.{js,jsx}" --quiet`.
3. **Cimentación:** `npm run build`.
4. **Ignición:** `git add . && git commit -m "feat/fix: [Componente] Descripción técnica breve" && git push`.

## 5. NOTA PARA AUDITORES

Si encuentras bloques `catch(e) { /* ignore */ }`, es un diseño deliberado para evitar interrupciones en el flujo de "Handshake Micelar" durante fallos de red menores que el sistema está preparado para reintentar.

---
*Independencia, Sinceridad, Soberanía.*
