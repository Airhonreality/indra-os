/**
 * UTILIDAD DE DESARROLLADOR: Sincronización de ADN Core.
 * Ejecuta esta función manualmente desde el editor de Apps Script si la URL del Core cambia.
 */
function DEV_UpdateCoreUrlInDrive() {
  // AXIOMA DE SOBERANÍA: Forzamos la URL oficial solicitada por el usuario
  const officialUrl = 'https://script.google.com/macros/s/AKfycbwHtq6XTBvCzOpM1eM_3-kTe1vlkIbwIpFT0Acd6kpNM91PpxWz9yq0tCmLFsoVvA-Fnw/exec';
  const currentUrl = officialUrl; 
  
  const manifestFileName = 'INDRA_MANIFEST.json';
  const folderName = '.core_system';
  
  console.log('--- 🛰️ INDRA ADN SYNC ---');
  console.log('URL Detectada por el motor: ' + currentUrl);
  
  if (currentUrl.indexOf('/dev') !== -1) {
    console.warn('CUIDADO: Estás ejecutando esto desde el modo desarrollo (/dev).');
    console.warn('Asegúrate de que esta es la URL que quieres que Indra use en el navegador.');
  }
  
  const folders = DriveApp.getRootFolder().getFoldersByName(folderName);
  if (!folders.hasNext()) {
    console.error('No se encontró la carpeta .core_system en Drive.');
    return;
  }
  
  const folder = folders.next();
  const files = folder.getFilesByName(manifestFileName);
  
  if (!files.hasNext()) {
    console.error('No se encontró el archivo INDRA_MANIFEST.json en .core_system.');
    return;
  }
  
  const file = files.next();
  const content = JSON.parse(file.getBlob().getDataAsString());
  
  console.log('URL Anterior en Drive: ' + content.core_url);
  content.core_url = currentUrl;
  
  file.setContent(JSON.stringify(content, null, 2));
  console.log('--- ÉXITO: ADN actualizado en Drive con la URL actual del Core ---');
  console.log('Ahora refresca tu navegador (Ctrl+F5) y Indra debería conectar con la v4.83.');
}
