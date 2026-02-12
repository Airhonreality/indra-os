// ======================================================================
// ARTEFACTO: 2_Services/CollectionService.gs
// DHARMA: Proveer capacidades de manipulación de estructuras de datos y colecciones.
// ======================================================================

function createCollectionService({ errorHandler, renderEngine }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('createCollectionService: errorHandler contract not fulfilled');
  }

  function _get(obj, path, defaultValue = null) {
      if (!path) return obj;
      const pathArray = Array.isArray(path) ? path : path.split('.').filter(i => i.length);
      if (!pathArray.length) return obj === undefined ? defaultValue : obj;
      const result = pathArray.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
      return result === undefined ? defaultValue : result;
  }

  function get(payload) {
    const { object, path, defaultValue = null } = payload || {};
    return { value: _get(object, path, defaultValue) };
  }

  function set(payload) {
    const { object, path, value } = payload || {};
    if (typeof object !== 'object' || object === null || typeof path !== 'string') {
        throw errorHandler.createError('INVALID_INPUT', 'set requiere un "object", un "path" y un "value".');
    }
    const newObject = JSON.parse(JSON.stringify(object));
    const keys = path.split('.');
    keys.reduce((acc, key, index) => {
        if (index === keys.length - 1) {
            acc[key] = value;
        } else {
            if (acc[key] === undefined || typeof acc[key] !== 'object' || acc[key] === null) {
              acc[key] = {};
            }
        }
        return acc[key];
    }, newObject);
    return { result: newObject };
  }

  function pluck(payload) {
      const { collection, paths } = payload || {};
      if (!Array.isArray(collection) || !paths || typeof paths !== 'object') {
          throw errorHandler.createError('INVALID_INPUT', 'pluck requiere una "collection" (array) y "paths" (objeto).');
      }
      return {
          result: collection.map(item => {
              const newItem = {};
              for (const key in paths) {
                  newItem[key] = _get(item, paths[key]);
              }
              return newItem;
          })
      };
  }

  function mapObject(inputMapping, dependencies) {
    const { object, template } = inputMapping || {};
    const { renderEngine: injectedRenderEngine, flowContext } = dependencies || {};
    const engine = injectedRenderEngine || renderEngine;
    
    if (!engine || typeof engine.render !== 'function') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObject: renderEngine no disponible');
    }
    if (typeof object !== 'object' || object === null) {
      throw errorHandler.createError('INVALID_INPUT', 'mapObject requiere un "object" (object).');
    }
    if (typeof template !== 'string') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObject requiere una "template" (string).');
    }
    if (!flowContext || typeof flowContext !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObject requiere un flowContext (object).');
    }

    const result = Object.keys(object).map(key => {
      const value = object[key];
      const localContext = { key, value };
      return engine.render(template, localContext, flowContext);
    });
    
    return { result };
  }

  function mapObjects(inputMapping, dependencies) {
    const { collection, template } = inputMapping || {};
    const { renderEngine: injectedRenderEngine, flowContext } = dependencies || {};
    const engine = injectedRenderEngine || renderEngine;
    
    if (!engine || typeof engine.render !== 'function') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObjects: renderEngine no disponible');
    }
    if (!Array.isArray(collection)) {
      throw errorHandler.createError('INVALID_INPUT', 'mapObjects requiere una "collection" (array).');
    }
    if (typeof template !== 'string') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObjects requiere una "template" (string).');
    }
    if (!flowContext || typeof flowContext !== 'object') {
      throw errorHandler.createError('INVALID_INPUT', 'mapObjects requiere un flowContext (object).');
    }

    const results = collection.map((item, index) => {
      const localContext = { item, index };
      return engine.render(template, localContext, flowContext);
    });
    
    return { results };
  }

  function lookupValue(inputMapping, dependencies) {
    const { collection, searchKey, searchValue, returnKey } = inputMapping || {};
    const { renderEngine: injectedRenderEngine, flowContext } = dependencies || {};
    const engine = injectedRenderEngine || renderEngine;
    
    if (!Array.isArray(collection)) {
      throw errorHandler.createError('INVALID_INPUT', 'lookupValue requiere una "collection" (array).');
    }
    if (!searchKey || !returnKey) {
      throw errorHandler.createError('INVALID_INPUT', 'lookupValue requiere "searchKey" y "returnKey".');
    }
    
    let resolvedSearchValue = searchValue;
    if (typeof searchValue === 'string' && searchValue.includes('{{')) {
      resolvedSearchValue = engine.render(searchValue, flowContext);
    }
    
    const foundItem = collection.find(item => {
      const itemValue = _get(item, searchKey);
      return itemValue === resolvedSearchValue;
    });
    if (!foundItem) return { value: null };
    
    const returnValue = _get(foundItem, returnKey);
    return { value: returnValue };
  }

  function mergeObjects(payload) {
      const { objects } = payload || {};
      if (!Array.isArray(objects)) {
          throw errorHandler.createError('INVALID_INPUT', 'mergeObjects requiere un "objects" (array).');
      }
      return { merged: objects.reduce((acc, obj) => ({ ...acc, ...obj }), {}) };
  }

  function findInCollection(payload) {
      const { collection, conditions } = payload || {};
      if (!Array.isArray(collection) || !conditions || typeof conditions !== 'object') {
          throw errorHandler.createError('INVALID_INPUT', 'findInCollection requiere una "collection" (array) y "conditions" (objeto).');
      }
      const foundItem = collection.find(item => 
          Object.keys(conditions).every(path => 
              _get(item, path) === conditions[path]
          )
      );
      return { item: foundItem || null };
  }

  const schemas = {
    get: {
      description: "Extracts a specific data leaf from a technical object using industrial path traversal.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          object: { type: "object", io_behavior: "STREAM", description: "Target data structure." },
          path: { type: "string", io_behavior: "SCHEMA", description: "Technical traversal path (e.g. 'user.profile.id')." },
          defaultValue: { type: "any", io_behavior: "STREAM", description: "Fallback value for non-existent paths." }
        }, 
        outputs: {
          value: { type: "any", io_behavior: "STREAM", description: "Extracted data leaf." }
        } 
      }
    },
    set: {
      description: "Mutates a data structure by injecting a technical payload into a specific traversal path.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          object: { type: "object", io_behavior: "STREAM", description: "Target data structure." },
          path: { type: "string", io_behavior: "SCHEMA", description: "Target traversal path." },
          value: { type: "any", io_behavior: "STREAM", description: "Payload to be injected." }
        }, 
        outputs: {
          result: { type: "object", io_behavior: "STREAM", description: "Mutated data structure." }
        } 
      }
    },
    pluck: {
      description: "Extracts an industrial subset of data from each record within a collective stream.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          collection: { type: "array", io_behavior: "STREAM", description: "Primary collective data stream." },
          paths: { type: "object", io_behavior: "SCHEMA", description: "Mapping of technical paths to be extracted." }
        }, 
        outputs: {
          result: { type: "array", io_behavior: "STREAM", description: "Extracted collective subset." }
        } 
      }
    },
    lookupValue: {
      description: "Executes technical scanning within a collective stream to extract a specific relation value.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          collection: { type: "array", io_behavior: "STREAM", description: "Collection to be scanned." },
          searchKey: { type: "string", io_behavior: "SCHEMA", description: "Discriminator key path." },
          searchValue: { type: "any", io_behavior: "STREAM", description: "Target discriminator value." },
          returnKey: { type: "string", io_behavior: "SCHEMA", description: "Key path of the value to be returned." }
        }, 
        outputs: {
          value: { type: "any", io_behavior: "STREAM", description: "Resulting relation value." }
        } 
      }
    }
  };

  function verifyConnection() {
    return { status: "ACTIVE", logic: "DETERMINISTIC" };
  }

  return {
    description: "Industrial engine for collective data manipulation, path-based extraction, and structural transformation.",
    semantic_intent: "LOGIC",
    schemas: schemas,
    // Capability Discovery
    verifyConnection,
    // Original methods
    get,
    set,
    pluck,
    mapObject,
    mapObjects,
    lookupValue,
    mergeObjects,
    findInCollection
  };
}

