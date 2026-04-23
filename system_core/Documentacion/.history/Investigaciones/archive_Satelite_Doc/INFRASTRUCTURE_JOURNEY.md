# EL VIAJE DEL PULSO : MAPA DE INFRAESTRUCTURA INDRA (v4.5)

Este documento describe la odisea de un dato desde la voluntad del usuario (Satélite) hasta la Verdad Física (Core). Es de lectura obligatoria para cualquier Agente de IA para entender por qué **el Satélite NO puede tocar el Core directamente**.

---

## 🗺️ EL MAPA RETICULAR

```mermaid
graph TD
    A[Usuario / UI] -->|1. Acto de Voluntad| B[IndraBridge]
    B -->|2. Petición UQO + Token| C[API Gateway (GAS)]
    C -->|3. Validación de Capas| D[Protocol Router]
    D -->|4. Despacho Ciego| E[Providers]
    E -->|5. Cristalización| F[( Drive / Notion / Sheets )]
    F -->|6. Respuesta Atómica| E
    E -->|7. Validación de Contrato| D
    D -->|8. Resonancia| B
    B -->|9. Feedback Visual| A
```

---

## 🧬 FASE 0: EL ORIGEN (LA ESPINA DORSAL)
Antes de cualquier pulso, existe la **Materia Definida**.
*   **src/score/schemas/**: Es el útero del satélite. Aquí residen los archivos JSON que definen la realidad. 
*   **Axioma**: Si un dato no tiene un esquema en esta carpeta, el sistema no lo reconoce como real.

## 🛰️ FASE 1: LA PERIFERIA (SATÉLITE)
El Satélite es **ciego por diseño**. No sabe si el archivo existe o en qué cuenta de Google está.
*   **IndraBridge**: Es el único embajador autorizado. Empaqueta el **UQO** (Universal Query Object) y le inyecta el **Satellite Token** y el **Environment (Production/Sandbox)**.

## 🌉 FASE 2: EL PORTAL (API GATEWAY - GAS)
Es el guardián de la soberanía. 
*   **Handshake**: Verifica que el Satélite esté "Vivo" en el Ledger del Core.
*   **Sandbox Diversion**: Si el pulso viene marcado como `SANDBOX`, el Gateway desvía la ruta hacia el purgatorio de basura para proteger la producción.

## ⚙️ FASE 3: EL CEREBRO CIEGO (PROTOCOL ROUTER)
Es el orquestador que conoce los **Data Contracts**.
*   No sabe *cómo* escribir en Notion, pero sabe *quién* sabe hacerlo.
*   **Aduana de Entrada**: Valida que el UQO no sea "Materia Oscura" (formato inválido).
*   **Registry Lookup**: Busca en el registro qué función interna de GAS debe ejecutar el protocolo.

## 🛠️ FASE 4: LOS EJECUTORES (PROVIDERS)
Son los traductores. Transforman la voluntad de Indra en el lenguaje del mundo físico.
*   **Provider Drive**: Habla con carpetas y JSONs.
*   **Provider Intelligence**: Habla con LLMs.
*   **Provider System**: Gestiona la propia infraestructura del Core.

## 🧘 FASE 5: LA RESONANCIA (RETORNO)
El viaje de vuelta es tan importante como el de ida.
*   **Validación de Salida**: Antes de que el dato salga del Core, el Router verifica que el Provider no haya roto el **Data Contract**. Si el dato es incompleto, el Core lanza un `CONTRACT_VIOLATION`.
*   **Handshake de Resonancia**: El Bridge recibe el dato y actualiza su estado interno, cerrando el círculo.

---

## 🛑 REGLA DE ORO PARA IAs
Si intentas inyectar lógica que se salte alguno de estos pasos (ej: intentar que el satélite haga un `fetch` directo a una DB), estás actuando fuera del Ecosistema Indra. **El Satélite solo propone; el Core dispone.**
