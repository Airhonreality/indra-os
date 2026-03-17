# ☁️ Tutorial: Instalación 100% en la Nube (Zero Install)

> **"Tu soberanía no depende de tu hardware, sino de tu voluntad."**
> Este tutorial es para quienes quieren desplegar INDRA OS sin instalar absolutamente nada en su computadora personal. Todo el proceso ocurre en PCs virtuales gratuitas en la nube.

---

## 🛠️ Requisitos
Solo necesitas una ventana del navegador y tus cuentas:
1. ✅ **GitHub Account**
2. ✅ **Google Account**

---

## 🚀 Paso 1: Clonar el Cerebro (GitHub Fork)

1. Ve al repositorio oficial: `https://github.com/Airhonreality/indra-os`
2. Haz clic en el botón **Fork** (arriba a la derecha).
3. Esto creará una copia de INDRA en tu propia cuenta de GitHub.

---

## 💻 Paso 2: El PC Virtual (GitHub Codespaces)

No instalaremos nada en tu equipo. Usaremos un PC virtual de GitHub que ya tiene todo configurado:

1. En **TU** nuevo repositorio, haz clic en el botón verde **Code**.
2. Selecciona la pestaña **Codespaces**.
3. Haz clic en **Create codespace on main**.
4. Se abrirá una pestaña con un editor de código (VS Code) funcionando en tu navegador. **Espera a que cargue.**

---

## ⚡ Paso 3: Lanzamiento del Instalador

Una vez que cargue la consola (la parte negra de abajo), escribe esto y presiona Enter:

```bash
bash scripts/first-time-setup.sh
```

### ¿Qué hará el PC Virtual por ti?
1. Se autenticará con Google (te dará un link para abrir en tu navegador).
2. Creará el proyecto en tu Google Drive.
3. Subirá el código del Core.
4. **Acción Manual:** Al igual que en el tutorial normal, tendrás que configurar la Web App en Google (30 segundos) y pegar la URL en la consola del Codespace.

---

## 🎨 Paso 4: Despliegue de la Interfaz

El instalador en la nube detectará que estás en GitHub y:
1. Compilará tu interfaz automáticamente.
2. Hará el "Push" final a tu repositorio.
3. Activará tu URL pública (ej: `https://tu-usuario.github.io/indra-os`).

---

## 🧹 Paso 5: Limpieza Total

Una vez que el instalador diga "¡INDRA OS PUBLICADO!", puedes:
1. Cerrar la pestaña del Codespace.
2. Ir a la configuración de tu cuenta de GitHub y borrar el Codespace (opcional, se detiene solo).
3. **¡Listo!** Ya no necesitas el PC virtual. Tu INDRA vive de forma autónoma en la infraestructura de Google y GitHub Pages.

---

## ✅ ¿Por qué este camino?

| Ventaja | Descripción |
|---------|-------------|
| **Cero Basura** | No instalas Node.js, Git ni utilitarios en tu PC. |
| **Pura Nube** | Todo el procesamiento de instalación ocurre en los servidores de GitHub. |
| **Soberanía** | Aunque uses un Codespace para instalar, el resultado final es TUYO y vive en tus cuentas personales. |

---
**Versión:** 1.0 (Cloud-First)  
**Dharma:** "El hardware es transitorio, la red es eterna."  
⚡🌞 **¡La red es tuya!** 🌞⚡
