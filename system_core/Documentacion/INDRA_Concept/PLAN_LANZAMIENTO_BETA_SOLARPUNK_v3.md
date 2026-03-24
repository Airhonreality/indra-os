# 🚀 PLAN DE LANZAMIENTO — INDRA OS (Solar Punk Edition v4.0)

> **Arquitectura:** Un Solo Front (GitHub Pages) · Sin Base de Datos Central · Autodescubrimiento via Google Drive  
> **Público Objetivo:** Beta Testers (Resistencia Solar Punk)  
> **Dharma:** Soberanía Digital en 5 Minutos  
> **Versión:** 4.0.0 — "Decentralized Discovery"

---

## 🧠 FILOSOFÍA DE DISEÑO

Este sistema resuelve el problema central de cualquier instalador SaaS sin servidor propio:

> **¿Cómo sabe el front-end a qué "backend privado" conectarse, si cada usuario tiene el suyo, sin una base de datos central?**

**Respuesta:** Google Drive es la base de datos. La identidad del usuario y la ubicación de su Core viven en un archivo oculto dentro de su propio Drive, en una carpeta de sistema física integrada. Al loguearse con Google desde cualquier dispositivo, el front-end lo encuentra en milisegundos.

**Principios Inamovibles:**
- 🔒 **Soberanía Total:** Los datos viven en el Google Drive del usuario. Nosotros no los vemos.
- 🌐 **Un Solo Punto de Entrada:** `https://airhonreality.github.io/indra-os/` funciona para TODOS los usuarios del mundo.
- 📡 **Zero-Server:** No existe backend nuestro. No hay costos de infraestructura.
- 🔍 **Autodescubrimiento:** El front-end descubre el Core del usuario usando el API de Drive. Nunca pide una URL.

---

## 📐 ARQUITECTURA GLOBAL

```
[MUNDO EXTERIOR]                    [ECOSISTEMA PRIVADO DEL USUARIO]
                                    
https://airhonreality.github.io     Google Drive del Usuario
     /indra-os/                     └── .core_system/           ← Carpeta Física del Motor
          │                              ├── INDRA_MANIFEST.json ← El "Pasaporte" del Core
          │                              ├── AuditLog.gs         ← Código Operativo
          │  Login con Google            └── ... (todo el Indra Core)
          ├─────────────────────────►   Google Apps Script Project
          │                              └── Web App URL ─────────────────────────────┐
          │  Drive API: busca            Google Sheet (Bóveda)                        │
          │  INDRA_MANIFEST.json         └── Vinculada al GAS Project                │
          │◄─────────────────────────                                                 │
          │                                                                            │
          │  fetch() directo                                                           │
          └────────────────────────────────────────────────────────────────────────► Core GAS
                                                                              (procesa y responde)
```

**Componentes:**

| Componente | Tecnología | Ubicación | Propiedad |
|:---|:---|:---|:---|
| **Front-end (Cascarón)** | React + Vite | GitHub Pages | Repositorio Público |
| **Core (Motor)** | Google Apps Script | Google Drive del Usuario | 100% del Usuario |
| **Bóveda de Datos** | Google Sheets | Google Drive del Usuario | 100% del Usuario |
| **Manifiesto de Identidad** | JSON en Drive | `.core_system/` en Drive del Usuario | 100% del Usuario |
| **Base de Datos Central** | ❌ No existe | N/A | N/A |

---

## 🗺️ EL TERRITORIO: `.core_system`

Siguiendo el **Axioma de Sinceridad Física (ADR-019)**, el Motor de Indra debe residir dentro de su propio territorio para garantizar la soberanía y evitar colisiones.

1. **Nombre Canónico:** `.core_system` (No cambiar, anclado en `system_config.js`).
2. **Propósito:** Actúa como la "Caja Negra" y el cerebro del sistema. El usuario no interactúa con ella manualmente; el Front-end la gestiona.
3. **Invisibilidad:** Al prefijarse con punto, se mantiene fuera de la vista principal del usuario en integraciones de sistema, manteniendo el UX limpio.

### Spec: `INDRA_MANIFEST.json`

Este archivo es el **"Punto de Anclaje"** que permite al front-end "cascarón" reconectar con el Core en cualquier dispositivo.

```json
{
  "schema": "indra-manifest-v4",
  "core_id": "owner@gmail.com",            // Identidad Hidratada (ADR_001)
  "core_url": "https://script.google.com/macros/s/AKfyc.../exec",
  "script_id": "ID_DEL_SCRIPT_GAS",
  "vault_id": "ID_DE_LA_GOOGLE_SHEET",
  "system_root_id": "ID_DE_LA_CARPETA_CORE_SYSTEM",
  "installed_at": "ISO-TIMESTAMP",
  "satellite_key": "UUID-AUTHENTICATION-KEY"
}
```

---

## 🔑 LA LLAVE MAESTRA: OAUTH SCOPES

Para que Indra despliegue todo su potencial como **Sistema Operativo Micelar**, el front-end debe solicitar los permisos adecuados. La arquitectura de providers de Indra permite que el sistema crezca sin límites integrando toda la suite de Google.

