# ADR-014: Dharma de Emergencia (Modo Offline)
> **Estado:** Aceptado
> **Contexto:** Depender al 100% de la nube (Drive/Neutrón) hace que el sistema sea inútil en entornos sin conexión o cuando el servidor falla.

## ⚖️ Decisión
Habilitar un **Dharma de Emergencia** (Safe Mode):
1. **Esquema Embebido:** El Satélite incluye un archivo `emergency.schema.json` con las definiciones mínimas de las partículas.
2. **Detección de Timeout:** Si el Airlock no recibe respuesta del Neutrón en 5000ms, ofrece el botón **"ENTRAR EN MODO OFFLINE"**.
3. **Persistencia Local:** Los cambios se guardan temporalmente en `localStorage` o `IndexedDB` y se intentan sincronizar cuando el pulso del servidor vuelve.
4. **Modo Lectura:** El Kernel bloquea las acciones de escritura destructivas para evitar conflictos de versiones masivos.

## ✅ Consecuencias
- **Positivas:** Disponibilidad del sistema del 100%. El usuario puede seguir trabajando en el diseño visual sin red.
- **Negativas:** Riesgo de conflictos de sincronización (fork) que el Kernel debe resolver posteriormente.
