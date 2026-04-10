# Manual de Ingesta Pública AEE y MIE (Terminal de Ingesta Colaborativa)

- **Fecha:** 2026-04-07
- **Módulo:** Multimedia Ingest Engine (MIE) + AEE FormRunner
- **Característica:** Carga pública universal desde dispositivos móviles con transcodificación en el cliente y aduana de memoria local.

---

## 1. Contexto General

La plataforma Indra cuenta con la capacidad de generar **Formularios Públicos Ultra-Simples** para la ingesta masiva de archivos multimedia desde cualquier dispositivo móvil (incluyendo iPhones y dispositivos Android), aprovechando las capacidades del entorno AEE (Adaptive Entity Engine) y el MIE (Multimedia Ingest Engine).

Esta característica permite que colaboradores externos puedan subir grandes cantidades de videos o fotografías directamente a una carpeta específica (Silo) del propietario, delegando el peso computacional de la compresión y transcodificación al procesador (y la GPU) del _teléfono del invitado_, sin consumir recursos del backend y reduciendo enormemente el uso de datos.

---

## 2. Componentes del Flujo

### A. El Creador del Acceso (`SiloShareCreatorWidget`)
Es el widget que el arquitecto/propietario ve desde el entorno de diseño del AEE. Se registra en el formulario para establecer el contrato del enlace público.
- **Selección de Silo:** Permite seleccionar la carpeta raíz en Google Drive (u otro proveedor) donde llegarán todos los archivos mediante el Explorador de Realidad de Indra.
- **Preset MIE:** Permite ajustar el protocolo de transcodificación (ej: `PLUMA` para la compresión extrema que un usuario móvil necesita para enviar gigabytes rápido, o `BALANCED` para entornos donde pesa el balance visual).
- **Enlace de Invitación:** Genera un código QR verificable y una URL pública altamente segura, definida bajo un control de tiempo de caducidad.

### B. El Hub del Invitado (`IngestGuestView`)
Cuando un usuario ajeno recibe y abre la URL en su celular, no requiere autenticarse en el entorno completo del AEE.
- **Interfaz Zero-Fricción:** Se le presenta una terminal de interacción pura con el `<MIEDropzone />`. Solo hay un paso: Arrastrar o seleccionar de la galería la multimedia.
- **Hardware Acceleration Local:** Inmediatamente luego de la selección, su propio dispositivo entra en modo _Web Workers Pool_, analizando la metadata y procesando video y foto optimizable para la autopista hacia el Silo especificado.

---

## 3. Implementación de la "Aduana de Memoria de Bolsillo" (Novedad)

Para resolver el problema de las cargas duplicadas que provocaban un consumo innecesario de GPU y datos en los invitados, se orquestó una solución de **Soberanía y Eficiencia Local**, blindando el `MIEOrchestrator` contra subidas repetidas, sin solicitar comparaciones de red (Peso Cero).

### Concepto Técnico (Fingerprinting)
En lugar de comparar el nombre de un archivo que los navegadores móviles cambian arbitrariamente (ej. `IMG_0023.jpg` a `image.jpg`), generamos un identificador rápido local:
```javascript
export const getFileFingerprint = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
};
```

### Arquitectura de Evitación (Zero-Trust Local)
1. **Historial de Ingesta Cíclico:** Cada archivo confirmado como subido ('DONE') registra su huella en el `localStorage` (`indra_mie_upload_history`). El caché retiene inteligentemente hasta **1000 elementos** bajo una regla FIFO (`history.shift()`) limitando la huella de memoria para el explorador del invitado a meros kilobytes.
2. **Detección Preventiva del Frontend:** En el evento primario de soltar el contenido (en `IngestGuestView`), ocurre una pre-revisión de la cola de archivos comparándolos en **milisegundos** con la aduana local. 
3. **Poda e Instrucción Gráfica:** Los archivos bloqueados son apartados del pool del *Orchestrator*, protegiendo la GPU. Al mismo tiempo se arroja un estado visual alerta (Industrial Amber) para informarle al humano que **"N Duplicados han sido evitados"**, transmitiendo seguridad y certidumbre.

### Beneficios Resultantes
- **Eficiencia Absoluta:** Menos transferencias quemadas.
- **Confianza Offline-First:** El teléfono recuerda el progreso, indistintamente de la sesión.
- **Feedback Transparente:** La advertencia gráfica genera alivio cognitivo ("el sistema se ocupó de mi desorden").

---

## 4. Guía de Uso Rápido (Creación del Form)

1. Abrir el *Lienzo AEE* e incluir el tipo de nodo **Silo Share Creator**.
2. Hacer clic en `SELECCIONAR CARPETA RAÍZ` mediante el artefacto visualizador. 
3. Seleccionar la calidad bajo _MIE PRESET_.
4. Especificar el tiempo de validación de este hub (ej: 7 Días).
5. Hacer clic en **Generar Link Público**. Compartir.

---
> **Estado:** Desplegado operativamente | **Revisión:** Aprobada.
