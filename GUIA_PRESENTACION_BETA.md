# INDRA OS — Operador de Realidad

## ¿Qué es INDRA OS?

**INDRA OS** es tu **Red de Indra personal**: la red que conecta todos los reinos de tu realidad digital (Gmail, Notion, GitHub, Slack, hojas de cálculo, APIs...) para que puedas operar desde un único punto de consciencia.

En la mitología hindú, la **Red de Indra** tiene una joya en cada nudo que refleja todas las demás joyas infinitamente. INDRA OS hace lo mismo con tus herramientas: cada sistema conectado se refleja en los demás, creando una red viva de interconexiones.

**El valor real:** Dejas de ser esclavo de procesos repetitivos y lentos (la Matrix del trabajo manual) para convertirte en **Operador de Realidad** — automatizas, orquestas, traduces entre sistemas sin tocar código.

---

## La Arquitectura: Tres Capas

```
┌─────────────────────────────────────────┐
│   AVATAR (Operador de Realidad)        │  ← Tú, manipulando la red
│   Frontend / Interfaz Visual           │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   RED DE INDRA (OrbitalCore)            │  ← Cerebro que conecta todo
│   Traductor Universal + Orquestador     │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   REINOS (Gmail, Notion, Slack, etc)    │  ← Tus herramientas reales
│   Conectados vía Adapters              │
└─────────────────────────────────────────┘
```

### 1. **OrbitalCore** — El Tejido de la Red
Es el **cerebro orquestador** que:
- **Traduce** entre lenguajes de sistemas incompatibles (JSON ↔ Tabla ↔ Email)
- **Conecta** todos los reinos en una red única
- **Ejecuta** flujos automáticos sin intervención humana

**Tecnología:** Google Apps Script (serverless, sin costos de servidor)

### 2. **Adapters** — Nudos de la Red
Cada Adapter es un **traductor específico** para un reino:
- `GmailPort`: Lee/envía emails como datos estructurados
- `NotionPort`: Convierte páginas en objetos manipulables
- `SlackPort`: Traduce mensajes a eventos procesables

**Analogía:** Son los traductores simultáneos en una ONU de sistemas.

### 3. **Avatar** — Operador de Realidad
El **frontend** es tu cuerpo en la Matrix. Desde aquí:
- Diseñas flujos visuales (sin código)
- Ves la red completa de interconexiones
- Ejecutas acciones en múltiples reinos simultáneamente

**Módulo clave:** ISK Designer (Indra Spatial Kernel) — diseñador de realidades.

---

## El Valor: Salir de la Matrix

### Antes (Esclavo de la Matrix)
❌ Copiar datos de emails a Notion manualmente  
❌ Enviar el mismo mensaje a 15 personas en Slack  
❌ Revisar 3 hojas de cálculo para tomar una decisión  
❌ **Tiempo perdido:** 2-3 horas/día en tareas repetitivas

### Después (Operador de Realidad)
✅ Email llega → Se extrae info → Se crea tarea en Notion automáticamente  
✅ Un trigger → Mensaje a 15 personas + log en spreadsheet + notificación  
✅ Datos de 3 fuentes → Se fusionan → Dashboard actualizado en tiempo real  
✅ **Tiempo liberado:** 2-3 horas/día para crear, pensar, vivir

---

## Casos de Uso Reales

### Nivel 1: Automatización Simple
**Problema:** Emails de clientes se pierden en el inbox.  
**Solución Red de Indra:**  
1. GmailPort detecta email con palabra clave  
2. OrbitalCore extrae datos (nombre, solicitud, urgencia)  
3. NotionPort crea ticket en base de datos  
4. SlackPort notifica al equipo  

**Resultado:** 0 segundos de trabajo manual.

### Nivel 2: Orquestación Multi-Sistema
**Problema:** Proceso de onboarding requiere 8 pasos en 5 herramientas.  
**Solución Red de Indra:**  
1. Trigger: Nuevo registro en Google Forms  
2. OrbitalCore ejecuta secuencia:  
   - Crea usuario en Notion  
   - Envía email de bienvenida  
   - Genera acceso a Slack  
   - Programa seguimiento en 3 días  
   - Actualiza dashboard de métricas  

**Resultado:** 45 minutos → 30 segundos.

### Nivel 3: Traducción de Realidades
**Problema:** Equipo de diseño trabaja en Figma, devs en GitHub, managers en Sheets.  
**Solución Red de Indra:**  
1. Cambio en Figma → OrbitalCore detecta  
2. Traduce diseño a especificación técnica  
3. Crea issue en GitHub con contexto  
4. Actualiza roadmap en Google Sheets  
5. Notifica en Slack con preview visual  

**Resultado:** Todos los reinos sincronizados en tiempo real.

---

## ¿Por Qué INDRA OS y No Otra Cosa?

### La Diferencia Fundamental

