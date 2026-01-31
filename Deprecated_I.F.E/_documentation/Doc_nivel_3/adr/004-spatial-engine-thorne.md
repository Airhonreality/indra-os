# ADR-004: Estándar Milimétrico Thorne (Spatial Engine)
> **Estado:** Aceptado
> **Contexto:** Las interfaces web tradicionales usan píxeles, lo que dificulta la creación de layouts precisos para impresión digital o diseño industrial.

## ⚖️ Decisión
El motor espacial de INDRA OS opera nativamente en **milímetros (mm)**:

1. **Soberanía del Formato:** Todas las coordenadas (`x, y`) y dimensiones (`w, h`) de las entidades se almacenan en milímetros.
2. **Proyección Thorne:** El `IndraKernel.extensions.spatial` realiza la conversión determinística de `mm` a `px` en tiempo de ejecución basándose en una densidad de 96 DPI constante.
3. **Cámara Independiente:** El zoom y el pan no escalan los píxeles (CSS scale), sino que recalculan la proyección de los milímetros al espacio de pantalla.

## ✅ Consecuencias
- **Positivas:** Precisión absoluta. Un cuadro de 210x297mm en la pantalla siempre equivaldrá a una hoja A4 real al exportarse.
- **Negativas:** Requiere cálculos matemáticos constantes de proyección que el desarrollador debe abstraer a través de las utilidades del Kernel.
