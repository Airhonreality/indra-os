/**
 * 🛡️ AES-256-CBC Implementation (Polyfill for GAS)
 * 
 * Provides a pure JavaScript implementation of AES-256 in CBC mode
 * with PKCS7 padding, filling the gap left by missing Utilities native methods.
 * 
 * Performance: Slower than native, but functional.
 * Security: Constant-time considerations are limited in JS. secure for storage tokens.
 */

var AES = (function() {

  // S-Box substitution table
  var SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
  ];

  // Inverse S-Box
  var INV_SBOX = [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
  ];

  // Rcon (Round constants)
  var RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  function subBytes(state) {
    for (var i = 0; i < 16; i++) state[i] = SBOX[state[i]];
  }

  function invSubBytes(state) {
    for (var i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]];
  }

  function shiftRows(state) {
    var t = state[1]; state[1] = state[5]; state[5] = state[9]; state[9] = state[13]; state[13] = t;
    t = state[2]; state[2] = state[10]; state[10] = t; t = state[6]; state[6] = state[14]; state[14] = t;
    t = state[15]; state[15] = state[11]; state[11] = state[7]; state[7] = state[3]; state[3] = t;
  }

  function invShiftRows(state) {
    var t = state[13]; state[13] = state[9]; state[9] = state[5]; state[5] = state[1]; state[1] = t;
    t = state[2]; state[2] = state[10]; state[10] = t; t = state[6]; state[6] = state[14]; state[14] = t;
    t = state[3]; state[3] = state[7]; state[7] = state[11]; state[11] = state[15]; state[15] = t;
  }

  function gmul(a, b) {
    var p = 0;
    for (var i = 0; i < 8; i++) {
      if ((b & 1) != 0) p ^= a;
      var hi_bit_set = (a & 0x80) != 0;
      a = (a << 1) & 0xFF;
      if (hi_bit_set) a ^= 0x1b;
      b >>= 1;
    }
    return p;
  }

  function mixColumns(state) {
    for (var i = 0; i < 16; i += 4) {
      var s0 = state[i], s1 = state[i+1], s2 = state[i+2], s3 = state[i+3];
      state[i]   = gmul(s0, 2) ^ gmul(s1, 3) ^ s2 ^ s3;
      state[i+1] = s0 ^ gmul(s1, 2) ^ gmul(s2, 3) ^ s3;
      state[i+2] = s0 ^ s1 ^ gmul(s2, 2) ^ gmul(s3, 3);
      state[i+3] = gmul(s0, 3) ^ s1 ^ s2 ^ gmul(s3, 2);
    }
  }

  function invMixColumns(state) {
    for (var i = 0; i < 16; i += 4) {
      var s0 = state[i], s1 = state[i+1], s2 = state[i+2], s3 = state[i+3];
      state[i]   = gmul(s0, 14) ^ gmul(s1, 11) ^ gmul(s2, 13) ^ gmul(s3, 9);
      state[i+1] = gmul(s0, 9) ^ gmul(s1, 14) ^ gmul(s2, 11) ^ gmul(s3, 13);
      state[i+2] = gmul(s0, 13) ^ gmul(s1, 9) ^ gmul(s2, 14) ^ gmul(s3, 11);
      state[i+3] = gmul(s0, 11) ^ gmul(s1, 13) ^ gmul(s2, 9) ^ gmul(s3, 14);
    }
  }

  function addRoundKey(state, w, round) {
    for (var i = 0; i < 16; i++) {
      state[i] ^= w[round * 16 + i];
    }
  }

  function keyExpansion(key) {
    var w = new Array(240); // 15 rounds * 16 bytes (actually 60 words * 4)
    var nk = key.length / 4;
    var nr = nk + 6;

    for (var i = 0; i < nk; i++) {
        w[i*4] = key[i*4]; w[i*4+1] = key[i*4+1]; w[i*4+2] = key[i*4+2]; w[i*4+3] = key[i*4+3];
    }

    // This is a byte-based key expansion slightly adjusted for simplicity
    // A standard implementation works on 32-bit words
    // Let's use a simpler byte-array expansion
    
    // Convert key to words
    var words = [];
    for(var i=0; i<key.length; i+=4) {
        words.push(
            (key[i]<<24) | (key[i+1]<<16) | (key[i+2]<<8) | key[i+3]
        );
    }
    
    // Generate words
    while (words.length < (nr + 1) * 4) {
        var temp = words[words.length - 1];
        if (words.length % nk === 0) {
            // RotWord:
            temp = ((temp << 8) | (temp >>> 24));
            // SubWord:
            var s0 = SBOX[(temp >>> 24) & 0xFF];
            var s1 = SBOX[(temp >>> 16) & 0xFF];
            var s2 = SBOX[(temp >>> 8) & 0xFF];
            var s3 = SBOX[temp & 0xFF];
            temp = (s0<<24) | (s1<<16) | (s2<<8) | s3;
            // Xor Rcon
            temp ^= (RCON[(words.length / nk) - 1] << 24);
        } else if (nk > 6 && (words.length % nk === 4)) {
            // SubWord only for AES-256
            var s0 = SBOX[(temp >>> 24) & 0xFF];
            var s1 = SBOX[(temp >>> 16) & 0xFF];
            var s2 = SBOX[(temp >>> 8) & 0xFF];
            var s3 = SBOX[temp & 0xFF];
            temp = (s0<<24) | (s1<<16) | (s2<<8) | s3;
        }
        words.push(words[words.length - nk] ^ temp);
    }
    
    // Convert back to bytes for the byte-oriented functions
    var expanded = [];
    for(var i=0; i<words.length; i++) {
        expanded.push((words[i]>>>24) & 0xff);
        expanded.push((words[i]>>>16) & 0xff);
        expanded.push((words[i]>>>8) & 0xff);
        expanded.push(words[i] & 0xff);
    }
    return expanded;
  }

  function cipher(input, w) {
    var state = input.slice();
    addRoundKey(state, w, 0);
    for (var round = 1; round < 14; round++) {
      subBytes(state);
      shiftRows(state);
      mixColumns(state);
      addRoundKey(state, w, round);
    }
    subBytes(state);
    shiftRows(state);
    addRoundKey(state, w, 14);
    return state;
  }

  function invCipher(input, w) {
    var state = input.slice();
    addRoundKey(state, w, 14);
    for (var round = 13; round > 0; round--) {
      invShiftRows(state);
      invSubBytes(state);
      addRoundKey(state, w, round);
      invMixColumns(state);
    }
    invShiftRows(state);
    invSubBytes(state);
    addRoundKey(state, w, 0);
    return state;
  }

  // CBC Mode Padding (PKCS7)
  function pad(data) {
    var blockSize = 16;
    var padding = blockSize - (data.length % blockSize);
    var result = new Array(data.length + padding);
    for (var i = 0; i < data.length; i++) result[i] = data[i];
    for (var i = 0; i < padding; i++) result[data.length + i] = padding;
    return result;
  }

  function unpad(data) {
    var padding = data[data.length - 1];
    // Integrity check
    if (padding > 16 || padding < 1) return null; // Invalid padding
    for(var i=1; i<=padding; i++) {
        if (data[data.length -i] !== padding) return null; // Corrupt
    }
    return data.slice(0, data.length - padding);
  }

  return {
    encrypt: function(plainBytes, keyBytes, ivBytes) {
      if (keyBytes.length !== 32) throw new Error("AES-256 requires 32-byte key");
      if (ivBytes.length !== 16) throw new Error("AES requires 16-byte IV");
      
      var expandedKey = keyExpansion(keyBytes);
      var padded = pad(plainBytes);
      var encrypted = [];
      var previousBlock = ivBytes.slice();

      for (var i = 0; i < padded.length; i += 16) {
        var block = padded.slice(i, i + 16);
        // XOR with IV/Previous Ciphertext
        for (var j = 0; j < 16; j++) block[j] ^= previousBlock[j];
        
        var encryptedBlock = cipher(block, expandedKey);
        for(var k=0; k<16; k++) encrypted.push(encryptedBlock[k]);
        
        previousBlock = encryptedBlock;
      }
      return encrypted;
    },

    decrypt: function(cipherBytes, keyBytes, ivBytes) {
      if (keyBytes.length !== 32) throw new Error("AES-256 requires 32-byte key");
      if (ivBytes.length !== 16) throw new Error("AES requires 16-byte IV");

      var expandedKey = keyExpansion(keyBytes);
      var decrypted = [];
      var previousBlock = ivBytes.slice();
      
      for (var i = 0; i < cipherBytes.length; i += 16) {
        var block = cipherBytes.slice(i, i + 16);
        var decryptedBlock = invCipher(block, expandedKey);
        
        // XOR with Previous Ciphertext/IV
        for (var j = 0; j < 16; j++) decryptedBlock[j] ^= previousBlock[j];
        
        for(var k=0; k<16; k++) decrypted.push(decryptedBlock[k]);
        previousBlock = block;
      }
      
      var unpadded = unpad(decrypted);
      if (!unpadded) throw new Error("Decryption Checksum Failed (Padding Error)");
      return unpadded;
    }
  };
})();





