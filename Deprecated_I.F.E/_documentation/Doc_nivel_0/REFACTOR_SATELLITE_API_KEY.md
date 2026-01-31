# 🔐 Refactorización de Seguridad: SATELLITE_API_KEY

> **Fecha:** 18 de enero de 2026  
> **Nivel:** Arquitectura Core (L7)  
> **Impacto:** Scripts de instalación y CoreBridge

---

## 📋 Resumen del Cambio

**ANTES (Arquitectura Legacy):**
- El frontend se autenticaba con una `MASTER_KEY` genérica
- Esta key era compartida y no específica para satélites
- Riesgo de exposición y falta de granularidad en permisos

**DESPUÉS (Arquitectura Refactorizada):**
- El Core genera automáticamente una `ORBITAL_CORE_SATELLITE_API_KEY` (UUID)
- Esta key es específica para la comunicación frontend ↔ backend
- Se envía en el body de cada request como `systemToken`
- Validación en `HttpEntrypoint.gs` usando `Body-Key Authentication (L7)`

---

## 🔄 Cambios en el Flujo de Instalación

### Paso Agregado: Captura de Satellite API Key

**Flujo Automático (Ideal):**
1. El script ejecuta `clasp run getSatelliteKey` después de `clasp push`
2. Extrae el UUID generado automáticamente por `SystemInitializer`
3. Lo guarda en `OrbitalCore_Codex_v1/.satellite-api-key.txt`
4. Lo incluye en el `.env` del frontend como `VITE_SATELLITE_API_KEY`

**Flujo Manual (Fallback):**
Si `clasp run` falla (problemas de permisos o clasp version), el usuario debe:
1. Ir al Google Sheet
2. Menú: `🚀 Orbital Core → 🔑 Gestionar Conexiones`
3. Buscar `ORBITAL_CORE_SATELLITE_API_KEY`
4. Copiar el valor (formato UUID: `550e8400-e29b-41d4-91e5-...`)
5. Pegarlo cuando el script lo solicite

---

## 💻 Cambios en el Código

### Backend (OrbitalCore)

**`HttpEntrypoint.gs` (línea 36):**
```javascript
// ANTES:
const expectedToken = configurator.retrieveParameter({ key: 'MASTER_KEY' });

// DESPUÉS:
const expectedToken = configurator.retrieveParameter({ key: 'ORBITAL_CORE_SATELLITE_API_KEY' });
```

**`SystemManifest.gs` (línea 197-203):**
```javascript
"ORBITAL_CORE_SATELLITE_API_KEY": {
  type: "system_generated",
  generator: { type: "uuid" },
  postInstallMessage: "Esta es tu clave de API para conectar Satélites (guárdala en un lugar seguro):"
}
```

### Frontend (INDRA_FRONT DEV)

**`CoreBridge.js` (línea 96-97):**
```javascript
// NUEVO: Incluir systemToken en el body
const SATELLITE_API_KEY = import.meta.env.VITE_SATELLITE_API_KEY;

const requestBody = {
    ...body,
    systemToken: SATELLITE_API_KEY, // Auth key para el HttpEntrypoint
    context: { ... }
};
```

**`.env` (nuevo campo):**
```bash
# Satellite API Key (autenticación con el Core)
VITE_SATELLITE_API_KEY=550e8400-e29b-41d4-91e5-a35c5bdc6c7f
```

### Scripts de Instalación

**`first-time-setup.ps1` (líneas 700-740):**
- Ejecuta `clasp run getSatelliteKey` para obtener el UUID automáticamente
- Fallback: Solicita al usuario que la copie manualmente del Google Sheet
- Guarda en `OrbitalCore_Codex_v1/.satellite-api-key.txt`
- Incluye en el `.env` del frontend

---

## 🎯 Beneficios de la Refactorización

1. **Separación de Concerns:** La key del sistema (MASTER_KEY) es diferente de la key de los satélites
2. **Granularidad:** Permite en el futuro revocar acceso de satélites específicos sin afectar al Core
3. **Trazabilidad:** Los logs pueden identificar requests por satellite key
4. **Seguridad:** UUID autogenerado en lugar de keys hardcodeadas o predecibles
5. **Compliance MPC:** Alineado con el Master Plan de refactor (Phase E, Layer 3)

---

## ⚠️ Breaking Changes

### Para Usuarios con Instalaciones Previas

Si ya tienes INDRA OS instalado (versión anterior a 2026-01-18):

**Opción 1: Reinstalación Completa (Recomendado)**
```powershell
# Eliminar instalación anterior
Remove-Item -Recurse -Force "ruta/a/INDRA-OS"

# Ejecutar bootstrap de nuevo
irm https://raw.githubusercontent.com/TU-USUARIO/indra-os/main/scripts/bootstrap.ps1 | iex
```

**Opción 2: Actualización Manual**
1. Ejecutar `git pull` para obtener el código actualizado
2. Obtener la Satellite API Key del Google Sheet (🔑 Gestionar Conexiones)
3. Agregarla al `.env`:
   ```bash
   VITE_SATELLITE_API_KEY=tu-uuid-aqui
   ```
4. Recompilar el frontend (necesario para GitHub Pages):
   ```powershell
   cd "INDRA_FRONT DEV"
   npm install  # Si faltan dependencias
   npm run build  # Compila React → archivos estáticos
   git add dist/
   git commit -m "Rebuild con nueva API Key"
   git push  # Dispara auto-deploy a GitHub Pages
   ```

### Para Mantenedores del Core

- Todos los tests que mockean requests deben incluir `systemToken` en el payload
- `ConnectionTester.gs` ya maneja la validación de esta key
- Los Adapters no necesitan cambios (la autenticación es en el Entrypoint)

---

## 📊 Checklist de Implementación

- [x] Actualizar `HttpEntrypoint.gs` para validar `SATELLITE_API_KEY`
- [x] Agregar key al `SystemManifest.gs`
- [x] Implementar generación automática en `SystemInitializer.gs`
- [x] Actualizar `CoreBridge.js` para enviar `systemToken`
- [x] Modificar `first-time-setup.ps1` para capturar la key
- [x] Actualizar `.env` template con nuevo campo
- [x] Documentar en README.md
- [x] Crear esta nota técnica
- [ ] Actualizar `PLAN_LANZAMIENTO_BETA_SOLARPUNK_v3.md`
- [ ] Agregar a TROUBLESHOOTING.md casos de error de autenticación
- [ ] Crear tests de integración para validar la autenticación

---

## 🔍 Referencias

- **Master Plan:** [Skin_Integration_Master_Plan.md](INDRA_FRONT%20DEV/_documentation/plans/Skin_Integration_Master_Plan.md)
- **Auth Realignment:** Phase E, Layer 3 (INTERVENCIÓN DE BLINDAJE AXIOMÁTICO)
- **Body-Key Protocol:** HttpEntrypoint.gs línea 34-37
- **Sovereign Schema Artifact:** Pendiente (JSON Schema para validación universal)

---

**Estado:** ✅ Implementación Completa  
**Próximo Paso:** Testing end-to-end con nuevo flujo de autenticación
