# ADR 040: Sub-Sistema de Ingesta Nativa para Indra AEE

**Estado: PROBADO EN CAMPO (v4.66) / LISTO PARA INTEGRACIÓN NATIVA**  
**Contexto:** Evolución del motor "PUP" (Peristaltic Upload Protocol) hacia un componente axiomático del Indra AEE.

---

## 1. Visión Holística (TGS - Teoría General de Sistemas)

Desde la TGS, la Ingesta no es una herramienta externa, es el **Aparato Digestivo** del Sistema Indra. Su función es captar materia bruta (Entropía/Datos de Campo) y transformarla en información canónica (Negentropía/Formato H.264-AAC) lista para ser metabolizada por el Core.

### Propiedades del Sub-Sistema:
1.  **Equifinalidad:** No importa si la red falla, si el móvil se bloquea o si el archivo pesa 1TB; el resultado final siempre debe ser la consolidación del dato en el repositorio de destino.
2.  **Homeostasis:** El sistema se autorregula (cambio dinámico a subida fragmentada, salto de transcodificación si el hardware falla, persistencia degradada en RAM si el disco falla) para mantener la estabilidad de la cola.
3.  **Interfaces Definidas:** El intercambio entre el Sub-Sistema de Ingesta y el Super-Sistema Indra ocurre a través de **Contratos de Metadatos**, no de implementación técnica.

---

## 2. Marco Axiomático de Integración

Para que la integración sea "Indra-Pura", debe seguir estos axiomas:

*   **Axioma I (Identidad Invariante):** El archivo se define por sus metadatos de negocio (Nombre/Fecha/Uploader), no por su ID técnico o su tamaño variable tras transcodificación.
*   **Axioma II (Zero Hardcoding):** Las reglas de guardado (rutas, nombres de carpeta) deben ser inyectadas por el **Workflow Designer** de Indra, no pre-programadas en el Gateway.
*   **Axioma III (Transcodificación Obligatoria):** Solo la materia estandarizada (Canónica) tiene permiso para cruzar la frontera del Core.

---

## 3. Arquitectura del Componente Nativo AEE

El motor desarrollado (v4.66) se encapsulará en la clase `AEE_IngestComponent`:

### Estructura del JSON del Workflow:
```json
{
  "type": "UNIVERSAL_INGEST",
  "id": "ingesta_fotos_terreno",
  "rules": {
    "target_folder": "Barichara_2026/Investigacion/{investigador}",
    "naming_convention": "INDRA_{date}_{filename}",
    "transcoding_preset": "HD_STABLE",
    "max_queue_size": 100
  }
}
```

### Flujo Metabólico Interno:
1.  **Captura (IngestField):** Selección masiva via "Referencia Líquida".
2.  **Digestión (MIEOrchestrator):** Streaming Transcoding (10MB chunks).
3.  **Absorción (PeristalticUpload):** Fragmented Resumable Upload.
4.  **Verificación (Sonda Semántica):** Sincronización indempotente basada en metadatos.

---

## 4. Hoja de Ruta (Tareas Pendientes)

### Fase A: Abstracción del Gateway
- [ ] Eliminar lógica de rutas específicas en el Backend (`provider_drive.js`).
- [ ] Implementar el evaluador de templates en el Backend (ej: traducir `{investigador}` a su valor real).

### Fase B: Inyección en el AEE
- [ ] Registrar `AEE_IngestComponent` en la librería central de componentes.
- [ ] Conectar el estado del `IngestManager` (Singleton) con el Contexto de Indra para que otros componentes puedan ver el progreso global.

### Fase C: Portabilidad Total
- [ ] Migrar el `EmergencyIngest.jsx` a un Web Component instalable como PWA independiente pero capaz de sincronizarse con la base de datos de Indra cuando detecte conexión.

---

## 5. Conclusión Sistémica
La ingesta de 1TB en condiciones extremas es ahora una **Capacidad Instalada** de Indra. Su integración como función nativa permitirá que cualquier despliegue de Indra (desde control de incendios hasta investigación antropológica) herede una resiliencia de datos que hasta hoy era imposible de garantizar.
