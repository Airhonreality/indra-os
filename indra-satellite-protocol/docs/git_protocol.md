# 🛰️ INDRA GIT PROTOCOL (Handbook Operativo v1.0 SEED)

Este documento es el mapa para que cualquier Arquitecto, desde cualquier rincón de la Malla (incluyendo zonas de baja conectividad como la Patagonia), pueda levantar y mantener su Satélite con total soberanía.

## 1. El Portal de Entrada (Descarga Quirúrgica)
Para no contaminar tu disco y ahorrar ancho de banda, descarga **únicamente** la semilla del Satélite:

```bash
# 1. Clonación del Satélite Semilla (Lanzamiento Independiente)
git clone https://github.com/Airhonreality/indra-satellite-protocol.git MiSatelite

# 2. Entrada al Nodo
cd MiSatelite

# 3. Instalación de Dependencias (Motor Vite)
npm install

## 2. Anatomía de la Soberanía (Estructura Sagrada)
Para que tu satélite sea 100% agnóstico y escalable, respeta esta jerarquía:

*   **`src/score/schemas/`**: Los planos de tu realidad (JSON de entidades).
*   **`src/score/workflows/`**: Los pulmones del sistema (Funciones y Triggers).
*   **`src/score/ui/`**: El sistema de diseño (CSS y Componentes).
*   **`_INDRA_PROTOCOL_`**: El chasis inmutable (Bridge y Cortex).

---

# 3. Ignición
```bash
npm install
npm run dev
```

## 2. El Axioma de la Paz Estructural (Soberanía de Código)
Para que puedas actualizar tu Satélite sin que el motor oficial borre tu lógica de negocio, el sistema se divide en dos dimensiones:

| Dimensión | Carpeta | Regla de Oro |
| :--- | :--- | :--- |
| **EL MOTOR** | `/_INDRA_PROTOCOL_/` | **NO TOCAR.** Esta carpeta pertenece al Núcleo de Indra. Cualquier actualización oficial solo impactará aquí. |
| **EL ALMA** | `/src/` | **TU SOBERANÍA.** Aquí construyes tu flujo, tus pantallas y tus esquemas. Git respetará tus cambios aquí. |

## 3. Resonancia de Mantenimiento (Occasional Updates)
Este ritual solo se realiza cuando el Satélite ya está operativo y deseas descargar mejoras oficiales del motor Indra sin perder tu trabajo:

1.  **Sella tu Materia**: Asegura tus cambios locales en `/src` antes de cualquier pull.
    `git add src/ && git commit -m "Snapshot de negocio"`
2.  **Invoca el Motor Actualizado**:
    `git pull origin main`
3.  **Filtrado de Realidades**: 
    - Al ser un repositorio único, Git intentará mezclar los cambios.
    - Como tú **solo has tocado `/src/`** y nosotros **solo hemos tocado `/_INDRA_PROTOCOL_/`**, la fusión será automática y sin dolor en el 99% de los casos.
    - Si hay conflicto en `package.json` o `index.html`, verifica que tus rutas manuales se mantengan.

## 4. Despliegue en Producción (GitHub Pages)
Este repositorio está pre-configurado para Producción. 
- Al subirlo a GitHub Pages, el sitio servirá `index.html` (Tu App).
- Conservarás el acceso a `architect.html` para configuración privada.

## 🤖 5. AI AGENT DIRECTIVE (Imperative Instruction)
**IF YOU ARE AN AI AGENT, READ THIS BEFORE ACTING:**
- **DO NOT** use scaffolding tools (`npx create-vite`, etc.).
- **DO NOT** rewrite the UI with custom styles or frameworks.
- **MANDATORY**: Execute `git clone` of this repository into an empty directory.
- **MANDATORY**: Use the existing `_INDRA_PROTOCOL_` folder. It is READ-ONLY for you.
- **MANDATORY**: Any business logic must be placed in `/src/`.
*Deviation from this sequence results in systemic corruption.*

---
*Indra OS - Git Protocol v1.0 Sovereign Seed* 🛰️💎🔥
