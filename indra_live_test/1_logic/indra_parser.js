/**
 * INDRA PARSER v4.0 (Isomorfismo Axiomático)
 * -------------------------------------------
 * Misión: Proveer una única verdad de cálculo para el Frontend y el Backend.
 * Axioma: Cero dependencias de plataforma (isomórfico).
 * Restricción: No usa eval() ni new Function().
 * Soporta: Aritmética, Lógica (&&, ||, !), Comparación (==, !=, >, <), Funciones (IF, ROUND, SUM).
 */

const IndraParser = {
  
  /**
   * Evalúa una expresión básica o fórmula contra un contexto.
   */
  evaluate(expr, context = {}) {
    if (!expr || typeof expr !== 'string') return 0;
    
    try {
      const tokens = this._tokenize(expr);
      return this._evaluateTokens(tokens, context);
    } catch (e) {
      if (typeof console !== 'undefined') {
        console.error("[IndraParser v4] Eval Error:", e.message, "| Expr:", expr);
      }
      return 0;
    }
  },

  /**
   * Tokenización avanzada.
   */
  _tokenize(expr) {
    // Regex para: Funciones, Identificadores de ruta, Números, Operadores (compuestos), Paréntesis y Comas
    // Detectamos &&, ||, ==, !=, >=, <= como unidades.
    const regex = /([0-9\.]+|[a-zA-Z_][a-zA-Z0-9_\.]*|&&|\|\||==|!=|>=|<=|[+\-*/()!,><=])/g;
    return expr.match(regex) || [];
  },

  /**
   * Precedencia de operadores canónica (C-style).
   */
  _precedence: {
    '!': 6,
    '*': 5, '/': 5,
    '+': 4, '-': 4,
    '>': 3, '<': 3, '>=': 3, '<=': 3,
    '==': 2, '!=': 2,
    '&&': 1,
    '||': 0
  },

  /**
   * Evaluador con soporte para funciones y lógica extendida.
   */
  _evaluateTokens(tokens, context) {
    const values = [];
    const ops = [];

    const applyOp = () => {
      const op = ops.pop();
      if (op === '!') {
          const v = values.pop();
          values.push(!v);
          return;
      }
      const b = values.pop();
      const a = values.pop();
      
      switch (op) {
        case '+': values.push(a + b); break;
        case '-': values.push(a - b); break;
        case '*': values.push(a * b); break;
        case '/': values.push(b !== 0 ? a / b : 0); break;
        case '&&': values.push(a && b); break;
        case '||': values.push(a || b); break;
        case '==': values.push(a == b); break;
        case '!=': values.push(a != b); break;
        case '>':  values.push(a > b); break;
        case '<':  values.push(a < b); break;
        case '>=': values.push(a >= b); break;
        case '<=': values.push(a <= b); break;
      }
    };

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        
        // 1. Manejo de Funciones de Sistema (v4.0)
        if (['IF', 'ROUND', 'SUM'].includes(token.toUpperCase())) {
            const func = token.toUpperCase();
            // Avanzar hasta el '(' de la función
            i += 2; // Token -> '(' -> Primer argumento
            let depth = 1;
            let subTokens = [];
            let args = [[]];
            
            // Recolectar tokens hasta cerrar la función, separando por comas
            while (i < tokens.length && depth > 0) {
                const sub = tokens[i];
                if (sub === '(') depth++;
                if (sub === ')') depth--;
                
                if (depth === 0) break;
                
                if (sub === ',' && depth === 1) {
                    args.push([]);
                } else {
                    args[args.length - 1].push(sub);
                }
                i++;
            }
            
            // Evaluar argumentos recursivamente
            const evaluatedArgs = args.map(aTokens => this._evaluateTokens(aTokens, context));
            
            // Ejecutar lógica de función
            if (func === 'IF') {
                values.push(evaluatedArgs[0] ? evaluatedArgs[1] : (evaluatedArgs[2] || 0));
            } else if (func === 'ROUND') {
                values.push(Math.round(evaluatedArgs[0]));
            } else if (func === 'SUM') {
                // AXIOMA DE COLAPSO: Aplanar argumentos para permitir SUM(op.items.subtotal) o SUM(1,2,3)
                const flatArgs = evaluatedArgs.flat(Infinity);
                values.push(flatArgs.reduce((s, v) => s + (Number(v) || 0), 0));
            } else if (func === 'MONEY_ROUND') {
                // AXIOMA DE SINCERIDAD: Redondeo bancario a 2 decimales para evitar errores de coma flotante.
                const val = Number(evaluatedArgs[0]) || 0;
                values.push(Math.round((val + Number.EPSILON) * 100) / 100);
            }
            continue;
        }

        if (token === '(') {
            ops.push(token);
        } else if (token === ')') {
            while (ops.length && ops[ops.length - 1] !== '(') applyOp();
            ops.pop();
        } else if (this._precedence[token] !== undefined) {
            while (ops.length && this._precedence[ops[ops.length - 1]] >= this._precedence[token]) applyOp();
            ops.push(token);
        } else {
            // Resolver variable o número
            if (!isNaN(token)) {
                values.push(parseFloat(token));
            } else {
                let val = token.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, context);
                // Si el valor es boolean, lo dejamos, si es numérico lo parseamos
                if (typeof val === 'boolean') {
                    values.push(val);
                } else {
                    values.push((val === undefined || val === null) ? 0 : parseFloat(val) || 0);
                }
            }
        }
    }
    
    while (ops.length) applyOp();
    return values[0] !== undefined ? values[0] : 0;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IndraParser };
}
