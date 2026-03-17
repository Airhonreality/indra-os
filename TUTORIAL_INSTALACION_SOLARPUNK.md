# 🌞 Tutorial de Instalación: INDRA OS (Solar Punk Edition)

> **"Mañana es el Día 1 de tu Soberanía Digital."**
> Este tutorial te guiará para desplegar tu propio Operador de Realidad INDRA en menos de 5 minutos, utilizando infraestructura serverless de costo cero.

---

## 🛠️ Requisitos del Sistema
INDRA está diseñado para ser ligero y soberano. Antes de empezar, asegúrate de tener:

1. ✅ **Sistema Operativo:** Windows 10 o 11 (con PowerShell).
2. ✅ **Cuenta de Google:** (Para el Core/Backend en Apps Script).
3. ✅ **Cuenta de GitHub:** (Para el hosting del Frontend).
4. ✅ **Conexión a Internet.**

*Nota: No necesitas instalar Node.js, Git o Clasp manualmente; el instalador se encargará de detectar lo que falta y configurarlo por ti.*

---

## 🚀 Paso 1: El Bootstrap (Un Solo Comando)

Abre una terminal de **PowerShell** (no hace falta administrador) y pega el siguiente comando:

```powershell
irm https://raw.githubusercontent.com/Airhonreality/indra-os/main/scripts/bootstrap.ps1 | iex
```

### ¿Qué sucederá ahora?
1. **Detección Automática:** El script verificará si tienes Git. Si no, lo instalará de forma silenciosa.
2. **Clonación Sincera:** Descargará el núcleo de INDRA en la carpeta que elijas (por defecto `~/INDRA-OS`).
3. **Ignición del Setup:** Iniciará automáticamente el configurador de primera vez.

---

## 🔐 Paso 2: Autenticación y Despliegue del Core

El script te guiará en el proceso de conectar INDRA con tu cuenta de Google:

1. **Google Login:** Se abrirá tu navegador. Concede los permisos necesarios (Apps Script y Drive). Tu información **nunca** sale de tu cuenta de Google.
2. **Creación del Proyecto:** INDRA creará un proyecto de Google Apps Script llamado `INDRA-Core` en tu Drive.
3. **Subida de Código:** El script subirá automáticamente toda la lógica de procesamiento al Core.

---

## ⚙️ Paso 3: Configuración Manual (Único Paso Manual)

Por seguridad, Google requiere que el despliegue de la Web App sea manual. Tardarás 30 segundos:

1. El script abrirá el editor de Apps Script en tu navegador.
2. Haz clic en el botón azul **Deploy** (arriba a la derecha) → **New deployment**.
3. Haz clic en el engranaje ⚙️ junto a "Select type" y elige **Web app**.
4. Configura exactamente así:
   - **Execute as:** `Me` (Yo)
   - **Who has access:** `Anyone` (Cualquiera)
5. Haz clic en **Deploy**.
6. Si pide "Authorize access", acepta y elige tu cuenta (haz clic en *Advanced* → *Go to INDRA-Core (unsafe)* si aparece el aviso de Google).
7. **COPIA** la "Web app URL" que termina en `/exec`.
8. **PEGA** la URL en la terminal de PowerShell cuando el script te lo pida.

---

## 🎨 Paso 4: Manifestación del Frontend

Una vez configurado el Core:
1. El script compilará el Frontend (la interfaz elegante que ves en las presentaciones).
2. Te pedirá autenticarte con **GitHub**.
3. Creará un repositorio privado/público en tu cuenta y subirá el código.
4. Activará **GitHub Pages** para que tengas una URL pública (ej: `tu-usuario.github.io/indra-os`).

---

## ✅ Confirmación de Sistema (Dharma Check)

He verificado los componentes de este repositorio y confirmo que la instalación es **completamente posible** bajo las siguientes condiciones:

| Componente | Estado | Nota |
|------------|--------|------|
| **Bootstrap Script** | 🟢 Listo | `scripts/bootstrap.ps1` configurado para `Airhonreality/indra-os`. |
| **Setup Script** | 🟢 Actualizado | Rutas corregidas para la estructura `system_core/core` y `system_core/client`. |
| **Backend (Core)** | 🟢 Funcional | Código GAS listo para ser inyectado vía Clasp. |
| **Frontend (UI)** | 🟢 Compilable | Configuración de Vite preparada para despliegue en GitHub Pages. |

---

## 🔄 Manteniendo la Soberanía

Para actualizar INDRA a la última versión en el futuro, no necesitas reinstalar. Simplemente entra en tu carpeta de instalación y ejecuta:

```powershell
.\scripts\update.ps1
```

Esto descargará las mejoras, actualizará tu Core en Google y redesplegará tu UI en GitHub automáticamente.

---
**Versión:** 3.0.0 (Solar Punk)  
**Soporte:** [Abre un issue en GitHub](https://github.com/Airhonreality/indra-os/issues)  
⚡🌞 **¡La red es tuya!** 🌞⚡
