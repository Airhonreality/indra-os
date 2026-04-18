# ADR-055: Widgets Invocables y Arquitectura Laminar

## Estatus
Aceptado (v4.0_NEXUS)

## Contexto
Indra OS necesita permitir que aplicaciones externas (Satélites) utilicen sus motores de alta tecnología (Engines) como herramientas de utilidad sin sacrificar la seguridad del núcleo ni aumentar la masa de los satélites. El modelo anterior de API rest-only obligaba a los satélites a reimplementar UIs complejas.

## Decisión
Se implementa un protocolo de **"Invocación de IU Portal"** (`UI_INVOKE`) basado en una **Arquitectura Laminar**:

1.  **Capa Herramientas (Global Tools)**: Motores creativos y de definición (Diseñadores, Editores, Exploradores) son invocables por defecto.
2.  **Capa Núcleo (Core Inner)**: Módulos de configuración y diagnóstico son privados.
3.  **Soberanía de Persistencia**: El satélite controla mediante el flag `persist: boolean` si el trabajo realizado en el portal debe sincronizarse con el Core de Indra o actuar de forma transíente.

## Consecuencias
- **Agnosticismo Total**: Los Motores no saben quién los invoca; solo emiten una "Resonancia" al finalizar.
- **Minimalismo de Satélite**: Un satélite puede invocar un transcodificador de video de 50MB sin tener que incluir una sola librería de video en su bundle local.
- **Seguridad**: La Shell actúa como aduana, interceptando los retornos y validando los permisos del llamador.

## Axiomas Relacionados
- **Axioma de la Ignorancia Útil**: El satélite pide una "Intención Visual", Indra devuelve un "Hecho Atómico".
- **Axioma de la Flecha de Retorno**: Todo portal abierto debe tener un nexo de cierre que libere la memoria y devuelva el control.

---
*Documentado bajo el régimen de Sinceridad Sistémica de Indra OS.*
