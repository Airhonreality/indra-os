(function(){"use strict";let t=null,n=null,r=null,i=null;async function p(a){if(t=a,!navigator.gpu){console.warn("[RendererWorker] WebGPU no está soportado en este navegador. Cayendo a fallback 2D."),n=t.getContext("2d");return}const o=await navigator.gpu.requestAdapter();if(!o){console.error("[RendererWorker] No se pudo obtener el adaptador WebGPU.");return}r=await o.requestDevice(),n=t.getContext("webgpu");const e=navigator.gpu.getPreferredCanvasFormat();n.configure({device:r,format:e,alphaMode:"premultiplied"});const s=r.createShaderModule({code:`
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
    `});i=r.createRenderPipeline({layout:"auto",vertex:{module:s,entryPoint:"vert_main"},fragment:{module:s,entryPoint:"frag_main",targets:[{format:e,blend:{color:{operation:"add",srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{operation:"add",srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"}}),console.log("[RendererWorker] WebGPU Pipeline Sincero Inicializado exitosamente.")}function u(a){if(!t||!a||a.length===0){a&&a.forEach(e=>e.frame&&e.frame.close());return}const o=a[0].frame;if((t.width!==o.displayWidth||t.height!==o.displayHeight)&&(t.width=o.displayWidth,t.height=o.displayHeight),n instanceof OffscreenCanvasRenderingContext2D){n.clearRect(0,0,t.width,t.height);for(const{frame:e}of a)n.drawImage(e,0,0,t.width,t.height),e.close()}else if(r&&i){const e=r.createCommandEncoder(),s={colorAttachments:[{view:n.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]},c=e.beginRenderPass(s);c.setPipeline(i);const g=r.createSampler({magFilter:"linear",minFilter:"linear"});for(const l of a){const d=l.frame,v=l.renderParams||{opacity:1},h=new Float32Array([v.opacity]),f=r.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});r.queue.writeBuffer(f,0,h);const x=r.createBindGroup({layout:i.getBindGroupLayout(0),entries:[{binding:1,resource:g},{binding:2,resource:r.importExternalTexture({source:d})},{binding:3,resource:{buffer:f}}]});c.setPipeline(i),c.setBindGroup(0,x),c.draw(6,1,0,0),d.close()}c.end(),r.queue.submit([e.finish()])}}self.onmessage=async a=>{const{type:o,data:e}=a.data;switch(o){case"INIT":console.log("[RendererWorker] Recibido OffscreenCanvas"),await p(e.canvas);break;case"RENDER_FRAME":e.frames&&Array.isArray(e.frames)?u(e.frames):e.frame&&u([{frame:e.frame}]);break;case"TERMINATE":console.log("[RendererWorker] Terminando Worker. Liberando memoria..."),r&&r.destroy(),self.close();break}}})();
