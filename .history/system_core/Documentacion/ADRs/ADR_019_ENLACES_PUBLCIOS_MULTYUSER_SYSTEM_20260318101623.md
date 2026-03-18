Contexto: El sistema Indra actual opera en un modelo de usuario único y autenticado. No existe un mecanismo para compartir artefactos ejecutables (como formularios del AEE) con usuarios externos (anónimos) o usuarios específicos de otras instancias de Indra de una manera segura y controlada.
Decisión: Se implementará un sistema de "Manifiesto de Carga" a través de URLs de Capacidad. Las URLs cortas apuntarán a un manifiesto almacenado soberanamente en el Core del propietario. Este manifiesto contendrá la core_url, el artifact_id y el modo de autenticación. Se soportarán dos nuevos modos:
Público (public_key): Acceso anónimo validado por una API Key de ámbito limitado.
Permisionado (google_sso): Acceso para usuarios específicos de Indra, validados a través de Google Sign-In y una Lista de Control de Acceso (ACL) en el manifiesto.
Consecuencias:
Positivas: Desbloquea la compartición de artefactos, habilita flujos de trabajo B2C (ej. un cliente rellenando una cotización), permite la colaboración segura entre usuarios de Indra, y mantiene la soberanía y el control en manos del propietario del Core.
Negativas: Introduce complejidad en el flujo de autenticación. El proceso de resolución de la URL corta añade una llamada de red adicional (latencia). Aumenta ligeramente la superficie de ataque del Core.
Este es el corazón del protocolo. Es un objeto JSON con la siguiente estructura:

{
  "version": "1.0",
  "owner_uid": "propietario@gmail.com", // El Indra User Domain (UID) del creador
  "core_url": "https://script.google.com/macros/s/ABC.../exec", // La URL del Core del propietario
  "artifact_type": "AEE_FORM_RUNNER", // Tipo de artefacto (para futura expansión)
  "artifact_id": "cotizacion-simplificada-v2", // ID del artefacto específico
  "auth_mode": "public_key" | "google_sso", // El modo de autorización requerido
  "acl": [ // Lista de Control de Acceso, solo relevante para 'google_sso'
    "aliado@gmail.com", 
    "cliente_importante@gmail.com"
  ],
  "api_key": "pub_key_aee_cotizacion_12345" // Clave de API, solo relevante para 'public_key'
}


https://<tu_usuario_github>.github.io/indra-client/run?id=<manifest_id>

id: El puntero (ej. man_A8bC1f) que identifica el manifiesto en la Google Sheet del propietario. Nota: Decidí eliminar el core_id de la URL para máxima limpieza, y abordar el desafío de resolución a continuación.
Nuevo Enrutamiento (App.jsx):

Añadir una nueva ruta: <Route path="/run" element={<ManifestResolver />} />
Nuevo Componente: ManifestResolver.jsx

Propósito: Es la pantalla de carga que orquesta la resolución del enlace.
Lógica:
Al montar, extrae id de los parámetros de la URL.
¿Cómo sabe a qué Core preguntar? (Solución al "Huevo y la Gallina"): No lo sabe. Muestra una interfaz simple: "Estás abriendo un enlace de Indra. Introduce el correo del propietario para continuar (ej. nombre@empresa.com)".
El usuario introduce el correo (UID). Esto solo se pide la primera vez y se puede guardar en localStorage para ese id.
Usa un "Directorio de Cores" (un JSON en el repo de la UI) para encontrar el core_url a partir del UID.
Hace un fetch a <core_url_resuelta>?action=getManifest&manifest_id=<id>.
Recibe el JSON del manifiesto.
Dependiendo del auth_mode:
public_key: Carga el AEEFormRunner directamente, configurando el ProtocolContext con la core_url y la api_key del manifiesto.
google_sso: Inicia el flujo de Google Sign-In. Tras el login, compara el correo del usuario logueado con la acl. Si coincide, carga el AEEFormRunner; si no, muestra un error de "Acceso Denegado".
Mientras todo esto ocurre, muestra un <Spinner />.
Nuevo Componente: ShareModal.jsx

