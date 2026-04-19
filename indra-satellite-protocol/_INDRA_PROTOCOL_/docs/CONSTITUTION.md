# LA CONSTITUCIÓN DE INDRA (Protocolo Semilla)

> **"Un satélite no programa sus datos, solo los proyecta."**

Esta constitución define las reglas inquebrantables para la construcción de cualquier proyecto (Satélite) que consuma el Core de Indra. Si sigues estas reglas, tu proyecto será inmortal, agnóstico y escalable.

---

## REGLA I: LAS 3 CAPAS DEL MODELO INDRA

Todo proyecto debe estar dividido en tres reinos soberanos:

### 1. La Materia (Raw Data)
Los datos no existen en tu código ni en tu servidor. Los datos viven en **Silos de Infraestructura** (Google Sheets, Notion, Drive). Si tu web desaparece, la Materia permanece intacta y soberana en el Core del usuario.

### 2. El Espíritu (Flujos y Orquestación)
La lógica de negocio no reside en tu código local. Se define en **Bridges y Workflows** dentro de Indra. El satélite es una membrana de interacción; el **Núcleo y la Malla** son los orquestadores de la inteligencia colectiva.

### 3. La Forma (Interconexión Relacional)
Tu frontend es un **Caparazón Inteligente**. Su responsabilidad es:
1.  Conectarse al Core vía `IndraBridge`.
2.  Interpretar el `DATA_SCHEMA`.
3.  Navegar el **Grafo Relacional** proyectando las conexiones entre átomos.

---

## REGLA II: SINCERIDAD DE IDENTIDAD

- **Invarianza del ID**: Nunca inventes un ID para un registro. El ID es el que te da el proveedor (ej: el Drive ID).
- **Handle sobre Clase**: Programa contra **Aliases**. Esto permite la mutabilidad de la infraestructura sin romper la experiencia.

---

## REGLA III: EL CERO-HARDCODING

Un satélite nunca debe tener hardcodeado:
- El `core_url` (Se descubre vía OAuth).
- El `satellite_token` (Se gestiona vía Keychain).
- El `context_id` (Se hidrata dinámicamente según la Célula habitada).

---

## REGLA IV: JURISDICCIÓN Y SOBERANÍA

Indra se basa en la **Delegación de Capacidad**:
1.  **El Propietario**: Acceso absoluto al Núcleo.
2.  **El Agente**: Acceso restringido vía `satellite_token`.
3.  **La Célula**: Jurisdicción local basada en el Ledger soberano.

---

## CONCLUSIÓN

Al seguir el **Protocolo Semilla**, dejas de construir aplicaciones aisladas y empiezas a ignitar **Células de un Organismo Micelar**. Indra es el sistema nervioso relacional; tu satélite es una membrana consciente de ese organismo mayor.

---
*Para instrucciones técnicas de arranque, consulta el [IGNITION_GUIDE.md](file:///./IGNITION_GUIDE.md).*
