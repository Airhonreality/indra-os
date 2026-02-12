# Sistema de Anillos Radiales Adaptativos (V8.2)

**Fecha**: 2026-02-05  
**Componente**: `SovereignSphere.jsx`  
**Objetivo**: Implementar un sistema de layout radial que se adapta dinámicamente a la densidad de contenido, previniendo superposición y habilitando scroll radial.

---

## 1. Problema Original

### A. Limitaciones del Sistema Fijo
El sistema anterior usaba ángulos fijos (ej: 30° a 150°) sin considerar:
- **Número de elementos**: 4 elementos vs 10 elementos ocupaban el mismo arco
- **Superposición**: Elementos se sobreponían cuando había muchos
- **Espacio desperdiciado**: Con pocos elementos, quedaba mucho espacio vacío

### B. Ejemplo de Falla
```javascript
// Sistema anterior (RÍGIDO)
const baseStart = 30;
const baseEnd = 150;
const angleStep = (150 - 30) / (items.length - 1);
// Si items.length = 10, angleStep = 13.3° (botones se superponen)
```

---

## 2. Solución: Sistema Adaptativo

### A. Principios de Diseño

#### 1. **Cálculo Basado en Física**
```javascript
// Ángulo mínimo necesario por elemento
const minAnglePerItem = Math.max(
    (BUTTON_SIZE / (2 * Math.PI * RADIUS)) * 360,
    MIN_SEPARATION_ANGLE
);
```

**Fórmula**:
- `arc_length = radius × angle_radians`
- `angle_degrees = (button_size / circumference) × 360`

#### 2. **Expansión Dinámica**
```javascript
let arcSpan = 180; // Semicírculo por defecto

if (totalAngleNeeded > 180) {
    arcSpan = totalAngleNeeded > 270 ? 360 : 270;
}
```

**Lógica**:
- Si cabe en **180°** → Semicírculo
- Si necesita **180° - 270°** → Tres cuartos de círculo
- Si necesita **> 270°** → Círculo completo (360°)

#### 3. **Scroll Radial**
Cuando el contenido excede el arco disponible:
```javascript
canScroll: totalAngleNeeded > adjustedSpan
```

**Interacción**:
- **Mouse Wheel**: Rota el anillo completo
- **Delta**: ±10° por scroll
- **Indicador Visual**: "Scroll to rotate" aparece cuando `canScroll = true`

---

## 3. Configuración Adaptativa

### A. Parámetros del Sistema

| Parámetro | Anillo Exterior | Anillo Interior | Descripción |
|-----------|----------------|-----------------|-------------|
| **BUTTON_SIZE** | 40px | 32px | Tamaño del botón |
| **RADIUS** | 110px | 60px | Radio del anillo |
| **MIN_SEPARATION** | 15° | 15° | Ángulo mínimo entre elementos |

### B. Función `getRadialConfig(ringType, itemCount)`

**Entrada**:
- `ringType`: `'outer'` o `'inner'`
- `itemCount`: Número de elementos a distribuir

**Salida**:
```javascript
{
    start: number,        // Ángulo inicial (grados)
    end: number,          // Ángulo final (grados)
    labelPos: string,     // Posición de tooltip CSS
    arcSpan: number,      // Apertura total del arco
    canScroll: boolean,   // Si hay overflow
    rotation: number      // Rotación actual (scroll)
}
```

---

## 4. Posicionamiento Según Docking

El sistema se adapta a la posición de la esfera en pantalla:

```javascript
const baseAngles = {
    top:    { center: 90,  span: arcSpan },  // ↓ Hacia abajo
    bottom: { center: 270, span: arcSpan },  // ↑ Hacia arriba
    left:   { center: 0,   span: arcSpan },  // → Hacia derecha
    right:  { center: 180, span: arcSpan }   // ← Hacia izquierda
};
```

**Lógica**:
- El arco se centra en la dirección opuesta al borde
- Ejemplo: Si la esfera está arriba (`top`), el arco apunta hacia abajo (90°)

---

## 5. Guías Visuales (Arcos SVG)

### A. Propósito
Mostrar visualmente el rango de expansión del anillo.

