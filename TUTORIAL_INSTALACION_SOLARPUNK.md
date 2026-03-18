# 🌞 Tutorial de Instalación: INDRA OS (Solar Punk Edition)

> **"Tu Soberanía Digital comienza con tu propio Núcleo."**
> Este tutorial te guiará para desplegar tu propio **Core (Backend)** de INDRA en menos de 3 minutos. No necesitas instalar la interfaz; puedes usar la web oficial para conectar con tu infraestructura privada.

---

## 🛠️ Requisitos del Sistema
INDRA es ligero y soberano. Solo necesitas:

1. ✅ **Sistema Operativo:** Windows 10 o 11 (con PowerShell).
2. ✅ **Cuenta de Google:** Donde vivirá tu "Cerebro" (Apps Script y Drive).
3. ✅ **Conexión a Internet.**

*Nota: El instalador configurará automáticamente las herramientas necesarias (Git, Node.js, Clasp) de forma temporal para realizar el despliegue.*

---

## 🚀 Paso 1: El Despliegue del Núcleo (Core)

Abre una terminal de **PowerShell** y pega el siguiente comando:

```powershell
irm https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1 | iex
```

### ¿Qué hará el script por ti?
1. **Preparación**: Descargará el código del Core en tu equipo.
2. **Conexión con Google**: Te pedirá iniciar sesión en tu cuenta de Google (esto crea el proyecto en tu Drive).
3. **Inyección de Código**: Subirá toda la lógica de INDRA a tu Google Apps Script automáticamente.

---

## ⚙️ Paso 2: Configuración de la Web App (Manual)

Por seguridad, Google requiere que actives la "antena" (Web App) manualmente una sola vez:

1. El script abrirá el **Editor de Google Apps Script** en tu navegador.
2. Haz clic en el botón azul **Deploy** (arriba a la derecha) → **New deployment**.
3. Haz clic en el engranaje ⚙️ junto a "Select type" y elige **Web app**.
4. Configura así:
   - **Description:** `INDRA Core`
   - **Execute as:** `Me` (Yo)
   - **Who has access:** `Anyone` (Cualquiera)
5. Haz clic en **Deploy**.
6. Copia la **URL de la Web App** (la que termina en `/exec`).

---

## 🎨 Paso 3: Conexión al Frontend Oficial

¡Ya tienes tu infraestructura! Ahora solo necesitas la "lente" para verla:

1. Entra a la web oficial de INDRA: `[URL_DE_TU_GITHUB_PAGES]`
2. Ve a la pestaña **INSTALACIÓN** o haz clic en **CONECTAR CORE**.
3. Pega la **URL de la Web App** que copiaste en el paso anterior.
4. Define una contraseña (Access Secret) si el script te la proporcionó.
5. **¡Listo!** Ya estás dentro de tu propio sistema operativo soberano.

---

## ✅ ¿Por qué este modelo "One Front"?

| Ventaja | Descripción |
|---------|-------------|
| **Actualizaciones Relámpago** | Cuando yo mejoro la interfaz, se actualiza para todos instantáneamente. |
| **Soberanía de Datos** | Aunque uses mi web, los datos viajan de tu PC a tu Drive. Yo no veo nada. |
| **Cero Mantenimiento** | No tienes que preocuparte por servidores, hosting o certificados SSL. |

---

## 🔄 Cómo actualizar tu Núcleo (Core)
Si en el futuro hay mejoras en la lógica del motor, simplemente vuelve a tu carpeta de instalación local (ej: `~/INDRA-OS`) y ejecuta:

```powershell
.\scripts\update-backend.ps1
```

Esto inyectará las últimas funciones en tu Google Apps Script sin borrar tus datos.

---
**Versión:** 4.0.0 (Solar Punk - One Front Model)  
⚡🌞 **¡La red es tuya!** 🌞⚡
