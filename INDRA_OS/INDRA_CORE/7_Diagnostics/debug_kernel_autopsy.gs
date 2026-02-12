function debug_AutopsyProjectionKernel() {
  console.log("🩺 [AUTOPSY] Iniciando examen forense del ProjectionKernel...");
  
  try {
    // 1. Simular el entorno de ensamblaje (sin red)
    if (typeof SystemAssembler === 'undefined') {
       console.error("❌ FATAL: SystemAssembler no está expuesto globalmente.");
       return;
    }

    const stack = SystemAssembler.assembleServerStack();
    const kernel = stack.projectionKernel;
    
    // 2. Verificar existencia
    if (!kernel) {
      console.error("☠️ EL PACIENTE NO EXISTE: stack.projectionKernel es null/undefined.");
      return;
    }
    
    console.log("🧬 Signos Vitales del Objeto:");
    console.log("   - Tipo: " + typeof kernel);
    console.log("   - Keys visibles: " + Object.keys(kernel).join(', '));
    
    // 3. Verificar métodos específicos
    if (typeof kernel.isMethodExposed === 'function') {
      console.log("✅ isMethodExposed: PRESENTE y FUNCIONAL.");
    } else {
      console.error("❌ isMethodExposed: AUSENTE o NO ES FUNCIÓN. (Tipo: " + typeof kernel.isMethodExposed + ")");
    }

    if (typeof kernel.resolveComponent === 'function') {
      console.log("✅ resolveComponent: PRESENTE y FUNCIONAL.");
    } else {
      console.log("⚠️ resolveComponent: AUSENTE (Esto confirmaría versión antigua).");
    }

    // 4. Verificar exposición de nuevos nodos de negocio (Purificación)
    try {
      console.log("\n🛰️ Verificando exposición de Realidades (Purificación Base):");
      
      const methodsToCheck = [
        { node: 'cosmos', method: 'mountCosmos' },
        { node: 'cosmos', method: 'listAvailableCosmos' },
        { node: 'public', method: 'validateSession' }
      ];

      methodsToCheck.forEach(m => {
        const isExposed = kernel.isMethodExposed(stack, m.node, m.method);
        const emoji = isExposed ? "✅" : "❌";
        console.log(`   ${emoji} ${m.node}:${m.method} -> ${isExposed ? 'EXPUESTO' : 'OCULTO'}`);
      });

    } catch (err) {
      console.error("💥 Error en verificación de exposición: " + err.message);
    }

  } catch (e) {
    console.error("🔥 Error catastrófico durante la autopsia: " + e.message);
    console.error(e.stack);
  }
}