Abierto desde el dashboard de artefactos.
Permite al propietario elegir el artefacto.
Ofrece opciones: "Público (cualquiera con el enlace)" vs. "Específico (introduce correos)".
Al confirmar, llama al método createShareableLink en su propio Core.
Recibe la URL corta y la muestra para que el usuario la copie.
Contexto ProtocolContext.jsx:

Necesita una función configureDynamic(coreUrl, authHeader) que permita al ManifestResolver inyectar la configuración para la sesión actual.
Nueva Hoja: PublicManifests

Columnas: id (Clave Primaria, ej. man_A8bC1f), manifest_json (el string JSON completo).
Endpoint Principal (doGet/doPost) - La Aduana Mejorada:

function handleRequest(e) {
  const params = e.parameter;
  const headers = e.headers;

  // Ruta 1: Resolución de Manifiesto (Pública y Segura)
  if (params.action === 'getManifest') {
    return getManifest(params.manifest_id); 
  }

  // Identificar al agente invocador
  if (headers['Authorization']) { // Ruta 2: Usuario Propietario (Flujo Actual)
    // ...lógica de validación de token de Google actual...
  } else if (headers['x-public-api-key']) { // Ruta 3: Usuario Anónimo (API Key)
    // ...lógica de validación de clave pública...
  } else if (headers['x-indra-invoked-by']) { // Ruta 4: Usuario Federado (SSO)
    // ...lógica de validación de ACL...
  } else {
    return createErrorResponse('No credentials provided.');
  }
  
  // ...el resto de la ejecución del workflow...
}


Nuevos Métodos del Core:

getManifest(manifestId):
Lee la hoja PublicManifests.
Busca la fila con el manifestId.
Devuelve el manifest_json como una ContentService de tipo JSON. Importante: No devuelve el manifiesto completo si contiene secretos; solo la parte pública necesaria por el cliente para el siguiente paso. O, más simple, confía en que la URL del Core no es un secreto.
createShareableLink(artifactId, accessType, acl):
Genera un manifestId único.
Construye el objeto JSON del manifiesto.
Si es public_key, genera una api_key única.
Guarda el par (manifestId, manifest_json) en la hoja PublicManifests.
Devuelve la URL corta al frontend: https://.../run?id=<manifestId>.
Debilidad: Robo de Manifiesto. Si un atacante adivina un manifest_id válido y conoce el UID del propietario, podría obtener el manifiesto y, si este es público, usar la api_key.

Mitigación: Los manifest_id deben ser largos y no secuenciales (usar Utilities.getUuid()). La api_key debe tener el menor privilegio posible: solo puede ejecutar, no leer ni escribir nada más allá de lo estrictamente necesario para esa transacción.
Debilidad: La Entrada del "Correo del Propietario". Pedir al usuario que escriba un correo es propenso a errores y una fricción de UX.

Mitigación: Es un compromiso inicial. A futuro, se puede explorar un "acortador de URLs" centralizado y opcional para la comunidad Indra, o incluso usar servicios como cutt.ly que permitan pasar la URL larga con el manifiesto completo en Base64. Sin embargo, el método manual es el más descentralizado para empezar.
Debilidad: Compromiso de la UI Central. Como mencionaste en la documentación (AXIOMA_PORTADA_LANDING.md), si la UI principal en GitHub Pages es comprometida, podría robar los datos de los formularios.

Mitigación: Esta es la debilidad fundamental de cualquier modelo de "Proyector Universal". La mitigación no es técnica, sino filosófica y está en tu ADR: el Escenario B (Soberanía). La máxima seguridad se alcanza cuando una organización despliega su propio front-end. El modelo público es para baja seguridad y alta conveniencia.
Totalmente compatible. La clave es que el flujo de autenticación existente (un usuario propietario interactuando con su propio Core) no se toca. La lógica en el handleRequest del Core prioriza la cabecera Authorization existente. Los usuarios que no usen la función de compartir no notarán ningún cambio.
Los nuevos componentes (ManifestResolver, ShareModal) son adiciones, no modificaciones destructivas. Se cargan bajo nuevas rutas o interacciones del usuario.
El sistema simplemente gana nuevas "puertas de entrada" a la aduana, pero la puerta principal del ciudadano sigue funcionando igual.