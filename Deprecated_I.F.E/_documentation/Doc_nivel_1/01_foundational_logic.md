# 🏛️ INDRA OS: Foundational Logic (V3 - Axiomatic Autoprojection)

> **Principio:** El Core define el Schema. El Frontend es el Motor de Proyección.

## 1. Visión: El Intérprete Genérico de Contratos
INDRA no es un panel de administración estático. Es un **Motor de Proyección** capaz de descubrir, interpretar y manipular cualquier capacidad expuesta por el **Orbital Core**, basándose exclusivamente en el Contrato Axiomático.

### El Cambio de Paradigma
*   **Antes**: Programación de componentes específicos por método.
*   **Ahora**: El sistema descubre capacidades y el **Translation Kernel** deduce la interfaz óptima.

## 2. Axiomas Fundamentales

### Axioma 1: Soberanía del Esquema (Schema Sovereignty)
Toda capacidad del sistema nace en el Core con un **Esquema de Contrato**. El Frontend no genera lógica; solo proyecta lo que el Core declara posible.

### Axioma 2: Auto-Morfismo (Auto-Morphism)
La interfaz es el resultado de un cálculo en tiempo real. Si el esquema del Core cambia, la UI se adapta instantáneamente sin tocar código del frontend.

### Axioma 3: Independencia Funcional
El Core es 100% lógico (agnóstico de UI). El Frontend es 100% inteligente (intepreta semántica). El punto de unión es el **Translation Kernel**.

## 3. Arquitectura de Proyección
El sistema opera bajo un principio de **Autodescubrimiento**:

1.  **Handshake**: El frontend solicita el catálogo total de capacidades.
2.  **Sensing**: El `ContractSensing` mapea los contratos a Roles Semánticos conocidos.
3.  **Reflexión**: El `SchemaResolver` asigna componentes de la Presentation Layer basados en el Schema.

## 4. Filosofía "Zero Hardcode"
El objetivo es eliminar la deuda técnica visual.
*   Cero componentes específicos por adaptador.
*   Uso de **Roles Semánticos** para deducir widgets.
*   La complejidad reside en la **Heurística del Traductor**, no en las vistas.
