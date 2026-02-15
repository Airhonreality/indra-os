/**
 * 🎨 ISK: SPATIAL RENDERER (L3)
 * Motor WebGL2 de alta fidelidad para renderizar 10,000 elementos reactivos.
 * Utiliza Instanced Rendering y Data Textures.
 */

export class SpatialRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', { antialias: true, alpha: true });

        if (!this.gl) {
            throw new Error("ISK: WebGL2 not supported by the environment.");
        }

        this.programs = new Map();
        this.textures = new Map();
        this.vaos = new Map();
        this.textureSize = 128;

        this._setupBaseEngine();
    }

    _setupBaseEngine() {
        const gl = this.gl;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
    }

    /**
     * Inicializa un programa para un arquetipo geométrico.
     * @param {string} archetype - Ej: 'arc', 'circle'
     * @param {string} vsSource - Vertex Shader
     * @param {string} fsSource - Fragment Shader
     */
    initArchetype(archetype, vsSource, fsSource) {
        const program = this._createProgram(vsSource, fsSource);
        this.programs.set(archetype, program);

        // Setup Instancing Data
        this._setupInstancingBuffers(archetype);
    }

    /**
     * Frame principal de renderizado con Interpolación Intrínseca.
     * @param {Float32Array} dataBuffer - El buffer actual de la Data Texture
     * @param {number} activeCount - Número de elementos a dibujar
     * @param {number} interpolation - Factor de interpolación (0.0 a 1.0)
     */
    render(dataBuffer, activeCount, interpolation) {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Actualizamos las texturas (Last y Current)
        this._updateDataTextures(dataBuffer);

        for (const [archetype, program] of this.programs) {
            gl.useProgram(program);

            // Resulución para el clipping
            gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.canvas.width, this.canvas.height);
            gl.uniform1f(gl.getUniformLocation(program, 'u_interpolation'), interpolation);

            // Bind de texturas
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.get('last'));
            gl.uniform1i(gl.getUniformLocation(program, 'u_dataLast'), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.get('current'));
            gl.uniform1i(gl.getUniformLocation(program, 'u_dataCurrent'), 1);

            const vao = this.vaos.get(archetype);
            gl.bindVertexArray(vao);
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, activeCount);
        }
    }

    _updateDataTextures(newBuffer) {
        const gl = this.gl;

        // Si no existen, las creamos
        if (!this.textures.has('current')) {
            this.textures.set('last', this._createDataTexture(newBuffer));
            this.textures.set('current', this._createDataTexture(newBuffer));
            this.lastBuffer = new Float32Array(newBuffer);
            return;
        }

        // Rotación de Buffers: El actual pasa a ser el anterior
        gl.bindTexture(gl.TEXTURE_2D, this.textures.get('last'));
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.textureSize, this.textureSize, gl.RGBA, gl.FLOAT, this.lastBuffer);

        gl.bindTexture(gl.TEXTURE_2D, this.textures.get('current'));
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.textureSize, this.textureSize, gl.RGBA, gl.FLOAT, newBuffer);

        this.lastBuffer.set(newBuffer);
    }

    resizeDataTextures(newSize) {
        this.textureSize = newSize;
        if (this.textures.has('current')) {
            this.gl.deleteTexture(this.textures.get('last'));
            this.gl.deleteTexture(this.textures.get('current'));
            this.textures.delete('last');
            this.textures.delete('current');
        }
    }

    _createDataTexture(buffer) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize, this.textureSize, 0, gl.RGBA, gl.FLOAT, buffer);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return tex;
    }

    _createProgram(vs, fs) {
        const gl = this.gl;
        const vShader = this._compileShader(gl.VERTEX_SHADER, vs);
        const fShader = this._compileShader(gl.FRAGMENT_SHADER, fs);
        const prog = gl.createProgram();
        gl.attachShader(prog, vShader);
        gl.attachShader(prog, fShader);
        gl.linkProgram(prog);
        return prog;
    }

    _compileShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(s));
        }
        return s;
    }

    _setupInstancingBuffers(archetype) {
        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // Quad base para todos los elementos (Triangle Strip)
        const vertices = new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const posLoc = 0; // Por convención
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        this.vaos.set(archetype, vao);
    }
}



