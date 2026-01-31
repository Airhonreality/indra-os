# 🌌 Soberanía Contextual & Shared Cosmos (Estado de Gracia)

Este documento define la arquitectura de multi-tenencia de Indra OS, permitiendo que un único Núcleo (Core) sirva a múltiples arquitecturas soberanas de forma aislada y segura.

## 1. El ADN Transaccional (`systemContext`)

La soberanía en Indra OS no reside en el código, sino en el **contexto de la transacción**. Cada ejecución porta un objeto de identidad que define su realidad:

- `accountId`: El identificador único del teniente o propietario de la cuenta.
- `cosmosId`: El identificador del espacio de trabajo o "universo" específico (ej: una cuenta de Notion, una parcellación de Drive).

### Axioma de Aislamiento
> Ningún adapter o servicio puede acceder a recursos físicos que no coincidan con el `accountId` y `cosmosId` presentes en el `systemContext`.

---

## 2. El Cofre Contextual (Token Management)

El `TokenManager` es el guardián de esta soberanía. En lugar de usar una llave maestra global, el sistema opera con un **Vault Polimórfico**:

1.  **Resolución Dinámica:** El sistema busca el archivo de tokens (`.tokens.json`) asociado al teniente.
2.  **Homeostasis de Sesión:** Tras cada llamada, el sistema ejecuta un `teardown()` que limpia los cachés de memoria, asegurando que el siguiente contexto entre en un entorno "limpio".
3.  **Agnosticismo Físico:** El núcleo no sabe dónde residen los datos; el `systemContext` le proporciona los IDs de las carpetas raíz (`rootFolderId`) para proyectar la infraestructura.

---

## 3. Estados del Sistema

El sistema transita por ciclos de vida contextuales:

- **Efecto Boomerang:** Una entrada externa (webhook) es capturada, se le asigna un ADN (`systemContext`) y se proyecta en el Core.
- **Hibernate (Stateless):** Fuera de la ejecución, el sistema no mantiene estado en memoria. La soberanía reside "en reposo" en la capa física de Drive.
- **Ignición de Cosmos:** El `SystemInitializer` puede reconstruir un Cosmos entero desde cero si detecta que la infraestructura física no coincide con lo definido en las leyes constitucionales.

---

## 4. Protocolos de Seguridad

1.  **Validación de ADN:** El `ContractGatekeeper` verifica que los inputs de una herramienta no intenten "saltar" a otro `cosmosId`.
2.  **Cifrado por Teniente:** Las llaves de API se encriptan con un mapa que solo el `systemContext` autenticado puede descifrar.
3.  **Auditabilidad Forense:** Cada acción queda marcada con el `accountId`, permitiendo trazabilidad total del comportamiento sistémico.

---

> [!IMPORTANT]
> Indra OS no es multi-usuario en el sentido tradicional (base de datos centralizada); es **Multi-Cosmos**. Cada transacción es una proyección independiente y soberana sobre un núcleo compartido.
