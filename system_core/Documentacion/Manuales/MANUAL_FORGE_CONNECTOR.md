# Guía del Desarrollador: Indra como Backend Headless (API Pro)

Esta guía explica cómo convertir cualquier frontend (React, Vue, Svelte o Vanilla JS) en una aplicación conectada a la infraestructura soberana de Indra en menos de 5 minutos.

## 1. El Concepto: "Diseño Local, Materia Central"
En el flujo PRO, tú no diseñas en la UI de Indra. Diseñas en tu editor de código. Indra actúa como el "Génesis" que hace realidad tus definiciones de datos.

## 2. Paso 1: Define tu ADN (Esquema)
Crea un archivo `schema.js` en tu proyecto y registra tus esquemas en el objeto global de Indra:

```javascript
// schema.js
window.INDRA_SCHEMAS = {
  "mis_leads": {
    label: "Captura de Leads Pro",
    fields: [
      { id: "nombre", label: "Nombre Completo", type: "TEXT" },
      { id: "email",  label: "Email Corporativo", type: "EMAIL" },
      { id: "presupuesto", label: "Presupuesto", type: "CURRENCY" }
    ]
  }
};
```

## 3. Paso 2: Inyecta el Satélite
Copia este script antes del cierre de tu etiqueta `</body>`:

```html
<script src="https://tu-indra.io/satellite/v1/hud.js"></script>
```

## 4. Paso 3: Handshake Soberano
1. Arranca tu entorno local (`npm run dev`).
2. Verás el icono de **Indra** en la esquina inferior.
3. Haz clic y selecciona **Loguear con Google**.
4. Indra detectará automáticamente tu Core y vinculará tu sesión.

## 5. Paso 4: Sincronización e Ignición
El **Indra HUD** detectará que tu esquema local `mis_leads` no existe en tu Core.
- Haz clic en **[SINCRONIZAR ADN]** para registrar el esquema en Indra.
- Haz clic en **[IGNITAR MATERIA]** para crear automáticamente el Google Sheet o la base de datos de Notion.

## 6. Paso 5: Consume la API
Ahora puedes enviar datos a Indra usando el protocolo universal desde cualquier parte de tu código:

```javascript
import { pushToIndra } from './indra-utils';

const handleSubmit = (data) => {
  pushToIndra({
    schema: 'mis_leads',
    data: data
  });
};
```

---
*Indra: Tu infraestructura, tu soberanía, tu código.*
