# SGL Trujillo

## Sistema de Gestión de Licencias de Funcionamiento

**Municipalidad Distrital de Trujillo**

Esta carpeta contiene la primera entrega: la versión literal y demostrativa construida a partir de los tres documentos incluidos en `DocumentosFuente`.

La versión pulida se desarrollará después de validar esta versión. Los únicos cambios aplicados al documento original están registrados en `AjustesJustosYNecesarios.md`, indicando qué requisito o sección resulta afectado.

## Proveedores ya elegidos

No es necesario escoger servicios adicionales:

- Alojamiento web: Render Free, un solo Web Service.
- Base de datos: Neon PostgreSQL Free.
- Consulta de RUC y DNI: CODART Free.
- Pagos: Mercado Pago con credenciales de prueba.
- Archivos privados: Google Cloud Storage.
- Correos: Brevo Free.
- Repositorio y despliegue automático: GitHub.

Las razones y el alcance de cada elección están en `ProveedoresElegidos.md`.

## Tecnologías

- Backend: JavaScript, Node.js y Express.
- Frontend: React, Vite y Tailwind CSS.
- Base de datos: PostgreSQL.
- Pruebas: Vitest.
- Despliegue: Render mediante `render.yaml`.

## Despliegue recomendado

El frontend se construye y el mismo servidor Express lo publica. Por ello, Render crea un solo servicio y no es necesario copiar URLs entre un frontend y un backend separados.

Siga, en este orden:

1. `EMPIEZAAQUI.md`
2. `GuiaDespliegueRender.md`
3. `GuiaDemostracion.md`
4. `InformeVerificacion.md`

## Estructura principal

```text
SGLTrujillo/
├── Cliente/                    Frontend React
├── Servidor/                   Backend Node.js
├── DocumentosFuente/           Requisitos originales
├── EMPIEZAAQUI.md               Orden mínimo para publicar
├── AjustesJustosYNecesarios.md Correcciones aplicadas y requisitos afectados
├── ProveedoresElegidos.md      Servicios definidos para el despliegue
├── GuiaDespliegueRender.md     Publicación completa paso a paso
├── GuiaDemostracion.md         Recorrido para la exposición
├── InformeVerificacion.md      Pruebas ejecutadas
├── render.yaml                 Configuración automática de Render
└── docker-compose.opcional.yml Ejecución local opcional
```

## Inicio local sin Docker

Requiere Node.js 22, npm y PostgreSQL 16 o compatible.

1. Cree una base de datos local llamada `sgl`.
2. Copie `Servidor/.env.ejemplo` como `Servidor/.env`.
3. Revise `URL_BASE_DATOS` en `Servidor/.env`.
4. Copie `Cliente/.env.ejemplo` como `Cliente/.env`.
5. Ejecute desde la raíz:

```bash
npm run instalar
npm --prefix Servidor run preparar
npm run desarrollo
```

6. Abra `http://localhost:5173`.
7. Compruebe `http://localhost:3000/api/health`.

## Inicio local con Docker

Docker es opcional y no se usa en el despliegue recomendado:

```bash
cp Servidor/.env.ejemplo Servidor/.env
docker compose -f docker-compose.opcional.yml up --build
```

La interfaz quedará en `http://localhost:8080`.

## Usuarios iniciales

| Rol | Correo | Contraseña |
|---|---|---|
| Super administrador | `superadmin@sgl.muni.pe` | `SuperAdmin123!` |
| Administrador | `admin@trujillo.pe` | `Admin@123` |
| Inspector | `inspector1@municipalidad.pe` | `inspector123` |
| Cajera | `cajera1@municipalidad.pe` | `cajera123` |

## Datos de respaldo para demostración

- RUC válido de Trujillo: `20481234567`.
- RUC activo fuera de Trujillo: `20503856674`.
- DNI adulto: `71234567` o `72345678`.
- DNI menor de edad: `73456789`.

Cuando `CODART_TOKEN` está configurado, el sistema consulta primero CODART. Los registros locales solo se usan cuando no existe token y `MODO_DEMOSTRACION=true`.

## Comandos útiles

```bash
npm run probar
npm run construir
npm --prefix Servidor run respaldo
npm --prefix Servidor run escenarioPrimeraVisita
npm --prefix Servidor run escenarioSegundaVisita
```

Los dos últimos comandos preparan una exposición sin alterar las reglas productivas de 15 y 30 días.

## Archivos y saltos de línea

Los archivos de texto terminan con exactamente un salto de línea. Es una convención estándar que evita advertencias de Git y no crea una línea funcional adicional. No se dejaron bloques de líneas vacías al final.