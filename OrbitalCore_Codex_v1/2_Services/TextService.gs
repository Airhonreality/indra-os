// ======================================================================
// ARTEFACTO: 2_Services/TextService.gs
// DHARMA: Proveer capacidades de renderizado, transformación y serialización de texto.
// ======================================================================

function createTextService({ errorHandler, renderEngine }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createTextService: errorHandler contract not fulfilled');
  }
  
  if (!renderEngine || typeof renderEngine.render !== 'function') {
    throw new TypeError('createTextService: renderEngine contract not fulfilled');
  }

  function transformText(payload) {
    let { text = '', operations = [] } = payload || {};
    if (typeof text !== 'string') text = String(text);
    for (const op of operations) {
      switch (op) {
        case 'trim': text = text.trim(); break;
        case 'uppercase': text = text.toUpperCase(); break;
        case 'lowercase': text = text.toLowerCase(); break;
        case 'capitalize':
          text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          break;
      }
    }
    return { text: text };
  }

  function buildText(inputMapping, dependencies) {
    const { template = '', data = {} } = inputMapping || {};
    const { renderEngine: injectedRenderEngine, flowContext } = dependencies || {};
    const engine = injectedRenderEngine || renderEngine;
    
    if (!engine || typeof engine.render !== 'function') {
      throw errorHandler.createError('INVALID_INPUT', 'buildText: renderEngine no disponible');
    }
    if (typeof template !== 'string') {
      throw errorHandler.createError('INVALID_INPUT', 'buildText requiere una "template" (string).');
    }
    if (!flowContext || typeof flowContext !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 'buildText requiere un flowContext (object).');
    }
    
    const text = engine.render(template, data, flowContext);
    return { text };
  }

  function stringify(payload) {
    if (!payload || payload.data === undefined) {
      throw errorHandler.createError('INVALID_INPUT', 'stringify requiere una propiedad "data" en el payload.');
    }
    try {
      const jsonString = JSON.stringify(payload.data, null, 2);
      return { stringified: jsonString };
    } catch (e) {
      throw errorHandler.createError('DATA_PROCESSING_ERROR', `Fallo al convertir datos a JSON: ${e.message}`, { originalError: e });
    }
  }

  function createTextBlocks(payload) {
    if (!payload || typeof payload.content !== 'string' || payload.content.length === 0) {
      return { blocks: [] }; 
    }
    const { content, language = 'text' } = payload;
    const NOTION_BLOCK_LIMIT = 2000;
    const chunks = [];
    for (let i = 0; i < content.length; i += NOTION_BLOCK_LIMIT) {
      chunks.push(content.substring(i, i + NOTION_BLOCK_LIMIT));
    }
    const blocks = chunks.map(chunk => ({
      type: 'code',
      code: { rich_text: [{ type: 'text', text: { content: chunk } }], language: language }
    }));
    return { blocks: blocks };
  }

  function join(payload) {
    const { array, separator = '\n' } = payload || {};
    if (!Array.isArray(array)) {
      throw errorHandler.createError('INVALID_INPUT', 'join requiere una propiedad "array" que sea un array.');
    }
    try {
      return { text: array.join(separator) };
    } catch (e) {
      throw errorHandler.createError('DATA_PROCESSING_ERROR', `Fallo al ejecutar .join() en el array: ${e.message}`, { originalError: e });
    }
  }

  const schemas = {
    transformText: {
      description: "Applies institutional linguistic transformations (trim, case folding, capitalization) to a text stream.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          text: { type: "string", io_behavior: "STREAM", description: "Primary text stream to be transformed." },
          operations: { type: "array", io_behavior: "SCHEMA", description: "Ordered collection of technical transformations." }
        }, 
        outputs: {
          text: { type: "string", io_behavior: "STREAM", description: "Transformed text stream result." }
        } 
      }
    },
    buildText: {
      description: "Orchestrates technical template rendering by merging a schematic pattern with a data stream context.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          template: { type: "string", io_behavior: "SCHEMA", description: "Schematic text template pattern." },
          data: { type: "object", io_behavior: "STREAM", description: "Data stream context for merging." }
        }, 
        outputs: {
          text: { type: "string", io_behavior: "STREAM", description: "Rendered technical text output." }
        } 
      }
    },
    stringify: {
      description: "Executes institutional serialization of any technical data into a readable JSON stream.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: { 
          data: { type: "any", io_behavior: "STREAM", description: "Technical data source for serialization." } 
        },
        outputs: { 
          stringified: { type: "string", io_behavior: "STREAM", description: "Serialized JSON data stream." } 
        }
      }
    }
  };

  return Object.freeze({
    label: "Linguistic Orchestrator",
    description: "Industrial engine for text transformation, technical template rendering, and institutional serialization.",
    semantic_intent: "LOGIC",
    archetype: "SERVICE",
    schemas: schemas,
    transformText,
    buildText,
    stringify,
    createTextBlocks,
    join
  });
}