### Scopes de Instalación y Autodescubrimiento (Críticos)
| Scope | Razón de Existencia |
|:---|:---|
| `drive.file` | Permite crear y manejar `.core_system` y la Bóveda sin ver todo el Drive del usuario. |
| `drive.metadata.readonly` | Necesario para buscar el archivo de manifiesto en nuevos dispositivos (Discovery). |
| `script.projects` | Permite al instalador crear el proyecto de Google Apps Script. |
| `script.deployments` | Permite publicar automáticamente el Core como Web App. |
| `spreadsheets` | Gestión total de la Bóveda de datos y registros. |

### Scopes de Expansión (The Sovereign Suite)
Indra puede conectar con todo lo que el usuario posee. Al crecer los providers, el login solicitará:
| Scope | Provider Beneficiado |
|:---|:---|
| `userinfo.email` | Identidad central del núcleo (`core_id`). |
| `gmail.send` / `gmail.modify` | **Indra Mailer** (Notificaciones y automatización de buzón). |
| `calendar` | **Indra Scheduler** (Gestión de agendas y eventos). |
| `youtube.readonly` | **Indra Vision** (Meta-análisis de contenido y listas). |
| `forms` | **Indra Ingest** (Creación dinámica de puentes de captura). |

---

## 🔄 FLUJOS DE USUARIO ACTUALIZADOS

### FLUJO A: Primera Instalación (The Ignition)
1. Usuario visita el Front Único → Click en **"Inicializar Indra"**.
2. **Auth Bridge**: Se abre el popup de Google con la suite completa de permisos solicitados.
3. **Orquestación Programática**:
   - Crea Bóveda (Google Sheet).
   - Crea carpeta de sistema **`.core_system`**.
   - Crea Proyecto GAS y sube código desde el repositorio (`fetching from GitHub raw`).
   - Genera `core_url` y `satellite_key`.
   - Escribe el `INDRA_MANIFEST.json` en `.core_system`.
4. **Finalización**: El front-end redirige al Dashboard. Instalación en record: **~3 minutos**.

### FLUJO B: Autodescubrimiento (Discovery)
1. Usuario entra desde el Celular.
2. Login con Google → El front-end detecta que no tiene configuración local.
3. **Escaneo de Drive**: Realiza `q: "name = '.core_system'"` → encuentra el ID de la carpeta.
4. **Lectura de Manifiesto**: Descarga `INDRA_MANIFEST.json`.
5. **Hidratación Automática**: Carga `core_url` y `satellite_key`.
6. **Dashboard Conectado**: El usuario está online. **Cero configuraciones manuales.**

---

## ⚙️ PASO MANUAL: ACTIVACIÓN DE API
Como se descubrió en la investigación técnica, el **ÚNICO** impedimento para la magia total es que la API de Apps Script viene desactivada por defecto.

**UX de Mitigación:** El Front-end mostrará un modal de "Pre-Check" con un enlace directo a `script.google.com/home/usersettings` y una animación clara de cómo encender el switch principal. Sin este paso, el instalador fallará elegantemente con un mensaje de guía.

---

## 🚀 ESTRATEGIA DE LANZAMIENTO BETA
- **EntryPoint:** `https://airhonreality.github.io/indra-os/`
- **Soporte:** La arquitectura descentralizada significa que si el usuario pierde su celular, sus datos están seguros en su Drive. Solo debe redescubrirlos.
- **Escalabilidad:** Al no tener base de datos nuestra, podemos recibir 1 o 1,000,000 de usuarios; el costo de infraestructura para nosotros es **$0**.

---

**Arquitectura:** v4.0.0 — Fractal Core Architecture  
**Dharma:** Un solo frente, una red infinita de núcleos soberanos.  
⚡🌞 **Indra: El motor de tu propia realidad.** 🌞⚡
la y despliega correctamente
- [ ] Asegurar que `https://airhonreality.github.io/indra-os/` está activo
- [ ] Configurar `CNAME` si se usa dominio personalizado en el futuro

### FASE 4 — Google Cloud Console
- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar `Google Apps Script API`, `Google Drive API`, `Google Sheets API`
- [ ] Configurar OAuth Consent Screen (nombre, logo, política de privacidad)
- [ ] Agregar URI de redirección: `https://airhonreality.github.io/indra-os/auth/callback`
- [ ] Obtener `CLIENT_ID` y `CLIENT_SECRET` para el flujo OAuth del front-end
- [ ] Iniciar proceso de verificación de Google (para eliminar pantalla "App no verificada")

---

## 🎯 RESULTADO FINAL — La Experiencia del Usuario

```
[Dispositivo 1 — PC de Casa]
  Lunes 9am: Visita GitHub Pages → Instala Indra → lo usa
  
[Dispositivo 2 — Celular]
  Lunes 3pm: Visita GitHub Pages → "Ya tengo Indra" → Login Google
  → 2 segundos → Dashboard aparece conectado a su mismo Core
  → (sin copiar URLs, sin pegar keys, sin configurar nada)

[Dispositivo 3 — Laptop del Trabajo]  
  Martes 10am: Mismo flujo que el celular
  → Mismos datos, mismo estado, mismo Core

THE END.
```

---

**Versión:** 4.0.0 — Decentralized Discovery  
**Fecha:** Marzo 2026  
**Autor:** La Resistencia Solar Punk  
**Dharma:** Un solo front. Millones de Cores soberanos.  

⚡🌞 **Not your Drive, not your data. Not your Core, not your cloud.** 🌞⚡
