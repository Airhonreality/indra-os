# 📖 INDRA SATELLITE COOKBOOK
### Recetario de Patrones Industriales para Satélites

Este documento contiene soluciones probadas para problemas comunes de negocio usando el Indra Satellite Protocol.

---

## 1. Persistencia de Documentos (PDF a Drive)
**Problema:** Generar un PDF en el navegador (ERP) y guardarlo de forma automática en una carpeta específica de Google Drive sin intervención del usuario.

### El Patrón Canónico
Indra soporta el transporte de archivos binarios mediante el axioma de **Transporte en Base64**.

#### Implementación:
```javascript
// 1. Genera tu PDF con jspdf o html2pdf
const doc = new jsPDF();
doc.text("Contenido de la propuesta", 10, 10);
const base64Content = doc.output('datauristring').split(',')[1]; // Limpiar prefijo

// 2. Usa el método evolutivo del Bridge
await bridge.uploadFile(
    'Propuesta_Comercial.pdf', 
    base64Content, 
    'ID_CARPETA_CLIENTE' // Opcional
);
```

### Por qué funciona:
El Bridge utiliza el protocolo `ATOM_CREATE` del proveedor `drive`. Al enviar la propiedad `file_base64`, el Core comprende que no debe crear un átomo de metadata, sino un **Archivo Físico** usando el servicio `Utilities.newBlob()` de Google.

---

## 2. Orquestación de Cálculos en Satélite
**Problema:** Necesitas aplicar una fórmula de ingeniería a datos sensibles antes de mostrarlos.

### El Patrón Canónico
Usa el `WorkflowEngine` local con el provider `pipeline` y el protocolo `TRANSFORM_COMPUTE`.

```javascript
const result = await engine.execute({
    stations: [{
        provider: 'pipeline',
        protocol: 'TRANSFORM_COMPUTE',
        mapping: { formula: "price * 1.15", target_field: "price_with_tax" }
    }]
}, { price: 100 });
```

---

## 3. Mímesis Visual (Tematización)
**Problema:** El componente UI de Indra no encaja con la paleta de colores de mi Satélite (ej: MiEmpresa ERP).

### El Patrón Canónico
Los componentes de Indra usan variables CSS inyectables con prefijo `--indra-`.

#### Implementación:
En el CSS global de tu satélite, define los colores de marca:
```css
:root {
  --indra-accent: #1A73E8; /* Azul corporativo genérico */
  --indra-bg: #000000;
  --indra-font: 'Outfit', sans-serif;
}
```

El componente se adaptará automáticamente respetando el aislamiento de su estructura interna.
## 4. Mapeo Inteligente Híbrido (Notion -> Sheets -> Satélite)
**Problema:** Tienes un catálogo en Notion y quieres usarlo en un Cotizador, pero necesitas una base intermedia en Sheets para auditoría o limpieza.

### El Patrón Canónico
No hardcodees variables. Sigue el **Flujo de Resonancia Triple**:

1.  **Descubrimiento**: Lee los esquemas de la base de Notion usando `TABULAR_STREAM` desde el Core.
2.  **Sincronización de ADN**: Registra el esquema en `indra_contract.json`. El satélite ahora "ve" los campos de Notion.
3.  **Paso Intermedio (Orquestación)**: Crea un Workflow en el Core donde el `trigger` sea una actualización en Notion y la `station` sea un `DRIVE_ENGINE` que escriba en un Spreadsheet.
4.  **Consumo**: El Satélite lee del Spreadsheet (el silo intermedio) usando el mismo `IndraBridge`.

#### Ventajas:
*   **Aislamiento**: Si Notion cambia de API, el Satélite no se entera porque lee del Silo Intermedio (Sheets).
*   **Auditabilidad**: Tienes un reflejo físico de los datos en Drive.
*   **Mapeo Transparente**: Usas el `alias` del contrato para vincular `notion_price` -> `unit_price`, sin hardcodear IDs de Notion en el código React.
