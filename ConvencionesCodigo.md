# Convenciones del código

## Objetivo

El código está organizado para que un integrante principiante pueda encontrar una función sin conocer toda la arquitectura.

## Nombres

- Carpetas y archivos propios en español.
- Clases, componentes y archivos con PascalCase: `ServicioCaja`, `GenerarBoleta.js`.
- Funciones y variables descriptivas en CamelCase: `CrearSolicitud`, `CodigoInspeccion`.
- No se usan abreviaciones como `proc`, `mgr`, `tmp` o `data` cuando existe un nombre más claro.
- Los nombres obligatorios de herramientas y proveedores se conservan sin traducir.

## Organización

- `Dominio`: estados y reglas puras.
- `Repositorios`: consultas a PostgreSQL.
- `Servicios`: casos de uso y reglas del negocio.
- `Controladores`: entrada y salida HTTP.
- `Integraciones`: CODART, Mercado Pago, GCS, correo y PDF.
- `Validadores`: formatos y límites de entrada.
- `Paginas`: pantallas de React.
- `Componentes`: elementos visuales reutilizables.

## POO controlada

Se usan clases para servicios, repositorios, controladores e integraciones con dependencias. Las utilidades sin estado permanecen como funciones. No se emplean herencias profundas ni patrones abstractos innecesarios.

## Comentarios

- Una frase para explicar una regla que no sea evidente.
- Comentarios extensos solo en FIFO, idempotencia, seguridad o procesos complejos.
- No se comenta una línea cuando su nombre ya explica lo que hace.

## Validaciones

El frontend ayuda al usuario, pero el backend vuelve a validar todo. Ninguna regla de seguridad depende únicamente de React.