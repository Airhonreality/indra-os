/**
 * 🏭 ISK: INSTANCED SHADER FACTORY (v3.2)
 * Generador de Shaders optimizados para renderizado masivo.
 * Implementa texelFetch para acceso directo a la Data Texture (Zero-Loss).
 */
export const InstancedShaderFactory = {

  /**
   * Vertex Shader Base para todos los arquetipos.
   * Realiza el fetch de la textura basado en el gl_InstanceID.
   */
  getBaseVertexShader: () => `#version 300 es
        layout(location = 0) in vec2 a_position; // Geometría base (quad/unit circle)
        
        uniform sampler2D u_dataLast;
        uniform sampler2D u_dataCurrent;
        uniform float u_interpolation; // t entre frames
        uniform vec2 u_resolution;
        uniform float u_textureSize;

        out vec4 v_color;
        out float v_visibility;

        vec4 fetchData(int id, sampler2D tex) {
            int x = id % int(u_textureSize);
            int y = id / int(u_textureSize);
            return texelFetch(tex, ivec2(x, y), 0);
        }

        void main() {
            int id = gl_InstanceID;
            
            // Fetch de estados
            vec4 dataLast = fetchData(id, u_dataLast);
            vec4 dataCurrent = fetchData(id, u_dataCurrent);
            
            // Interpolación L2 (Anti-Stuttering)
            vec2 pos = mix(dataLast.xy, dataCurrent.xy, u_interpolation);
            float radius = mix(dataLast.z, dataCurrent.z, u_interpolation);
            v_visibility = mix(dataLast.w, dataCurrent.w, u_interpolation);

            // Descarte temprano si no es visible
            if (v_visibility < 0.01) {
                gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // Fuera del clip space
                return;
            }

            // Transformación al Clip Space
            vec2 screenPos = (pos / u_resolution) * 2.0 - 1.0;
            vec2 scaledOffset = (a_position * radius * 2.0) / u_resolution;
            
            gl_Position = vec4(screenPos + scaledOffset, 0.0, 1.0);
            v_color = vec4(1.0); // Se sobreescribe en fragment shader si se desea
        }
    `,

  getCircleFragmentShader: () => `#version 300 es
        precision highp float;
        in vec4 v_color;
        in float v_visibility;
        out vec4 fragColor;

        void main() {
            // Calculamos distancia al centro del quad para dibujar el círculo
            vec2 uv = gl_PointCoord * 2.0 - 1.0; 
            // Nota: En instancing manual usamos a_position como UV interna
            
            // Implementación simplificada para el arquetipo Circle
            fragColor = vec4(0.0, 0.8, 1.0, v_visibility);
        }
    `,

  getArcFragmentShader: () => `#version 300 es
        precision highp float;
        out vec4 fragColor;
        // ... Lógica de arco v3.2
        void main() {
            fragColor = vec4(1.0, 0.5, 0.0, 1.0);
        }
    `
};

export default InstancedShaderFactory;