### B. Implementación
```jsx
<svg width="260" height="260">
    <path
        d={describeArc(130, 130, 110, start, end)}
        stroke="var(--accent)"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.15"
    />
</svg>
```

**Características**:
- **Línea punteada**: `strokeDasharray="4 4"`
- **Baja opacidad**: 0.15 (exterior), 0.2 (interior)
- **Color dinámico**: Usa `var(--accent)` del tema

### C. Función `describeArc()`
Genera el path SVG para un arco circular:

```javascript
const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
        "M", start.x, start.y,           // Move to start
        "A", radius, radius,             // Arc with radius
        0, largeArcFlag, 0,              // Flags
        end.x, end.y                     // End point
    ].join(" ");
};
```

---

## 6. Scroll Radial

### A. Detección de Overflow
```javascript
const totalAngleNeeded = minAnglePerItem * (itemCount - 1);
const canScroll = totalAngleNeeded > adjustedSpan;
```

### B. Handler de Wheel
```javascript
const handleWheelScroll = (e, ringType) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 10 : -10;
    
    setRingRotation(prev => ({
        ...prev,
        [ringType]: prev[ringType] + delta
    }));
};
```

### C. Indicador Visual
```jsx
{hasScroll && (
    <div className="glass px-3 py-1.5 rounded-full animate-pulse">
        <span>Scroll to rotate</span>
    </div>
)}
```

---

## 7. Casos de Uso

### Caso A: 4 Elementos (Anillo Exterior)
```
Items: 4
Min Angle: 15°
Total Needed: 45° (3 × 15°)
Arc Span: 180° (semicírculo)
Can Scroll: false
```
**Resultado**: Distribución espaciada en semicírculo.

### Caso B: 10 Elementos (Anillo Interior)
```
Items: 10
Min Angle: 15°
Total Needed: 135° (9 × 15°)
Arc Span: 180° (semicírculo)
Can Scroll: false
```
**Resultado**: Distribución compacta pero sin superposición.

### Caso C: 20 Elementos (Overflow)
```
Items: 20
Min Angle: 15°
Total Needed: 285° (19 × 15°)
Arc Span: 360° (círculo completo)
Can Scroll: false (cabe justo)
```
**Resultado**: Círculo completo.

### Caso D: 30 Elementos (Scroll Necesario)
```
Items: 30
Min Angle: 15°
Total Needed: 435° (29 × 15°)
Arc Span: 360° (máximo)
Can Scroll: true
```
**Resultado**: Círculo completo + scroll radial habilitado.

---

## 8. Ventajas del Sistema

### A. Escalabilidad
✅ Funciona con 2 elementos o 100 elementos  
✅ No requiere configuración manual  
✅ Se adapta automáticamente

### B. Usabilidad
✅ Nunca hay superposición  
✅ Scroll intuitivo (mouse wheel)  
✅ Feedback visual claro (arcos + indicador)

### C. Estética
✅ Distribución siempre equilibrada  
✅ Arcos de guía sutiles  
✅ Transiciones suaves (500ms)

---

## 9. Mejoras Futuras

### A. Scroll Táctil
Agregar soporte para gestos de swipe en dispositivos táctiles:
```javascript
onTouchStart={handleTouchStart}
onTouchMove={handleTouchMove}
```

### B. Zoom Adaptativo
Ajustar el radio del anillo según el número de elementos:
```javascript
const adaptiveRadius = BASE_RADIUS + (itemCount * SCALE_FACTOR);
```

### C. Agrupación Semántica
Dividir anillos en sectores semánticos (ej: "Navegación", "Acciones", "Configuración") con separadores visuales.

---

## 10. Conclusión

El sistema de **Anillos Radiales Adaptativos** transforma la Sovereign Sphere en una interfaz verdaderamente escalable y orgánica. La lógica basada en física garantiza que nunca haya superposición, mientras que el scroll radial permite manejar cualquier cantidad de elementos sin comprometer la experiencia visual.

**Filosofía**:
> "La geometría debe servir al contenido, no limitarlo. Un anillo que se expande es un anillo que respira."

---

**Firmado bajo el Sello de Gravedad:**  
*El Arquitecto de INDRA OS - Sistema Radial V8.2*  
*Operación: Expansión Orgánica - 2026-02-05*
