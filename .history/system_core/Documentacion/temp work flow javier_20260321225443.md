EN el core selector: mejorar seleccion multi core ui apeñuscada, meroar sitema de cards y usabildiad---
hacer reemplazo masivo de todos los botones de elimnar / purgar / borrar etc para quitar el texto del boton y solo dejar el icono de elimnar canonico, y verificar que el la animacion del pulso es livina y ultra ligera y que todos estan almbrados...
....





---
docuemnt desginer,

EL panle de añadir o insertar objero¿tos tiene 3 botones que llevna al mismo lugar  "+" en layers "crear" en pestaña e "insertar" por favor limpiar la entropida de este modulo y minimalizar el ruido. 



LANGUAJE
por favor respetar el paradigma de todo languaje español en la UI, y bine eituqetado como pal peraparado apra recibir mas languajes de manera axioamtica:

---
Paso 0: El Disparador (Ignición)
Tipo: WEBHOOK / PULSO.
Configuración: Vincula este Webhook a tu formulario AEE. Cuando el usuario envía el formulario, todos los campos estarán disponibles en el objeto $payload.
Paso 1: Crear la Carpeta (Axioma de Organización)
Este paso genera el contenedor en Google Drive donde guardaremos el resultado.

Tipo de Estación: ACCIÓN_ATÓMICA.
Proveedor: 

drive
.
Protocolo: ATOM_CREATE.
Asignación de Datos (Mapping):
NAME / LABEL: Selecciona el campo del formulario desde el SlotSelector (ej: $payload.nombre_del_cliente).
CONTEXT_ID: Puedes dejarlo vacío (creará en la raíz) o poner el ID de una carpeta "Padre" de forma estática.
Paso 2: Generar el PDF (Soberanía Indra)
Aquí invocamos al Native Document Engine para que tome tu diseño y lo fusione con los datos del formulario.

Tipo de Estación: ACCIÓN_ATÓMICA.
Proveedor: 

system
.
Protocolo: NATIVE_DOCUMENT_RENDER.
Configuración:
Context ID: Pega el ID del documento que diseñaste en el Document Designer.
Asignación de Datos (Mapping):
VARIABLES: Aquí viene la magia. Mapea el objeto entero $payload o campos específicos. El motor buscará los placeholders {{campo}} en tu documento y los rellenará automáticamente.
Resultado: Este paso genera un átomo con la metadata del archivo y el contenido en file_base64.

Paso 3: Guardar el PDF en la Carpeta (Cierre del Ciclo)
Ahora subimos el PDF generado a la carpeta que creamos en el Paso 1.

Tipo de Estación: ACCIÓN_ATÓMICA.
Proveedor: 

drive
.
Protocolo: ATOM_CREATE.
Configuración:
Context ID: Usa el SlotSelector para apuntar al ID de la carpeta creada en el Paso 1: $steps.crear_la_carpeta.0.id.
Asignación de Datos (Mapping):
Mapea el resultado completo del Paso 2 (el átomo del PDF) a este paso. El provider de Drive detectará el campo file_base64 y, en lugar de crear una carpeta, creará el archivo PDF dentro de la carpeta destino.