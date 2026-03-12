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
        console.error("[RendererWorker] WebGPU no está soportado en este navegador.");
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

      @group(0) @binding(1) var mySampler: sampler;
      @group(0) @binding(2) var myTexture: texture_external;

      @fragment
      fn frag_main(in: VertexOutput) -> @location(0) vec4<f32> {
        return textureSampleBaseClampToEdge(myTexture, mySampler, in.uv);
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
            targets: [{ format: presentationFormat }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    console.log("[RendererWorker] WebGPU Pipeline Sincero Inicializado exitosamente.");
}

/**
 * Pinta un VideoFrame en el canvas y libera la memoria.
 */
function renderFrame(videoFrame) {
    if (!canvas) {
        videoFrame.close();
        return;
    }

    // Adaptar tamaño del canvas si el video cambia
    if (canvas.width !== videoFrame.displayWidth || canvas.height !== videoFrame.displayHeight) {
        canvas.width = videoFrame.displayWidth;
        canvas.height = videoFrame.displayHeight;
    }

    if (context instanceof OffscreenCanvasRenderingContext2D) {
        // Fallback rápido o pipeline 2D
        context.drawImage(videoFrame, 0, 0, canvas.width, canvas.height);
    } else if (device && pipeline) {
        // Pipeline WebGPU de ultra-bajo nivel
        const sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        const uniformBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 1, resource: sampler },
                { binding: 2, resource: device.importExternalTexture({ source: videoFrame }) },
            ],
        });

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
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.draw(6, 1, 0, 0);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);
    }

    // LEY DE SINCERIDAD Y MANEJO DE MEMORIA (Descrito en la investigación)
    // El recolector de basura de JS no es suficientemente rápido para video.
    videoFrame.close();
}

self.onmessage = async (e) => {
    const { type, data } = e.data;

    switch (type) {
        case 'INIT':
            console.log("[RendererWorker] Recibido OffscreenCanvas");
            await initWebGPU(data.canvas);
            break;

        case 'RENDER_FRAME':
            // Recibimos el VideoFrame transferido con Zero-Copy
            if (data.frame) {
                renderFrame(data.frame);
            }
            break;

        case 'TERMINATE':
            console.log("[RendererWorker] Terminando Worker. Liberando memoria...");
            if (device) device.destroy();
            self.close();
            break;
    }
};
