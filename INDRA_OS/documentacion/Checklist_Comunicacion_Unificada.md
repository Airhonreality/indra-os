# 📝 Checklist de Implementación: Sistema de Comunicación Unificada Soberana

## 1. Soberanía de Etiquetas (Human Labels)
- [ ] **Refactorizar `NodeEngine.jsx`**:
    - [ ] Buscar mapeo de `CAPABILITIES`.
    - [ ] Reemplazar visualización de `key` (técnico) por `cap.human_label || cap.LABEL || key` (humano).
    - [ ] Verificar que no existan mapas de traducción hardcodeados en el componente.

## 2. Registro de Arquetipos (Archetype_Registry.js)
- [ ] **Registrar Nuevos Arquetipos**:
    - [ ] `MAIL`: Apuntar a `CommunicationEngine`.
    - [ ] `MESSAGING`: Apuntar a `CommunicationEngine`.
    - [ ] `SOCIAL`: Apuntar a `CommunicationEngine` (opcional, como alias).
- [ ] **Validar Resolución**: Asegurar que `resolveEngine` devuelva el motor correcto.

## 3. Motor de Comunicación Unificado (CommunicationEngine.jsx)
- [ ] **Crear `src/core/kernel/projections/engines/CommunicationEngine.jsx`**:
    - [ ] **Arquitectura**: Componente contenedor que decide qué sub-vistas renderizar según `data.ARCHETYPE` o modo polimórfico.
    - [ ] **Modo `MAIL`**:
        - [ ] Lista de hilos (izquierda).
        - [ ] Visor de contenido (derecha/centro).
    - [ ] **Modo `MESSAGING`**:
        - [ ] Interfaz tipo Chat (burbujas, input abajo).
    - [ ] **Modo `UNIFIED` (Polimórfico)**:
        - [ ] Yuxtaposición de ambos (Tabs o Split View) si el artefacto tiene capacidades mixtas.
    - [ ] **Integración**: Usar `execute` del store para acciones reales (enviar, responder).

## 4. Refactor de Vistas Dinámicas (ComponentProjector.jsx)
- [ ] **Actualizar Navegador de Pestañas**:
    - [ ] Eliminar lógica que asume nombres de vista fijos si existe.
    - [ ] Asegurar que las pestañas rendericen `normalizedCanon.ARCHETYPE` dinámicamente.

## 5. Validación
- [ ] Verificar en **Dev Lab** con un mock de artefacto que tenga `ARCHETYPE: "MAIL"` y otro `"MESSAGING"`.
- [ ] Confirmar etiquetas humanas en los puertos del nodo.





