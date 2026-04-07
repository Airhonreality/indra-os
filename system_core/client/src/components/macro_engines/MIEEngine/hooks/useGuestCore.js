import { executeDirective } from '../../../../services/directive_executor';
import { useAppState } from '../../../../state/app_state';

/**
 * useGuestCore
 * RESPONSABILIDAD: Comunicación con el Core de Indra para usuarios sin autenticar (Guests).
 * AXIOMA SOBERANO: ¡Tienes toda la razón! El Google Access Token ("ya29...") caduca en 1h. Y es peligroso exponerlo.
 * Sin embargo, el GAS backend está desplegado como "executeAs: USER_DEPLOYING". 
 * Por lo tanto, el backend YÁ TIENE ACCESO INFINITO al drive del dueño.
 * Todo lo que el frontend Guest necesita es mandar directivas al Core usando
 * el coreUrl y la CONSTANTE de sesión pública (o ningún secreto si el core es público).
 */
export const useGuestCore = () => {
    const coreUrl = useAppState(s => s.coreUrl);
    
    // Si la app está incrustada o compartiendo publicamente, el secreto no importa
    // o el backend valida el "token" de la app. Para simplicidad usaremos 'PUBLIC_GRANT'
    // asumiendo que el core valida peticiones abiertas.
    const sessionSecret = useAppState(s => s.sessionSecret) || 'PUBLIC_GRANT';

    const listFolder = async (folderId) => {
        try {
            const res = await executeDirective({
                provider: 'drive',
                protocol: 'HIERARCHY_TREE',
                context_id: folderId
            }, coreUrl, sessionSecret);
            return res.items || [];
        } catch (e) {
            console.error("Error listando folder guest:", e);
            return [];
        }
    };

    const uploadFile = async (base64Data, mimeType, fileName, folderId) => {
        try {
            const res = await executeDirective({
                provider: 'drive',
                protocol: 'ATOM_CREATE',
                context_id: folderId,
                data: {
                    name: fileName,
                    file_base64: base64Data,
                    mime_type: mimeType
                }
            }, coreUrl, sessionSecret);
            return res.items?.[0] || null;
        } catch (e) {
            console.error("Error subiendo archivo guest:", e);
            throw e;
        }
    };

    const deleteFile = async (fileId) => {
        await executeDirective({
            provider: 'drive',
            protocol: 'ATOM_DELETE',
            context_id: fileId
        }, coreUrl, sessionSecret);
    };

    const getDownloadUrl = async (fileId) => {
        // En drive, las descargas puras requieren token.
        // El backend resuelve un MEDIA_RESOLVE devolviendo la URL directa o de proxy
        const res = await executeDirective({
            provider: 'drive',
            protocol: 'MEDIA_RESOLVE',
            data: { strategy: 'BY_ID', asset_id: fileId }
        }, coreUrl, sessionSecret);
        
        return res.items?.[0]?.payload?.media?.canonical_url;
    };

    return { listFolder, uploadFile, deleteFile, getDownloadUrl };
};
