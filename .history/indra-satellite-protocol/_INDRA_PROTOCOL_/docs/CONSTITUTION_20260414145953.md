# LA CONSTITUCIÓN DE INDRA (Protocolo Semilla)

> **"Un satélite no programa sus datos, solo los proyecta."**

Esta constitución define las reglas inquebrantables para la construcción de cualquier proyecto (Satélite) que consuma el Core de Indra. Si sigues estas reglas, tu proyecto será inmortal, agnóstico y escalable.

---

## REGLA I: LAS 3 CAPAS DEL MODELO INDRA

Todo proyecto debe estar dividido en tres reinos soberanos:

### 1. La Materia (Raw Data)
Los datos no existen en tu código ni en tu servidor. Los datos viven en **Silos de Infraestructura** (Google Sheets, Notion, Drive). Si tu web desaparece, la Materia permanece intacta y soberana en el Core del usuario.

### 2. El Espíritu (Flujos y Automatización)
La lógica de negocio (ej: *"Calcular descuento por volumen"*) no se escribe en Javascript en el frontend. Se define en **Bridges y Workflows** dentro de Indra. El satélite solo pide ejecuciones; el Core es el que tiene la inteligencia.

### 3. La Forma (UI Agnóstica)
Tu frontend (React, Vue, HTML puro) es solo un **Caparazón Vacío**. Su única responsabilidad es:
1.  Conectarse al Core vía `IndraBridge`.
2.  Preguntar por el `DATA_SCHEMA`.
3.  Renderizar la interfaz basada en ese esquema (Resonancia).

---

## REGLA II: SINCERIDAD DE IDENTIDAD

- **Invarianza del ID**: Nunca inventes un ID para un registro. El ID es el que te da el proveedor (ej: el Drive ID).
- **Handle sobre Clase**: No programes contra clases de datos específicas si puedes programar contra **Aliases**. Esto permite que si cambias la base de datos de origen, el frontend siga funcionando sin tocar una línea de código.

---

## REGLA III: EL CERO-HARDCODING

Un satélite nunca debe tener hardcodeado:
- El `core_url` (Se descubre vía OAuth).
- El `satellite_token` (Se gestiona vía Keychain).
- El `core_id` (Se hidratada en tiempo de vuelo).

---

## REGLA IV: PERMISOS MULTI-USUARIO

Indra no gestiona usuarios de forma tradicional. El acceso se basa en **Delegación de Capacidad**:
1.  **El Propietario (Core Owner)**: Tiene acceso absoluto.
2.  **El Sistema (Machine)**: Accede mediante `satellite_token`.
3.  **El Público**: Accede mediante `share_ticket` (Enlaces públicos).

---

## CONCLUSIÓN

Al seguir el **Protocolo Semilla**, dejas de construir aplicaciones aisladas y empiezas a ignitar **Celdas de un Organismo Mayor**. Indra es el sistema nervioso; tu satélite es solo un ojo o una mano.

---
*Para instrucciones técnicas de arranque, consulta el [IGNITION_GUIDE.md](file:///./IGNITION_GUIDE.md).*
