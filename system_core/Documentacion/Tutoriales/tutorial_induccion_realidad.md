# Tutorial: Carga Realidad (Inducción por Resonancia)

Este tutorial te guiará para que dejes de "construir" desde cero y empieces a **asimilar** tu infraestructura actual. Si ya tienes tus tablas en Notion o Google Drive, no las recrees; elévalas a la soberanía de INDRA.

## 1. El Ancla de Conexión
Arrastra tu base de datos externa (ej: *Cotizaciones de Notion* o *Inventario de Drive*) al Workspace de INDRA. Al hacerlo, se creará un átomo de tipo `TABULAR` que representa el flujo de datos.

## 2. El Espejo de Estructura (Inducción)
Abre el panel de **Sintonía de Resonancia** (icono de engranaje en el átomo).
> [!TIP]
> Si aún no has definido un esquema para estos datos, haz clic en **"Convertir datos en Esquema INDRA"**. 
> INDRA analizará tus columnas en tiempo real y creará un `DATA_SCHEMA` automático, mapeando nombres y tipos (Número → INTEGER, Texto → STRING).

## 3. La Aduana de Lógica (Inducción de Fórmulas)
¿Tienes fórmulas en Notion? INDRA no solo lee el resultado, puede importar la **intención**:
1.  Al inducir el esquema, las columnas de fórmula se marcarán automáticamente como **Lógica Detectada**.
2.  INDRA preserva la expresión original (ej: `Precio * Cantidad`) para ser ejecutada por el **LogicEngine** de INDRA.
3.  Esto te da **flexibilidad fractal**: puedes cambiar la lógica en INDRA sin tocar la fuente original, o viceversa.

## 4. Cristalización y Soberanía
Una vez configurado el puente:
- Elige la **Frecuencia de Actualización** (Baja para históricos, Tiempo Real para procesos vivos).
- Define los **Permisos de Escritura** (Solo lectura para fuentes externas de verdad).

---
**Resultado Estético**: Tu realidad externa ahora vive en INDRA con la misma potencia lógica, lista para ser consumida por Documentos, Dashboards o Agentes Inteligentes con total integridad estructural.
