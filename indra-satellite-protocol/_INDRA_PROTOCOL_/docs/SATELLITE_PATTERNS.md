# Patrones Canónicos para Satélites Indra (v1.5)

Este documento detalla patrones de diseño recomendados para el cliente (frontend) que optimizan la experiencia de usuario sin añadir sobre-ingeniería en el Core.

## 1. Patrón: Miniatura Instantánea (Canvas Local)
**Propósito**: Evitar la sensación de lentitud durante subidas pesadas (videos/fotos masivas).

**Implementación**:
1. Antes de iniciar `EMERGENCY_INGEST`, usa el API de Canvas del navegador para generar un preview.
2. Guarda el preview en el estado local (RAM) o `IndexedDB`.
3. Muestra el preview inmediatamente en la UI con una opacidad del 50%.
4. Cuando el Core devuelva el `file_id` exitoso, reemplaza el preview por la URL definitiva.

```javascript
async function generatePreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100; canvas.height = 100;
        canvas.getContext('2d').drawImage(img, 0, 0, 100, 100);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

## 2. Patrón: Idempotencia en el Cliente (Tagging)
**Propósito**: Evitar la creación de materia duplicada en el Core ante reintentos de red.

**Implementación**:
1. El satélite genera un **Fingerprint** del archivo (Nombre + Tamaño + Última modificación).
2. Antes de subir, el satélite realiza una búsqueda atómica (`ATOM_READ`) usando ese nombre en la carpeta de destino.
3. Si el archivo ya existe con el mismo tamaño, el satélite **cancela la subida** y marca el ítem como `COMPLETED` localmente.
4. Este patrón protege al Core de duplicados sin necesidad de lógica compleja de transacciones en el servidor.

## 3. Patrón: Resonancia Post-Hoc (Modo Offline)
**Propósito**: Garantizar que ninguna operación se pierda si el usuario cierra la pestaña o pierde conexión.

**Implementación**:
1. Toda operación de escritura (`ATOM_CREATE`, `SYSTEM_CONFIG_WRITE`) debe persistirse primero en `StateVault` (IndexedDB).
2. El `IndraBridge` intenta la ejecución.
3. Si falla por `NETWORK_ERROR`, la tarea permanece marcada como `PENDING`.
4. Al reiniciar la aplicación (evento `load`), un worker escanea el `StateVault` y re-ejecuta automáticamente las tareas pendientes.

## 4. Patrón: UI Adaptativa por Capacidades
**Propósito**: No frustrar al usuario mostrando opciones que su Core no soporta.

**Implementación**:
1. Tras el `init()`, inspecciona el objeto `bridge.capabilities.providers`.
2. Si el usuario intenta guardar en Notion pero `notion` no está en la lista de proveedores activos del Core, oculta el botón o muestra un aviso de "Provider no vinculado".

---
*Axioma Indra: "La inteligencia vive en el Core, pero la soberanía del tiempo vive en el Satélite".*
