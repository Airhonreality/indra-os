/**
 * 🔒 CIPHER ADAPTER (4_Infra/CipherAdapter.gs)
 * Version: 1.0.0
 * Dharma: Proveer capacidades de encriptación simétrica (AES) al Core.
 *         Basado en una implementación pura de JS para entornos GAS.
 */

function createCipherAdapter({ errorHandler }) {
  
  /**
   * Encripta un string usando AES-256-CBC con la clave proporcionada.
   * @param {object} payload - { text, key }
   * @returns {string} Base64 encoded: IV (16) + Ciphertext
   */
  function encrypt(input) {
    const payload = (typeof input === 'object' && input !== null) ? input : { text: arguments[0], key: arguments[1] };
    const { text, key } = payload;
    const plainText = text || payload.plainText; 

    if (!key) throw errorHandler.createError('CRYPTO_ERROR', 'Encryption key is required');
    try {
      const dataBytes = Utilities.newBlob(plainText || '').getBytes();
      const keyBytes = _deriveKey(key);
      const ivBytes = _getRandomBytes(16); // Returns signed bytes
      
      // Convert to Unsigned for AES Engine (0-255)
      const uData = dataBytes.map(_toUnsigned);
      const uKey = keyBytes.map(_toUnsigned);
      const uIv = ivBytes.map(_toUnsigned);

      // Use Polyfill AES
      const encryptedUBytes = AES.encrypt(uData, uKey, uIv);
      
      // Convert back to Signed for GAS Utilities (-128 to 127)
      const encryptedSBytes = encryptedUBytes.map(_toSigned);
      
      // Robust Concatenation (IV + Ciphertext)
      const finalBytes = [];
      for (let i = 0; i < ivBytes.length; i++) finalBytes.push(ivBytes[i]); // IV is already signed
      for (let i = 0; i < encryptedSBytes.length; i++) finalBytes.push(encryptedSBytes[i]);
      
      return Utilities.base64Encode(finalBytes);
    } catch (e) {
      throw errorHandler.createError('ENCRYPTION_FAILED', `AES Encryption failure: ${e.message}`);
    }
  }

  function decrypt(input) {
    const payload = (typeof input === 'object' && input !== null) ? input : { cipher: arguments[0], key: arguments[1] };
    const { cipher, key } = payload;
    const cipherText = cipher || payload.cipherText; 

    if (!key) throw errorHandler.createError('CRYPTO_ERROR', 'Decryption key is required');
    try {
      const combinedBytes = Utilities.base64Decode(cipherText); // Returns signed bytes
      const keyBytes = _deriveKey(key);
      
      if (combinedBytes.length < 17) throw new Error("Invalid cipher data length");

      // Extract IV and Data (Signed)
      const ivBytes = [];
      for (let i = 0; i < 16; i++) ivBytes.push(combinedBytes[i]);
      
      const dataToDecrypt = [];
      for (let i = 16; i < combinedBytes.length; i++) dataToDecrypt.push(combinedBytes[i]);
      
      // Convert to Unsigned for AES Engine
      const uKey = keyBytes.map(_toUnsigned);
      const uIv = ivBytes.map(_toUnsigned);
      const uData = dataToDecrypt.map(_toUnsigned);

      // Use Polyfill AES
      const decryptedUBytes = AES.decrypt(uData, uKey, uIv);
      
      // Convert back to Signed for GAS Blob
      const decryptedSBytes = decryptedUBytes.map(_toSigned);

      return Utilities.newBlob(decryptedSBytes).getDataAsString();
    } catch (e) {
      throw errorHandler.createError('DECRYPTION_FAILED', `AES Decryption failure (Invalid key or corrupted data): ${e.message}`);
    }
  }

  function _deriveKey(key) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key);
  }

  function _getRandomBytes(size) {
    const bytes = [];
    for (let i = 0; i < size; i++) {
      bytes.push(Math.floor(Math.random() * 256) - 128);
    }
    return bytes;
  }

  function _toUnsigned(byte) {
    return byte < 0 ? byte + 256 : byte;
  }

  function _toSigned(byte) {
    return byte > 127 ? byte - 256 : byte;
  }

  const schemas = {
    encrypt: {
      description: "Executes AES-256-CBC encryption on target text using a derived cryptographic key.",
      semantic_intent: "TRANSFORM",
      io_interface: {
        inputs: { 
          text: { type: "string", role: "STREAM", description: "Plaintext payload to be encrypted." }, 
          key: { type: "string", role: "GATE", description: "Secret key for derivation and encryption." } 
        },
        outputs: { 
          cipher: { type: "string", role: "STREAM", description: "Base64 encoded IV + Ciphertext stream." } 
        }
      }
    },
    decrypt: {
      description: "Reverses AES-256-CBC encryption to recover original plaintext from a secure stream.",
      semantic_intent: "TRANSFORM",
      io_interface: {
        inputs: { 
          cipher: { type: "string", role: "STREAM", description: "Base64 encoded encrypted input." }, 
          key: { type: "string", role: "GATE", description: "Secret key for decryption." } 
        },
        outputs: { 
          text: { type: "string", role: "STREAM", description: "Recovered plaintext payload." } 
        }
      }
    }
  };

  function verifyConnection() {
    try {
      // Self-test
      const test = "INDRA";
      const key = "TEST_KEY";
      const enc = encrypt({ text: test, key });
      const dec = decrypt({ cipher: enc, key });
      return { status: "ACTIVE", integrity: dec === test };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  return {
    description: "Industrial security bridge for symmetric encryption and identity sovereignty.",
    semantic_intent: "GUARD",
    schemas,
    // Protocol mapping (SYS_V1 compatibility)
    verifyConnection,
    // Original methods
    encrypt,
    decrypt
  };
}





