/**
 * NATIVE DOCUMENT ENGINE v1.0
 * ----------------------------
 * Misión: Renderizar documentos nativos de Indra (basados en bloques JSON) a PDF.
 * Axioma: Independencia total de Google Docs.
 * Soberanía: Los bloques del DocumentDesigner son la única fuente de la verdad.
 */

const NativeDocumentEngine = {
  
  /**
   * Procesa un átomo de tipo DOCUMENT y devuelve un Blob PDF de Google Apps Script.
   * @param {Object} docAtom - Átomo cargado desde el silo (con payload.blocks).
   * @param {Object} data - Variables de inyección {{key}} (opcional).
   * @returns {Blob} PDF Blob.
   */
  renderToPdf(docAtom, data = {}) {
    const blocks = (docAtom.payload && docAtom.payload.blocks) || [];
    if (blocks.length === 0) {
      throw new Error("[NativeDocumentEngine] El documento no contiene bloques o está vacío.");
    }

    logInfo(`[NativeDocumentEngine] Iniciando renderizado PDF de "${docAtom.handle?.label || docAtom.id}"...`);

    // 1. Ensamble de HTML (Axioma de Visualización)
    const htmlBody = this._renderBlocks(blocks, data);
    
    // 2. Wrap de HTML con estilos base del sistema
    const htmlFull = this._wrapInDocumentTemplate(htmlBody, docAtom);

    // 3. Conversión nativa vía GAS (HtmlService)
    try {
      const htmlOutput = HtmlService.createHtmlOutput(htmlFull);
      const pdfBlob = htmlOutput.getAs(MimeType.PDF);
      
      const fileName = `${docAtom.handle?.label || 'Indra_Doc'}.pdf`;
      pdfBlob.setName(fileName);
      
      logInfo(`[NativeDocumentEngine] PDF generado con éxito: ${fileName} (${pdfBlob.getSize()} bytes)`);
      return pdfBlob;
    } catch (e) {
      logError("[NativeDocumentEngine] Error en generación de PDF:", e);
      throw e;
    }
  },

  /**
   * Recorre recursivamente los bloques del DocumentDesigner y genera HTML.
   * @private
   */
  _renderBlocks(blocks, data) {
    if (!Array.isArray(blocks)) return "";
    
    return blocks.map(block => {
      let childrenContent = "";
      
      // Procesar hijos primero (recursión)
      if (block.children && block.children.length > 0) {
        childrenContent = this._renderBlocks(block.children, data);
      }

      const props = block.props || {};
      const tag = this._mapBlockToTag(block.type);
      const styles = this._mapPropsToCss(props);
      
      // Manejo de Texto
      let blockText = props.text || props.content || "";
      if (typeof blockText === 'string') {
        blockText = this._injectVariables(blockText, data);
      } else if (childrenContent === "" && (!block.children || block.children.length === 0)) {
        // Bloque vacío o tipo especial (Media)
        if (block.type === 'IMAGE' || block.type === 'MEDIA') {
          const media = this._resolveMediaInfo(props, data);
          if (media) {
            return `<img src="${media.url}" alt="${media.alt}" style="${styles}; max-width: 100%; height: auto;">`;
          }
        }
      }

      // Atributos adicionales (clase de salto de página, etc)
      const extraClass = props.pageBreakAfter ? 'class="page-break"' : '';

      return `<${tag} ${extraClass} style="${styles}">${blockText}${childrenContent}</${tag}>`;
    }).join("");
  },

  /**
   * Inyecta variables del payload en el texto: {{nombre}} -> "Juan".
   * Soporta dot notation: {{cliente.nombre}}.
   * @private
   */
  _injectVariables(text, data) {
    if (!text) return "";
    return text.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, (match, key) => {
      // Resolvemos por punto (ej. cliente.nombre)
      const value = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, data);
      
      if (value === undefined || value === null) return match; // Dejar el token si no existe el dato

      // Formateo de INDRA_MEDIA como texto (alt o placeholder)
      if (typeof value === 'object' && value.type === 'INDRA_MEDIA') {
        return value.alt || "[RESOURCE:MEDIA]";
      }
      
      return String(value);
    });
  },

  /**
   * Resuelve información de media para inyección visual en el HTML.
   * @private
   */
  _resolveMediaInfo(props, data) {
    let url = props.src || props.url || "";
    let alt = props.alt || "Resource";

    // Si la imagen está linkeada a una variable: {{foto_perfil}}
    if (url.startsWith('{{') && url.endsWith('}}')) {
      const key = url.substring(2, url.length - 2).trim();
      const val = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : undefined, data);
      
      if (val && typeof val === 'object' && val.type === 'INDRA_MEDIA') {
        url = val.canonical_url;
        alt = val.alt || alt;
      } else if (typeof val === 'string') {
        url = val;
      } else {
        return null; // Variable no resuelta
      }
    }
    
    // Ignorar si no hay URL resultante
    if (!url || url === "" || url.startsWith('{{')) return null;

    return { url, alt };
  },

  /**
   * Mapeo de tipos de bloque Indra -> Tags HTML semánticos.
   * @private
   */
  _mapBlockToTag(type) {
    const map = {
      'PAGE': 'div',
      'SECTION': 'section',
      'COLUMN': 'div',
      'HEADING_1': 'h1',
      'HEADING_2': 'h2',
      'HEADING_3': 'h3',
      'PARAGRAPH': 'p',
      'TEXT': 'span',
      'IMAGE': 'div',
      'MEDIA': 'div',
      'BOX': 'div',
      'SPACER': 'div'
    };
    return map[type] || 'div';
  },

  /**
   * Convierte props de estilo Indra a CSS inline para el motor de PDF.
   * Optimizado para renderizado @media print de GAS.
   * @private
   */
  _mapPropsToCss(props) {
    const styles = [];
    
    // Tipografía
    if (props.fontSize) styles.push(`font-size: ${props.fontSize}px`);
    if (props.color) styles.push(`color: ${props.color}`);
    if (props.textAlign) styles.push(`text-align: ${props.textAlign}`);
    if (props.fontWeight) styles.push(`font-weight: ${props.fontWeight}`);
    if (props.lineHeight) styles.push(`line-height: ${props.lineHeight}`);
    if (props.fontFamily) styles.push(`font-family: ${props.fontFamily}, sans-serif`);
    
    // Box Model
    if (props.padding) styles.push(`padding: ${props.padding}px`);
    if (props.margin) styles.push(`margin: ${props.margin}px`);
    if (props.background) styles.push(`background: ${props.background}`);
    if (props.backgroundColor) styles.push(`background-color: ${props.backgroundColor}`);
    if (props.borderRadius) styles.push(`border-radius: ${props.borderRadius}px`);
    if (props.border) styles.push(`border: ${props.border}`);
    if (props.width) styles.push(`width: ${props.width}${typeof props.width === 'number' ? 'px' : ''}`);
    if (props.height) styles.push(`height: ${props.height}${typeof props.height === 'number' ? 'px' : ''}`);
    
    // Layout (Flex soporte básico en PDF renderer de GAS)
    if (props.display === 'flex') {
      styles.push('display: flex');
      if (props.flexDirection) styles.push(`flex-direction: ${props.flexDirection}`);
      if (props.justifyContent) styles.push(`justify-content: ${props.justifyContent}`);
      if (props.alignItems) styles.push(`align-items: ${props.alignItems}`);
      if (props.gap) styles.push(`gap: ${props.gap}px`);
    }

    return styles.join("; ");
  },

  /**
   * Envuelve el contenido en un esqueleto HTML con fuentes y resets globales.
   * @private
   */
  _wrapInDocumentTemplate(body, docAtom) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto+Mono&display=swap');
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            margin: 0; padding: 40px; 
            color: #333; line-height: 1.5;
            background: white;
          }
          * { box-sizing: border-box; }
          h1, h2, h3 { margin-top: 0; margin-bottom: 0.5em; color: #000; }
          p { margin-top: 0; margin-bottom: 1em; }
          img { display: block; max-width: 100%; height: auto; border: none; }
          .page-break { page-break-after: always; }
          
          /* Estilos para que el PDF se vea más profesional */
          .indra-document-footer { font-size: 8px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        ${body}
        <div class="indra-document-footer">
          Generado automáticamente por Indra OS — Identidad: ${docAtom.id} — Fecha: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  }
};
