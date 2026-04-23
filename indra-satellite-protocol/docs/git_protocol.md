# 🛰️ INDRA GIT PROTOCOL (Handbook Operativo v17.0)

Este documento define el canon para construir, mantener y sincronizar Satélites Indra. Es la "Semilla de Instrucciones" para desarrolladores e IAs.

## 1. Bootstrap de Satélite (Cold Start)
Para levantar un satélite desde cero en un repositorio vacío, sigue esta secuencia:

```bash
# 1. Clonación del Motor y Estructura Base
git clone --recursive https://github.com/Airhonreality/indra-os.git .

# 2. Instalación de Dependencias del Núcleo
cd system_core/client
npm install

# 3. Ignición del Servidor de Sincronía (Vite)
npm run dev
```

## 2. El Ciclo de Sincronía Automática
A diferencia de los frameworks tradicionales, el Satélite Indra no requiere edición manual de archivos de configuración inicial.

1.  **Handshake**: Abre `localhost:3000` y sube los datos al HUD.
2.  **Persistencia Física**: Al pulsar "PERSISTIR EN DISCO", el servidor Vite reescribirá automáticamente `indra_config.js`. No lo hagas a mano.
3.  **Escritura de Esquemas (PULL)**: Usa el botón **PULL** en el HUD para materializar esquemas del Core en tu carpeta `src/scores/`. El sistema creará los archivos `.js` por ti.

## 3. Reglas de Soberanía (Mantenimiento)

### A. Actualización del Motor (Submódulos)
Indra evoluciona de forma independiente. Si hay cambios en el núcleo:
```bash
git submodule update --remote --merge
```

### B. Mantenimiento del Satélite (Tu Negocio)
Todo lo que ocurra fuera de `_INDRA_PROTOCOL_` es tu territorio. 
*   **Carpeta `/src`**: Tu lógica soberana.
*   **Carpeta `/public`**: Tus assets.
*   **Precepto**: Nunca modifiques el contenido de la carpeta `/public/indra-satellite-protocol/_INDRA_PROTOCOL_` a menos que desees proponer cambios al núcleo global.

## 4. Resolución de Conflictos Industriales
*   **Reset de Motor**: Si el protocolo se corrompe en tu local, usa `git checkout -- _INDRA_PROTOCOL_`.
*   **Drift de Sincronía**: Si el HUD muestra un error de handshake, verifica que tu `indra_config.js` coincide con el puerto de tu servidor de datos remoto.
*   **Integridad Visual**: No introduzcas CSS que rompa la fluidez del chasis de Indra. Cualquier hardcodeo de `px` se considera un "Drift Maligno" que debe ser corregido antes del push.

---
*Indra OS - Git Protocol v17.0 Axiomatic* 🛰️💎🔥
