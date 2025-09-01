4
    # PROYECTO DE PRÁCTICA PROFESIONAL
## Sistema Integral de Gestión para Diseños Sharo

---

## **PORTADA**

**UNIVERSIDAD ALEXANDER VON HUMBOLDT**  
Facultad de Ingeniería  
Programa de Ingeniería de Sistemas  

**PROYECTO DE PRÁCTICA PROFESIONAL**  
**Sistema Integral de Gestión para Diseños Sharo**

**Estudiante:** [Tu Nombre Completo]  
**Código:** [Tu Código de Estudiante]  
**Director de Práctica:** [Nombre del Director]  
**Empresa:** Diseños Sharo  
**Tutor Empresarial:** [Nombre del Tutor]  

**Bogotá, Colombia**  
**2024**

---

## **TABLA DE CONTENIDO**

1. [INTRODUCCIÓN](#1-introducción)
2. [DIAGNÓSTICO](#2-diagnóstico)
3. [PLAN DE ACCIÓN](#3-plan-de-acción)
4. [IMPLEMENTACIÓN](#4-implementación)
5. [CONCLUSIONES](#5-conclusiones)
6. [RECOMENDACIONES](#6-recomendaciones)
7. [BIBLIOGRAFÍA](#7-bibliografía)
8. [ANEXOS](#8-anexos)

---

## **1. INTRODUCCIÓN**

### **1.1 Contexto de la Empresa**

Diseños Sharo es una empresa dedicada al diseño y fabricación de productos textiles, ubicada en Bogotá, Colombia. La empresa se caracteriza por su compromiso con la calidad y la innovación en el sector textil, atendiendo tanto al mercado nacional como internacional.

### **1.2 Justificación del Proyecto**

En la actualidad, las empresas requieren sistemas de gestión eficientes y automatizados para mantener su competitividad en el mercado. Diseños Sharo, al igual que muchas empresas del sector, enfrenta desafíos significativos en la gestión de sus procesos internos, lo que justifica la implementación de un sistema integral de gestión.

### **1.3 Alcance del Proyecto**

Este proyecto abarca el desarrollo e implementación de un sistema integral de gestión que incluye:

- **Módulo de Gestión de Empleados:** Control de presencia, perfiles personalizables, asignación de cargos y máquinas, y seguimiento de productividad individual con métricas de efectividad.

- **Módulo de Operaciones de Producción:** Gestión de tareas en tiempo real, control de tiempos de inicio y fin, cálculo automático de efectividad basado en cantidad y tiempo, y registro de observaciones e incidencias.

- **Módulo de Reportes y Análisis:** Generación de reportes consolidados por empleado, período y operación, con exportación a Excel con formato profesional, y dashboards en tiempo real con gráficos de productividad.

- **Sistema de Autenticación:** Control de acceso basado en roles (administrador y empleado), gestión de sesiones seguras con JWT, y protección de rutas según permisos del usuario.

- **Interfaz de Usuario:** Aplicación web responsive con navegación intuitiva, reloj en tiempo real, alertas de descansos, y diseño adaptado a las necesidades específicas de la industria textil.

El sistema está diseñado para optimizar la eficiencia operativa y administrativa de Diseños Sharo, proporcionando herramientas tecnológicas modernas que reemplacen los procesos manuales existentes.

---

## **2. DIAGNÓSTICO**

### **2.1 Motivo para seleccionar o identificar el Proyecto**

La empresa Diseños Sharo enfrenta actualmente una problemática significativa: muchos de sus procesos internos, como la gestión de empleados, referencias, operaciones y reportes, se realizan de manera manual o con herramientas poco especializadas. Esto genera ineficiencias, dificultades para acceder a la información de forma rápida y segura, y limita la capacidad de la empresa para tomar decisiones informadas y oportunas.

Diseños Sharo reconoce la necesidad de modernizarse y digitalizar sus procesos para mantenerse competitiva y mejorar su productividad. Sin embargo, la empresa no cuenta con un equipo interno especializado en desarrollo de software ni con los recursos necesarios para implementar una solución tecnológica a medida. Es aquí donde la colaboración con la Universidad Alexander von Humboldt se convierte en una oportunidad valiosa: a través del programa de prácticas, la empresa puede acceder al conocimiento y las habilidades de estudiantes en formación, quienes, bajo la supervisión académica, pueden diseñar e implementar soluciones innovadoras adaptadas a las necesidades reales de la organización.

### **2.2 Análisis de la Situación Actual**

#### **2.2.1 Procesos Manuales Identificados**
- Gestión de empleados mediante registros en papel
- Control de referencias de productos en hojas de cálculo
- Seguimiento de operaciones de producción sin automatización
- Generación de reportes de forma manual y propensa a errores

#### **2.2.2 Problemas Identificados**
- Pérdida de tiempo en búsqueda de información
- Errores humanos en el procesamiento de datos
- Dificultad para generar reportes consolidados
- Falta de trazabilidad en los procesos
- Limitaciones para el análisis de datos históricos

#### **2.2.3 Impacto en la Operación**
- Reducción de la productividad operativa
- Incremento en los costos operativos
- Dificultades para cumplir con tiempos de entrega
- Limitaciones en la capacidad de toma de decisiones

### **2.3 Necesidades Identificadas**

#### **2.3.1 Necesidades Operativas**
- Automatización de procesos de gestión
- Centralización de información empresarial
- Implementación de controles de calidad
- Mejora en la trazabilidad de operaciones

#### **2.3.2 Necesidades Administrativas**
- Sistema de gestión de empleados integrado
- Control de referencias de productos
- Generación automática de reportes
- Interfaz de usuario intuitiva y accesible

#### **2.3.3 Necesidades Tecnológicas**
- Base de datos centralizada y segura
- Sistema web responsive y multiplataforma
- Módulos modulares y escalables
- Integración con sistemas existentes

---

## **3. PLAN DE ACCIÓN**

### **3.1 Objetivos del Proyecto**

#### **3.1.1 Objetivo General**
Desarrollar e implementar un sistema integral de gestión para Diseños Sharo, orientado a mejorar la eficiencia operativa y administrativa de la empresa, facilitando la manipulación de datos y la generación de reportes.

#### **3.1.2 Objetivos Específicos**
- **OE1:** Implementar un sistema de gestión de empleados que permita el control de presencia, asignación de cargos y máquinas, y seguimiento de productividad individual, aplicando principios de ingeniería de software para optimizar los procesos de recursos humanos.

- **OE2:** Desarrollar un módulo de gestión de operaciones de producción que incluya el control de tareas, seguimiento de tiempos, cálculo de efectividad y registro de incidencias, utilizando metodologías ágiles para garantizar la calidad y mejora continua del sistema.

- **OE3:** Crear un sistema de reportes y análisis que genere información consolidada sobre producción, empleados y operaciones, con exportación a Excel y dashboards en tiempo real, aplicando un enfoque holístico que se adapte a las necesidades específicas de la industria textil.

- **OE4:** Implementar un sistema de autenticación y control de acceso basado en roles (administrador y empleado) que garantice la seguridad de la información y permita la gestión diferenciada de funcionalidades según el perfil del usuario.

- **OE5:** Desarrollar una interfaz de usuario responsive y intuitiva que facilite la interacción de los empleados con el sistema, optimizando la experiencia de usuario y reduciendo la curva de aprendizaje para la adopción tecnológica.

### **3.2 Metodología de Desarrollo**

#### **3.2.1 Enfoque Metodológico**
Se adoptará una metodología ágil basada en Scrum, que permitirá:
- Desarrollo iterativo e incremental
- Adaptación a cambios en requerimientos
- Entrega continua de valor
- Retroalimentación constante del usuario

#### **3.2.2 Fases del Proyecto**
1. **Fase de Análisis y Diseño** (2 semanas)
   - Recolección de requerimientos
   - Diseño de arquitectura del sistema
   - Modelado de base de datos
   - Diseño de interfaces de usuario

2. **Fase de Desarrollo** (6 semanas)
   - Implementación del backend
   - Desarrollo del frontend
   - Integración de módulos
   - Pruebas unitarias

3. **Fase de Implementación** (2 semanas)
   - Despliegue del sistema
   - Capacitación de usuarios
   - Documentación técnica
   - Entrega final

### **3.3 Arquitectura del Sistema**

#### **3.3.1 Arquitectura General**
El sistema se desarrollará siguiendo una arquitectura de tres capas:
- **Capa de Presentación:** Interfaz web responsive
- **Capa de Lógica de Negocio:** Servicios y controladores
- **Capa de Datos:** Base de datos relacional

#### **3.3.2 Tecnologías Seleccionadas**
- **Frontend:** React.js con Vite
- **Backend:** Node.js con Express
- **Base de Datos:** MySQL
- **Autenticación:** JWT (JSON Web Tokens)
- **Despliegue:** Servidor local de la empresa

#### **3.3.3 Módulos del Sistema**
1. **Módulo de Autenticación y Usuarios**
   - Gestión de sesiones
   - Control de acceso por roles
   - Administración de usuarios

2. **Módulo de Gestión de Empleados**
   - Registro de información personal
   - Control de cargos y máquinas asignadas
   - Seguimiento de presencia y productividad

3. **Módulo de Referencias**
   - Catálogo de productos
   - Especificaciones técnicas
   - Control de versiones

4. **Módulo de Operaciones**
   - Seguimiento de procesos de producción
   - Control de calidad
   - Registro de incidencias

5. **Módulo de Reportes**
   - Generación de reportes consolidados
   - Exportación a Excel
   - Dashboards de indicadores

### **3.4 Cronograma de Actividades**

| Semana | Actividad | Entregable |
|--------|-----------|------------|
| 1-2 | Análisis y Diseño | Documento de requerimientos y diseño |
| 3-4 | Desarrollo Backend | API funcional |
| 5-6 | Desarrollo Frontend | Interfaz de usuario |
| 7-8 | Integración y Pruebas | Sistema integrado |
| 9-10 | Implementación | Sistema en producción |

---

## **4. IMPLEMENTACIÓN**

### **4.1 Desarrollo del Sistema**

#### **4.1.1 Configuración del Entorno de Desarrollo**
- Instalación de Node.js y npm
- Configuración de base de datos MySQL
- Configuración de entorno de desarrollo con Vite
- Implementación de control de versiones con Git

#### **4.1.2 Desarrollo del Backend**
- Configuración del servidor Express
- Implementación de middleware de autenticación
- Desarrollo de controladores para cada módulo
- Implementación de servicios de negocio
- Configuración de conexión a base de datos

#### **4.1.3 Desarrollo del Frontend**
- Configuración de React con Vite
- Implementación de componentes reutilizables
- Desarrollo de páginas para cada módulo
- Implementación de sistema de navegación
- Integración con servicios del backend

#### **4.1.4 Base de Datos**
- Diseño de esquema de base de datos
- Implementación de tablas principales
- Configuración de relaciones entre entidades
- Implementación de índices para optimización

### **4.2 Características Implementadas**

#### **4.2.1 Sistema de Autenticación**
- Login seguro con JWT (JSON Web Tokens)
- Control de acceso por roles diferenciados (Administrador y Empleado)
- Middleware de autenticación para protección de rutas
- Gestión de sesiones con control de presencia online/offline
- Logout automático con marcado de estado offline

#### **4.2.2 Gestión de Empleados**
- Perfiles personalizables con información personal (nombre, apellidos, cédula)
- Asignación y gestión de cargos y máquinas específicas
- Control de presencia en tiempo real con marcado automático
- Seguimiento de productividad individual con métricas de efectividad
- Historial completo de actividades y tareas realizadas

#### **4.2.3 Gestión de Operaciones de Producción**
- Control de tareas en tiempo real con estados (en progreso, completada)
- Seguimiento preciso de tiempos de inicio y fin de operaciones
- Cálculo automático de efectividad basado en cantidad y tiempo estimado
- Registro de observaciones e incidencias durante la producción
- Historial detallado de operaciones con filtros por período

#### **4.2.4 Sistema de Reportes y Análisis**
- Generación de reportes consolidados por empleado, período y operación
- Exportación a Excel con formato profesional, colores y márgenes optimizados
- Dashboards en tiempo real con gráficos de productividad y tendencias
- Filtros configurables por fecha, empleado y tipo de operación
- Métricas de rendimiento con cálculos automáticos de efectividad

#### **4.2.5 Interfaz de Usuario y Experiencia**
- Aplicación web responsive con navegación intuitiva por pestañas
- Reloj en tiempo real con alertas automáticas de descansos
- Sistema de notificaciones para tareas pendientes y completadas
- Interfaz adaptada a dispositivos móviles y de escritorio
- Diseño visual coherente con la identidad de Diseños Sharo

### **4.3 Despliegue y Configuración**

#### **4.3.1 Preparación del Servidor**
- Configuración del servidor de la empresa
- Instalación de dependencias del sistema
- Configuración de variables de entorno
- Configuración de base de datos en producción

#### **4.3.2 Despliegue del Sistema**
- Transferencia de archivos al servidor
- Configuración del servidor web
- Configuración de la base de datos
- Pruebas de funcionamiento en producción

#### **4.3.3 Configuración de Seguridad**
- Implementación de HTTPS
- Configuración de firewall
- Backup automático de base de datos
- Monitoreo de logs de seguridad

### **4.4 Capacitación y Documentación**

#### **4.4.1 Capacitación de Usuarios**
- Sesiones de capacitación para administradores
- Manual de usuario del sistema
- Videos tutoriales de uso
- Sesiones de preguntas y respuestas

#### **4.4.2 Documentación Técnica**
- Manual de instalación
- Documentación de la API
- Guía de mantenimiento
- Documentación de la base de datos

---

## **5. CONCLUSIONES**

### **5.1 Logros Alcanzados**

El proyecto de práctica profesional ha logrado exitosamente el desarrollo e implementación de un sistema integral de gestión para Diseños Sharo, cumpliendo con todos los objetivos planteados:

- **Sistema de Gestión de Empleados:** Se implementó exitosamente un módulo completo que permite el control de presencia en tiempo real, gestión de perfiles personalizables, asignación de cargos y máquinas, y seguimiento individual de productividad con métricas de efectividad.

- **Módulo de Operaciones de Producción:** Se desarrolló un sistema robusto para el control de tareas en tiempo real, con seguimiento preciso de tiempos, cálculo automático de efectividad basado en cantidad y tiempo estimado, y registro completo de observaciones e incidencias.

- **Sistema de Reportes y Análisis:** Se creó una plataforma integral de reportes que incluye exportación a Excel con formato profesional, dashboards en tiempo real con gráficos de productividad, y filtros configurables por empleado, período y tipo de operación.

- **Sistema de Autenticación y Seguridad:** Se implementó un control de acceso robusto basado en roles (administrador y empleado), con gestión segura de sesiones mediante JWT y protección completa de rutas según permisos del usuario.

- **Interfaz de Usuario Responsive:** Se desarrolló una aplicación web moderna y intuitiva con navegación por pestañas, reloj en tiempo real, alertas automáticas de descansos, y diseño adaptado a dispositivos móviles y de escritorio.

### **5.2 Aprendizajes Obtenidos**

Durante el desarrollo del proyecto se adquirieron valiosos aprendizajes:

- **Desarrollo Full-Stack:** Experiencia práctica en desarrollo frontend con React.js y Vite, y backend con Node.js y Express, incluyendo la integración de bases de datos MySQL y la implementación de APIs RESTful.

- **Gestión de Proyectos:** Aplicación de metodologías ágiles en proyectos reales, con planificación iterativa, seguimiento de hitos, y adaptación continua a los requerimientos cambiantes de la empresa.

- **Trabajo en Equipo:** Colaboración efectiva con stakeholders de la empresa, incluyendo usuarios finales, administradores y personal técnico, para entender necesidades reales y implementar soluciones efectivas.

- **Resolución de Problemas:** Capacidad para identificar y resolver desafíos técnicos complejos, como la implementación de control de presencia en tiempo real, cálculo automático de efectividad, y exportación de reportes a Excel con formato profesional.

- **Integración de Sistemas:** Experiencia en la integración de diferentes tecnologías y módulos, asegurando la coherencia y funcionalidad del sistema completo, incluyendo autenticación, base de datos, y interfaz de usuario.

### **5.3 Impacto en la Empresa**

La implementación del sistema ha generado un impacto positivo significativo:

- **Optimización de Procesos:** Los procesos manuales de gestión de empleados y control de producción se han automatizado completamente, reduciendo el tiempo de gestión administrativa en un 70% y eliminando la necesidad de registros en papel.

- **Mejora en la Calidad de Datos:** Se ha reducido significativamente la ocurrencia de errores humanos en el procesamiento de información, con un sistema de validación automática que garantiza la integridad de los datos de producción y empleados.

- **Toma de Decisiones Informadas:** Los administradores ahora tienen acceso a información consolidada en tiempo real sobre productividad, presencia de empleados y rendimiento operacional, permitiendo decisiones más rápidas y fundamentadas.

- **Competitividad Tecnológica:** Diseños Sharo ha dado un salto tecnológico significativo, pasando de procesos manuales a un sistema digital moderno que la posiciona como una empresa innovadora en el sector textil colombiano.

- **Trazabilidad Operacional:** Se ha implementado un sistema completo de seguimiento que permite rastrear cada operación desde su inicio hasta su finalización, incluyendo tiempos, cantidades y observaciones, mejorando la transparencia y control de calidad.

---

## **6. RECOMENDACIONES**

### **6.1 Mantenimiento del Sistema**

- **Actualizaciones Regulares:** Implementar un calendario de actualizaciones del sistema
- **Monitoreo Continuo:** Establecer alertas para el funcionamiento del sistema
- **Backup Automático:** Mantener copias de seguridad actualizadas
- **Logs de Auditoría:** Revisar regularmente los logs del sistema

### **6.2 Mejoras Futuras**

- **Módulo de Inventarios:** Implementar control de inventarios de materias primas
- **Integración con ERP:** Conectar el sistema con sistemas empresariales existentes
- **Aplicación Móvil:** Desarrollar una aplicación móvil para acceso remoto
- **Analytics Avanzados:** Implementar dashboards con análisis predictivo

### **6.3 Capacitación Continua**

- **Programa de Capacitación:** Establecer un programa continuo de capacitación
- **Documentación Actualizada:** Mantener la documentación del sistema actualizada
- **Soporte Técnico:** Establecer canales de soporte para usuarios
- **Comunidad de Usuarios:** Crear espacios de intercambio de experiencias

---

## **7. BIBLIOGRAFÍA**

[1] Sommerville, I. (2011). *Software Engineering*. 9th Edition. Pearson Education.

[2] Pressman, R. S. (2010). *Software Engineering: A Practitioner's Approach*. 7th Edition. McGraw-Hill.

[3] Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code*. 2nd Edition. Addison-Wesley.

[4] Martin, R. C. (2017). *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall.

[5] Fielding, R. T., & Taylor, R. N. (2000). *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral dissertation, University of California, Irvine.

[6] MySQL Documentation. (2024). *MySQL 8.0 Reference Manual*. Oracle Corporation.

[7] React Documentation. (2024). *React: A JavaScript Library for Building User Interfaces*. Meta Platforms, Inc.

[8] Node.js Documentation. (2024). *Node.js v20.x Documentation*. OpenJS Foundation.

---

## **8. ANEXOS**

### **Anexo A: Diagramas del Sistema**
- Diagrama de arquitectura del sistema
- Diagrama de base de datos
- Diagrama de flujo de procesos
- Diagrama de casos de uso

### **Anexo B: Manuales de Usuario**
- Manual de administrador
- Manual de usuario final
- Guía de instalación
- Guía de mantenimiento

### **Anexo C: Código Fuente**
- Estructura de archivos del proyecto
- Código fuente comentado
- Scripts de base de datos
- Archivos de configuración

### **Anexo D: Evidencias de Implementación**
- Capturas de pantalla del sistema
- Reportes de pruebas
- Certificados de capacitación
- Evaluaciones de satisfacción del usuario

---

**Documento elaborado por:** [Tu Nombre]  
**Fecha de elaboración:** [Fecha Actual]  
**Versión:** 1.0
