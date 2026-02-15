# 🚀 Script de Lanzamiento - INDRA UI con ISK Designer

## Para Windows (PowerShell)

```powershell
# Navegar al directorio del proyecto
cd "c:\Users\javir\Documents\DEVs\INDRA FRONT END\INDRA_FRONT_V2"

# Ejecutar el script de lanzamiento
.\launch_indra_ui.bat
```

## Comandos Manuales (si prefieres control total)

```bash
# 1. Navegar al directorio
cd "c:\Users\javir\Documents\DEVs\INDRA FRONT END\INDRA_FRONT_V2"

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

## ✅ Resultado Esperado

```
  VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## 🎯 Acceso a la UI

1. **Abrir navegador**: http://localhost:3000
2. **Módulo 9 (ISK Designer)**: Visible en el panel derecho inferior
3. **Zonas del ISK**:
   - **Zona A**: Navigator (Layer Manager / Data Cube)
   - **Zona B**: Stage (Spatial Canvas)
   - **Zona C**: Inspector (Visual Inspector)
   - **Zona D**: HUD (State HUD)

## 🔧 Atajos de Teclado

- **Alt + T**: Toggle tema (Dark ↔ Light)
- **Ctrl + C**: Detener servidor

## 📊 Verificación de Integración

### Consola del Navegador (F12)
Deberías ver:
```
🚀 Iniciando Indra Front-end v2 (The Axiom Architect)
✅ ISK Designer montado en m09-designer
✅ Andamiaje Hidratado. Sistema listo para proyección de datos.
```

### Elementos Visibles
- ✅ 10 módulos (m01-m10) en el shell
- ✅ ISK Designer en el módulo 9 (panel derecho inferior)
- ✅ 4 zonas dentro del ISK Designer

## 🐛 Troubleshooting

### Error: "Cannot find module 'react'"
```bash
npm install react react-dom
```

### Error: "Port 3000 is already in use"
```bash
# Cambiar puerto en vite.config.js
server: { port: 3001 }
```

### ISK Designer no aparece
1. Verificar que `m09-designer` existe en `index.html`
2. Abrir consola del navegador (F12) y buscar errores
3. Verificar que `ISKShellProjector.jsx` se importa correctamente

## 📝 Notas

- **Primera ejecución**: Puede tardar ~30s mientras npm instala dependencias
- **Hot Reload**: Los cambios en archivos `.jsx` se reflejan automáticamente
- **Backend**: Asegúrate de que INDRACore esté desplegado para endpoints MCP

---

**Estado**: LISTO PARA LANZAMIENTO 🚀



