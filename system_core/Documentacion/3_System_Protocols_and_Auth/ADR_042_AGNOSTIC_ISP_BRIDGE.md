# ADR_042: AGNOSTIC ISP BRIDGE PROTOCOL
**Estatus:** CRISTALIZADO (v1.0)
**Jurisdicción:** Capa de Comunicación Satélite-Core

## 1. CONTEXTO
Históricamente, la UI se comunicaba directamente con el Core mediante la función cruda `executeDirective`. Esto violaba los axiomas de **Encapsulación** y **Soberanía de Identidad**, obligando a cada componente a gestionar URLs y secretos de sesión.

## 2. DECISIÓN
Se implementa el **Agnostic ISP Bridge** como único punto de salida para directivas (UQO). Ningún componente fuera de la capa de servicios tiene permitido invocar a `directive_executor.js`.

## 3. ESPECIFICACIÓN TÉCNICA
El Bridge encapsula:
1. **Identidad**: URL del Core y Session Secret.
2. **Resonancia**: Integración automática con el `AgnosticVault`.
3. **Resiliencia**: Catch global de errores y tipado de respuestas.

### Protocolo de Llamada:
```javascript
// FORMA CANÓNICA
const result = await bridge.execute({
    provider: 'notion',    // OBLIGATORIO: Jurisdicción
    protocol: 'TABULAR_STREAM',
    context_id: 'db_id_123',
    data: { limit: 10 }
}, { 
    vaultKey: 'my_cache_key', // OPCIONAL: Caching reactivo
    vaultStrategy: 'DATA'     // DATA (items) o SCHEMA (metadata.schema)
});
```

## 4. AXIOMAS DE SEGURIDAD
- **Ley de la Jurisdicción**: Toda petición debe llevar un `provider`. No existe la "petición anónima".
- **Cripta de Datos (Vault)**: El Bridge es el único capaz de escribir en el `AgnosticVault` mediante la "Estrategia de Resonancia Inteligente".

## 5. CONSECUENCIAS
- **Positivas**: UI 100% agnóstica a la infraestructura. Caché gratuito de esquemas y árboles de archivos.
- **Riesgos**: Si el Bridge colapsa, la UI queda muda. (Mitigado por el Try/Catch global del Bridge).

---
*Independencia, Sinceridad, Soberanía.*
