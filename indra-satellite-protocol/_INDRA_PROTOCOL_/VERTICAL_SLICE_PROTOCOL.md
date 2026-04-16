# 🍰 PROTOCOLO DE REBANADAS VERTICALES (Vertical Slice Dev)

Este protocolo define la ruta estratégica para migrar o construir satélites sin arrastrar "Materia Oscura" (hardcoding) y garantizando resultados rápidos.

---

## 🏛️ EL CONCEPTO: REBANADA VS. CAPA
*   **Desarrollo por Capas (Prohibido)**: Hacer todo el CSS, luego todos los esquemas, luego toda la lógica. Genera latencia de entrega y desalineación estructural.
*   **Desarrollo por Rebanadas (Mandatorio)**: Elegir una funcionalidad completa (ej: "Ver Factura") y desarrollarla desde el Esquema hasta el Botón en un solo ciclo de resonancia.

---

## 🪜 LA RUTA DEL ÁTOMO FUNCIONAL

### 1. Definir el Contrato (`src/score/schemas/`)
No escribas código de UI sin un esquema.
*   Crea el archivo `.json`.
*   Define qué campos necesita la vista.
*   **Resultado**: Tienes una "Plantilla de Realidad" que el Core ya entiende.

### 2. Vacuolizar la Interfaz (UI Vacuolization)
"Transformar el mármol en un cascarón".
*   Toma tu HTML/JS de la pantalla.
*   Elimina todos los datos de prueba (`"Juan Perez"`, `"$1000"`).
*   Sustitúyelos por variables que se inyectan desde una función `render(data)`.
*   **Axioma**: La pantalla debe ser un **vacio funcional** hasta que llegue el pulso del Bridge.

### 3. El Puente de Resonancia
Conecta la función `render(data)` con una llamada al Bridge:
```javascript
bridge.execute({
  protocol: 'ATOM_READ',
  context_id: 'mi_alias_de_rebanada'
}).then(render);
```

### 4. Handshake de Módulo
Valida que:
1.  El Core entrega los datos del esquema.
2.  El Bridge los transporta sin ruido.
3.  La UI los proyecta correctamente.

---

## 🎯 BENEFICIOS DEL SCRUM MICELAR
*   **Velocidad de Ignición**: Tienes un módulo funcionando al 100% en horas.
*   **Cero Materia Oscura**: Al usar esquemas desde el día 1, no dejas "basura" hardcodeada en el código.
*   **Confianza Reticular**: El usuario ve cómo su negocio "cobra vida" pedazo a pedazo, no todo de golpe al final.
