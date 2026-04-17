/**
 * UTILIDAD DE DESARROLLADOR: Sincronización de ADN Core.
 * Ejecuta esta función manualmente desde el editor de Apps Script si la URL del Core cambia.
 */
function DEV_UpdateCoreUrlInDrive() {
  const currentUrl = ScriptApp.getService().getUrl();
  const manifestFileName = 'INDRA_MANIFEST.json';
  const folderName = '.core_system';
  
  console.log('--- INICIANDO ACTUALIZACIÓN DE ADN ---');
  console.log('URL de este Core detectada: ' + currentUrl);
  
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
