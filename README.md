# 🌞 INDRA OS — Sistema Operativo Micelar

> **"Soberanía Digital sin Servidores. Datos en tus manos, poder en tu red."**

Indra es una arquitectura Solar Punk diseñada para devolver la soberanía de los datos al usuario. No utiliza servidores centrales; utiliza el poder de tu propia cuenta de Google para crear un entorno de computación privado, resiliente y distribuido.

---

## 🗺️ Mapa de la Red Micelar

| Entidad | Repositorio | Función |
|---------|-------------|---------|
| **La Fábrica (Hub)** | `indra-os` (Este repo) | Orquestador de Ignición. Instala automáticamente el motor en tu cuenta y sirve como Shell oficial. |
| **El Núcleo (Sun)** | *Instancia Privada* | Tu backend soberano en Google Apps Script, creado por La Fábrica. |
| **El Espejo (Satélite)**| `/public/indra-satellite-protocol/` | Semilla integrada (ISP) para que construyas tus propios Satélites. |

---

## 🚀 Ignición Zero-Touch (El Salto Quántico)

A diferencia de las arquitecturas tradicionales o las versiones antiguas de Indra, ya **no se requiere instalación manual, ni terminales, ni archivos .bat**.

1. **Acceso**: Entras a la Shell oficial (GitHub Pages).
2. **Identidad**: Te logueas con tu cuenta de Google.
3. **Ignición**: Si no tienes un núcleo, el sistema lo **forja automáticamente** por ti utilizando la API de Google Script.
4. **Resonancia**: Tu Shell se conecta a tu nuevo Núcleo privado. **Bienvenido a la red.**

---

## 🏗️ Para Desarrolladores de Satélites

Si quieres crear una aplicación (Satélite) que hable con el Núcleo de un usuario, utiliza el **Indra Satellite Protocol (ISP)**:

1. Usa el repo [Semilla](https://github.com/Airhonreality/indra-satellite-protocol) como Template.
2. Implementa el **Pacto de Resonancia** (Heredar token desde la Shell) o el **Auto-Discovery** (Buscar el manifiesto en Drive).

---

## 🛡️ Axioma de Soberanía
Indra se rige por los **ADRs (Architecture Decision Records)** que puedes encontrar en `/system_core/Documentacion/ADRs`. El más importante: **ADR-001 (Data Contracts)** garantiza que ningún dato salga de tu control sin tu firma explícita.

⚡🌞 **La red es tuya.** 🌞⚡