| Aspecto | Zapier/Make/n8n | INDRA OS |
|---------|-----------------|----------|
| **Filosofía** | Cadenas lineales de apps | Red interconectada de reinos |
| **Límite** | Automatizaciones predefinidas | Operador de realidad libre |
| **Costo** | $20-200/mes por flujos limitados | $0 infraestructura (Google Apps Script) |
| **Propiedad** | Datos en servidores de terceros | Soberanía total de datos |
| **Complejidad** | Click-click-click interfaces | Diseño espacial de flujos |
| **Límite técnico** | APIs que soporten, timeouts | Control total del código |

### El Factor Soberanía
- **Tus datos nunca salen de tu Google Drive**
- **Código 100% open source y auditable**
- **Sin vendor lock-in:** Si INDRA desaparece, tu Core sigue funcionando
- **Zero-trust:** Cada Adapter es aislado, un fallo no tumba el sistema

---

## Instalación: 3 Comandos

### Opción A: Script Automático (Windows)
```powershell
irm https://raw.githubusercontent.com/Airhonreality/indra-os/master/scripts/bootstrap.ps1 | iex
```

### Opción B: Manual
```bash
git clone https://github.com/Airhonreality/indra-os.git
cd indra-os
# Seguir instrucciones en LAUNCH_INSTRUCTIONS.md
```

**Requisitos:**
- Cuenta de Google (para OrbitalCore en Apps Script)
- Node.js 18+ (para el Avatar/Frontend)
- 10 minutos de configuración inicial

---

## Arquitectura Técnica (Para Devs)

### OrbitalCore: Diseño por Leyes Físicas
```javascript
// Sistema basado en "física espacial"
const topology = {
  gravity: detecta_dependencies_automaticamente,
  contracts: valida_integridad_de_mensajes,
  ports: aisla_cada_adaptador_en_espacio_propio
};
```

**Principios arquitectónicos:**
1. **Topología antes que implementación:** El sistema se autoorganiza por dependencias
2. **Contratos axiomáticos:** Validación matemática de mensajes
3. **Ports & Adapters:** Cada reino es un puerto aislado
4. **Zero acoplamiento:** Core nunca conoce a los Adapters, solo contratos

### Tests: 100% de Cobertura
```
✓ 47 unit tests (Core Orchestrator)
✓ 23 integration tests (Ports)
✓ 12 contract validation tests
✓ 8 physics tests (dependency resolution)
```

**Stack:**
- Backend: Google Apps Script (V8 runtime)
- Frontend: React + Vite
- Módulo ISK: Canvas API + algoritmos espaciales
- Testing: Jest-like custom framework

---

## Pitch de 60 Segundos

> "¿Cuántas horas a la semana pierdes copiando datos entre herramientas, enviando emails repetitivos o sincronizando sistemas manualmente?
>
> INDRA OS es tu **Red de Indra personal**: conecta Gmail, Notion, Slack, APIs... todo lo que uses, en una red viva donde cada acción se refleja automáticamente en todos los sistemas relevantes.
>
> No es solo automatización. Es convertirte en **Operador de Realidad**: diseñas visualmente cómo interconectar tus reinos digitales, y el sistema ejecuta sin que toques código.
>
> **100% open source, datos soberanos en tu Google Drive, $0 de infraestructura.**
>
> Deja de ser esclavo de procesos manuales. Opera tu realidad."

---

## Estado Actual: Beta Privada

### ✅ Listo para Uso
- OrbitalCore desplegado y funcional (100% tests pasando)
- Frontend con ISK Designer operativo
- Adapters básicos: Gmail, Sheets, HTTP
- Documentación técnica completa

### 🚧 En Desarrollo
- Adapter de Notion (80%)
- Adapter de Slack (planeado)
- Interfaz de debugging avanzada
- Marketplace de Adapters comunitarios

### 📊 Métricas de Validación
- **Usuarios Alpha:** 1 (creador)
- **Flujos en producción:** 3
- **Tiempo ahorrado medido:** ~8 horas/semana
- **Uptime OrbitalCore:** 99.8% (último mes)

---

## Próximos Pasos

### Para Probadores Beta
1. **Llenar formulario de interés:** [link pendiente]
2. **Recibir invitación + acceso al repo privado**
3. **Sesión de onboarding 1:1** (30 min)
4. **Diseñar primer flujo juntos**
5. **Feedback iterativo vía Discord**

### Para Colaboradores
- **Código:** [github.com/Airhonreality/indra-os](https://github.com/Airhonreality/indra-os)
- **Docs técnicas:** `/OrbitalCore_Codex_v1/documentacion`
- **Roadmap:** Ver `/docs/pilar_1_skins_sub_hoja_ruta.md`

---

## Contacto

**Creador:** Javier (Airhonreality)  
**Email:** Airhonreality@gmail.com  
**GitHub:** [@Airhonreality](https://github.com/Airhonreality)  
**Demo live:** [https://airhonreality.github.io/indra-os/](https://airhonreality.github.io/indra-os/)

---

*"En la Red de Indra, cada joya refleja todas las demás. En INDRA OS, cada sistema conectado amplifica el poder de todos los demás. Deja de trabajar para las herramientas. Hazlas trabajar para ti."*
