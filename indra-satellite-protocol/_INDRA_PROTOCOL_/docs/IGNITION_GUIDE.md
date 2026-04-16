# GUÍA DE IGNICIÓN (De Cero a Satélite)

Esta guía te enseñará a conectar una "Página Vacía" con el Core de Indra para empezar a construir tu negocio de forma industrial.

---

## PASO 1: LA SEDA (Handshake)

1.  Copia la carpeta `/core` del protocolo semilla a tu proyecto.
2.  En tu `main.js`, importa el puente:
    ```javascript
    import IndraBridge from './core/IndraBridge.js';
    const indra = new IndraBridge();
    ```
3.  Implementa el login de Google para obtener el `id_token`. Una vez lo tengas:
    ```javascript
    await indra.init(googleIdToken); // El satélite ahora sabe dónde está su Core.
    ```

## PASO 2: LA MATERIA (Definir el Esquema)

No crees tablas en tu código. Define un **DATA_SCHEMA** (ADN). 
Ejemplo de esquema para una Panadería:
```json
{
  "handle": { "alias": "productos_panaderia", "label": "Productos" },
  "class": "DATA_SCHEMA",
  "payload": {
    "fields": [
      { "id": "f1", "label": "Nombre del Pan", "type": "TEXT" },
      { "id": "f2", "label": "Precio Venta", "type": "CURRENCY" }
    ]
  }
}
```

## PASO 3: LA IGNICIÓN (Materializar)

Ejecuta el protocolo de ignición desde tu satélite (o desde el LumaHUD):
```javascript
const result = await indra.execute({
    provider: 'system',
    protocol: 'SYSTEM_SCHEMA_IGNITE',
    context_id: 'ID_DE_TU_ESQUEMA',
    data: { target_provider: 'drive' }
});
```
**¡Listo!** Indra acaba de crear un archivo de base de datos en tu Google Drive y ha vinculado tu esquema con la realidad física.

---

## PASO 4: LA COSECHA (Lectura de Datos)

Ahora que la materia existe, puedes leerla desde cualquier lugar:
```javascript
const productos = await indra.execute({
    provider: 'drive',
    protocol: 'TABULAR_STREAM',
    context_id: result.metadata.silo_atom.id // El ID que nos dio la ignición
});

console.log(productos.items); // [{ id: '...', payload: { f1: 'Pan de Bono', f2: 1500 } }]
```

---

## PASO 5: SEGURIDAD CRÍTICA (Producción)

> [!CAUTION]
> **NUNCA dejes tu `satellite_token` maestro en el código frontend de una web pública.**

Para despliegues reales, sigue el **Patrón Proxy**:
1. Tu frontend habla con un pequeño servidor (Vercel, Cloudflare Workers).
2. Ese servidor inyecta el token y hace el fetch a Indra.
3. El usuario final nunca ve tu llave secreta en el navegador.

---

## MOTORES ADICIONALES

El protocolo semilla incluye herramientas avanzadas para proyectos complejos:

### 📸 MediaBridge (Multimedia)
No subas archivos binarios directamente. Usa el pipeline peristáltico:
```javascript
const media = new MediaBridge(indra);
const res = await media.upload(file, { uploader: 'Juan' }, (p) => console.log(p.percent));
```

### 💾 StateVault (Persistencia)
Mantiene la sesión viva incluso si el usuario refresca la página:
```javascript
const vault = new StateVault({ bridge: indra });
vault.set('ultimo_paso', 5);
```

---

## RECOMENDACIONES DE "PULL-ONLY"

1.  **NO modifiques nada dentro de `/core`**. Si hay una actualización del protocolo, solo tienes que hacer `git pull` de la carpeta semilla y sobrescribir tus archivos locales de `/core`.
2.  Mantén tu **Lógica de UI** separada de la **Lógica de Comunicación**. 
3.  Usa el **LumaHUD** para depurar durante el desarrollo; cámbiate a modo producción (sin HUD) para el despliegue final de tu cliente.

---
*Bienvenido a Indra. El futuro es descentralizado y soberano.*
