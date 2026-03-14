/**
 * =============================================================================
 * RendererWorker (Web Worker)
 * RESPONSABILIDAD: Renderizado de ultra-bajo nivel usando WebGPU.
 * LEY AXIOMÁTICA: Este worker es el único que puede interactuar con el Canvas.
 * Recibe VideoFrames, los pinta y los DESTRUYE inmediatamente (Prevención de Leaks).
 * =============================================================================
 */

let canvas = null;
let context = null;
let device = null;
let pipeline = null;

// Lógica de inicialización de WebGPU
async function initWebGPU(offscreenCanvas) {
    canvas = offscreenCanvas;

    if (!navigator.gpu) {
        console.warn("[RendererWorker] WebGPU no está soportado en este navegador. Cayendo a fallback 2D.");
        // Fallback a WebGL2 o 2D podría implementarse aquí según Axioma de Independencia
        context = canvas.getContext('2d');
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.error("[RendererWorker] No se pudo obtener el adaptador WebGPU.");
        return;
    }

    device = await adapter.requestDevice();
    context = canvas.getContext('webgpu');

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
    });

    // LEY AXIOMÁTICA: Uso de WGSL (WebGPU Shading Language) para performance extrema
    const shaderCode = `
      struct VertexOutput {
        @builtin(position) position : vec4<f32>,
        @location(0) uv : vec2<f32>,
      }

      struct RenderParams {
        opacity : f32,
      }

      @group(0) @binding(1) var mySampler: sampler;
      @group(0) @binding(2) var myTexture: texture_external;
      @group(0) @binding(3) var<uniform> params : RenderParams;

      @vertex
      fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
        var pos = array<vec2<f32>, 6>(
          vec2<f32>( 1.0,  1.0),
          vec2<f32>( 1.0, -1.0),
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0,  1.0),
          vec2<f32>(-1.0, -1.0),
          vec2<f32>(-1.0,  1.0)
        );
        var uv = array<vec2<f32>, 6>(
          vec2<f32>(1.0, 0.0),
          vec2<f32>(1.0, 1.0),
          vec2<f32>(0.0, 1.0),
          vec2<f32>(1.0, 0.0),
          vec2<f32>(0.0, 1.0),
          vec2<f32>(0.0, 0.0)
        );
        var output : VertexOutput;
        output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        output.uv = uv[VertexIndex];
        return output;
      }

      @fragment
      fn frag_main(in: VertexOutput) -> @location(0) vec4<f32> {
        let color = textureSampleBaseClampToEdge(myTexture, mySampler, in.uv);
        return vec4<f32>(color.rgb, color.a * params.opacity);
      }
    `;

    const module = device.createShaderModule({ code: shaderCode });

    pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vert_main',
        },
        fragment: {
            module,
            entryPoint: 'frag_main',
            targets: [{ 
                format: presentationFormat,
                blend: {
                    color: {
                        operation: 'add',
                        srcFactor: 'src-alpha',
                        dstFactor: 'one-minus-src-alpha',
                    },
                    alpha: {
                        operation: 'add',
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                    },
                }
            }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    console.log("[RendererWorker] WebGPU Pipeline Sincero Inicializado exitosamente.");
}

/**
 * Pinta múltiples VideoFrames en el canvas (Composición Multicapa)
 */
function renderFrames(framesData) {
    if (!canvas || !framesData || framesData.length === 0) {
        if (framesData) framesData.forEach(d => d.frame && d.frame.close());
        return;
    }

    const mainFrame = framesData[0].frame;

    // Adaptar tamaño del canvas al frame dominante
    if (canvas.width !== mainFrame.displayWidth || canvas.height !== mainFrame.displayHeight) {
        canvas.width = mainFrame.displayWidth;
        canvas.height = mainFrame.displayHeight;
    }

    if (context instanceof OffscreenCanvasRenderingContext2D) {
        // Fallback 2D: Dibujar secuencialmente (Alpha por defecto en 2D)
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (const { frame } of framesData) {
            context.drawImage(frame, 0, 0, canvas.width, canvas.height);
            frame.close();
        }
    } else if (device && pipeline) {
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);

        const sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        // Iterar sobre todos los frames activos (Capas)
        for (const frameObj of framesData) {
            const frame = frameObj.frame;
            const params = frameObj.renderParams || { opacity: 1.0 };

            // Uniform Buffer para Opacidad
            const uniformArray = new Float32Array([params.opacity]);
            const uniformBuffer = device.createBuffer({
                size: 16, // Alineación de 16 bytes mínima para uniform
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 1, resource: sampler },
                    { binding: 2, resource: device.importExternalTexture({ source: frame }) },
                    { binding: 3, resource: { buffer: uniformBuffer } },
                ],
            });

            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(6, 1, 0, 0);
            
            // LEY DE MEMORIA: Cerrar frame inmediatamente tras el draw command
            frame.close();
        }

        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
    }

    frameCount++;
}

let frameCount = 0;

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT':
            console.log("[RendererWorker] Recibido OffscreenCanvas");
            await initWebGPU(data.canvas);
            break;

        case 'RENDER_FRAME':
            // Recibimos un Array de VideoFrames para composición simultánea
            if (data.frames && Array.isArray(data.frames)) {
                renderFrames(data.frames);
            } else if (data.frame) {
                // Fallback para un solo frame
                renderFrames([{ frame: data.frame }]);
            }
            break;

        case 'TERMINATE':
            console.log("[RendererWorker] Terminando Worker. Liberando memoria...");
            if (device) device.destroy();
            self.close();
            break;
    }
};
