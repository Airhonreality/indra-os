# ☁️ Tutorial: Instalación 100% en la Nube (Zero Install)

> **"Tu soberanía no depende de tu hardware, sino de tu voluntad."**
> Este tutorial es para quienes quieren desplegar el **Core (Backend)** de INDRA OS sin instalar absolutamente nada en su computadora personal. Todo el proceso ocurre en PCs virtuales gratuitas de GitHub (Codespaces).

---

## 🛠️ Requisitos
Solo necesitas una ventana del navegador y tus cuentas:
1. ✅ **GitHub Account**
2. ✅ **Google Account**

---

## 🚀 Paso 1: El PC Virtual (GitHub Codespaces)

No instalaremos nada en tu equipo. Usaremos un PC virtual de GitHub que ya tiene todo configurado (Node.js, Git, Bash):

1. Ve al repositorio oficial de INDRA: `https://github.com/Airhonreality/indra-os`
2. Haz clic en el botón verde **Code**.
3. Selecciona la pestaña **Codespaces**.
4. Haz clic en **Create codespace on main**.
5. Se abrirá una pestaña con un editor de código (VS Code) en la nube. **Espera a que cargue.**

---

## ⚡ Paso 2: Lanzamiento del Instalador del Core

Una vez que cargue la consola (la parte negra de abajo), escribe esto y presiona Enter:

```bash
bash scripts/first-time-setup.sh
```

### ¿Qué hará el PC Virtual por ti?
1. Se autenticará con Google (te dará un link para abrir en tu navegador).
2. Creará el proyecto de Apps Script en tu Google Drive.
3. Subirá el código del Core automáticamente.

---

## ⚙️ Paso 3: Configuración de la Web App (Manual)

Por seguridad, Google requiere que actives la "antena" (Web App) manualmente:

1. El instalador abrirá el **Editor de Google Apps Script** en tu navegador.
2. Haz clic en el botón azul **Deploy** (arriba a la derecha) → **New deployment**.
3. Haz clic en el engranaje ⚙️ junto a "Select type" y elige **Web app**.
4. Configura así:
   - **Description:** `INDRA Core Cloud`
   - **Execute as:** `Me` (Yo)
   - **Who has access:** `Anyone` (Cualquiera)
5. Haz clic en **Deploy**.
6. Copia la **URL de la Web App** (la que termina en `/exec`).

---

## 🎨 Paso 4: Conexión Final

¡Ya tienes tu infraestructura en la nube de Google! Ahora solo conéctate:

1. Entra a la web oficial de INDRA: [URL_PAGINA_OFICIAL]
2. Haz clic en **CONECTAR CORE**.
3. Pega la URL que copiaste en el paso anterior.
4. **¡Listo!** Ya estás operando INDRA sin haber instalado un solo archivo en tu disco duro local.

---

## 🧹 Paso 5: Limpieza Total (Opcional)

Una vez que el Core esté desplegado, ya no necesitas el Codespace:
1. Cierra la pestaña del Codespace.
2. Ve a la configuración de tu cuenta de GitHub y bórralo si quieres liberar espacio (aunque se detendrá solo y no consume créditos si está apagado).

---

## ✅ ¿Por qué este camino "Zero Install"?

| Ventaja | Descripción |
|---------|-------------|
| **Cero Basura** | No instalas Node.js, Git ni utilitarios en tu PC. Ideal para portátiles compartidos o Chromebooks. |
| **Pura Nube** | Todo el procesamiento de instalación ocurre en los servidores de GitHub. |
| **Soberanía** | Tu Core vive en TU cuenta de Google, y nadie más tiene acceso a él. |

---
**Versión:** 2.0 (Zero Install - One Front Model)  
**Dharma:** "El hardware es transitorio, la red es eterna."  
⚡🌞 **¡La red es tuya!** 🌞⚡
