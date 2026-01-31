# tokens.css - Atomic Contract

> **Ubicación:** `style/tokens.css`  
> **Versión:** 10.0.0  
> **Última Actualización:** 2026-01-08

---

## Dharma (Propósito)
Variables CSS centralizadas para diseño consistente. Define colores, espaciado, tipografía y otros tokens de diseño.

---

## Axiomas (Invariantes)

1. **Single Source of Truth**: Todos los estilos consumen estos tokens.
2. **Nomenclatura Semántica**: Nombres descriptivos (--text-primary, no --color-1).
3. **Dark Theme First**: Diseñado para tema oscuro por defecto.
4. **Legacy Bridges**: Mapea variables antiguas a nuevos tokens.

---

## Tokens Definidos

### Colores
```css
--bg-primary: #0a0a0c;
--bg-secondary: rgba(255, 255, 255, 0.04);
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--text-tertiary: #606060;
--accent-primary: #00ff88;
--accent-info: #00aaff;
--accent-warning: #ffaa00;
--accent-error: #ff4444;
```

### Espaciado
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
```

### Tipografía
```css
--font-sans: 'Inter', sans-serif;
--font-mono: 'Fira Code', monospace;
--font-size-xs: 0.55rem;
--font-size-sm: 0.7rem;
--font-size-md: 0.8rem;
--font-size-lg: 1rem;
```

---

## Protocolo de Uso

### En CSS
```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--spacing-md);
  font-family: var(--font-sans);
}
```

### Legacy Bridges
```css
/* Mapeo de variables antiguas */
--bg-primary: var(--bg-primary);  /* Mantiene compatibilidad */
```

---

## Relacionado
- [system_layout.contract.md](system_layout.contract.md)
- [liquid_anatomy.contract.md](liquid_anatomy.contract.md)
