# Despliegue completo de SGL Trujillo

## Resultado esperado

Se publicará una sola dirección de Render. Esa dirección mostrará:

- El frontend React.
- La API Node.js bajo `/api`.
- El estado técnico bajo `/api/health`.

Docker no es necesario para esta ruta.

## 1. Subir el proyecto a GitHub

1. Descomprima el ZIP.
2. Cree en GitHub un repositorio privado o público llamado `SGLTrujillo`.
3. Suba el contenido de la carpeta raíz. `render.yaml`, `Cliente` y `Servidor` deben quedar directamente en la raíz del repositorio.
4. No suba archivos llamados `.env`.
5. Confirme que GitHub muestre `render.yaml` en la página principal del repositorio.

Comandos opcionales desde Git Bash:

```bash
git init
git add .
git commit -m "Entrega inicial SGL Trujillo"
git branch -M main
git remote add origin DIRECCION_DEL_REPOSITORIO
git push -u origin main
```

## 2. Crear PostgreSQL en Neon

1. Regístrese en Neon.
2. Cree un proyecto llamado `SGLTrujillo`.
3. Seleccione la región `AWS US East (N. Virginia)`.
4. Mantenga PostgreSQL en su versión predeterminada.
5. Abra `Connection Details`.
6. Seleccione la conexión `Pooled`.
7. Copie la cadena completa que comienza con `postgresql://` y termina normalmente en `sslmode=require`.
8. Guárdela temporalmente como `URL_BASE_DATOS`.

No ejecute manualmente los archivos SQL. El servicio realizará migraciones y datos iniciales al arrancar.

## 3. Crear el token de CODART

1. Regístrese en el panel de CODART.
2. Genere el token gratuito.
3. Guárdelo como `CODART_TOKEN`.
4. No coloque el token en React ni en GitHub.

Cuando este token exista, las consultas se realizan contra CODART. Los datos internos se conservan únicamente como respaldo para una exposición.

## 4. Preparar Google Cloud Storage

### 4.1 Crear proyecto y bucket

1. Cree un proyecto de Google Cloud llamado `SGL Trujillo Curso`.
2. Active Cloud Storage.
3. Cree un bucket con este nombre:

```text
sgl-trujillo-licencias-planos
```

4. Si Google informa que el nombre global ya está ocupado, use exactamente:

```text
sgl-trujillo-licencias-planos-2026-upao
```

5. Seleccione región `us-east1`.
6. Seleccione clase `Standard`.
7. Active acceso uniforme a nivel de bucket.
8. Active prevención de acceso público.

El nombre finalmente aceptado será el valor de `GCS_NOMBRE_BUCKET`.

### 4.2 Crear cuenta de servicio

1. Abra `IAM y administración` y luego `Cuentas de servicio`.
2. Cree `sgl-trujillo-storage`.
3. Otórguele sobre el bucket el rol `Storage Object Admin`.
4. Cree una clave nueva en formato JSON.
5. Abra el JSON y guarde estos tres valores:

```text
project_id     -> GCS_PROYECTO_ID
client_email   -> GCS_CORREO_CLIENTE
private_key    -> GCS_CLAVE_PRIVADA
```

Para `GCS_CLAVE_PRIVADA`, copie todo el valor, incluyendo `BEGIN PRIVATE KEY` y `END PRIVATE KEY`. Render acepta el valor escapado con `\n`; el código lo convierte automáticamente a saltos reales.

## 5. Preparar Brevo

1. Cree una cuenta gratuita en Brevo.
2. Abra `Senders and IP` y registre el correo de uno de los integrantes como remitente.
3. Confirme el código que Brevo envía a ese correo.
4. Cree una clave API.
5. Guarde:

```text
BREVO_API_KEY=clave creada
CORREO_REMITENTE=correo verificado
```

No se necesita comprar un dominio para esta demostración si el remitente queda verificado.

## 6. Preparar Mercado Pago

1. Ingrese a Mercado Pago Developers.
2. Cree una aplicación llamada `SGL Trujillo`.
3. Abra las credenciales de prueba.
4. Copie el `Access Token` de prueba como `MERCADOPAGO_ACCESS_TOKEN`.
5. La clave del webhook se completará después de obtener la dirección de Render.

El proyecto mantiene `MODO_DEMOSTRACION=true`, por lo que muestra S/ 180.00 y envía a la pasarela el monto mínimo configurado de S/ 1.00.

## 7. Crear el servicio con Render Blueprint

1. Ingrese a Render.
2. Seleccione `New` y luego `Blueprint`.
3. Conecte el repositorio `SGLTrujillo`.
4. Render detectará `render.yaml`.
5. Confirme la creación del servicio `sgl-trujillo`.
6. Complete las variables solicitadas:

| Variable | Valor |
|---|---|
| `URL_BASE_DATOS` | Cadena Pooled de Neon |
| `CODART_TOKEN` | Token gratuito de CODART |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de prueba |
| `MERCADOPAGO_CLAVE_WEBHOOK` | Escriba temporalmente `PENDIENTE` |
| `GCS_PROYECTO_ID` | `project_id` del JSON |
| `GCS_CORREO_CLIENTE` | `client_email` del JSON |
| `GCS_CLAVE_PRIVADA` | `private_key` completo |
| `BREVO_API_KEY` | Clave API de Brevo |
| `CORREO_REMITENTE` | Correo verificado en Brevo |

`CLAVE_JWT` se genera automáticamente. No debe crearla manualmente.

7. Inicie el despliegue.
8. Espere hasta que Render muestre `Live`.
9. Copie la dirección pública asignada, por ejemplo `https://sgl-trujillo.onrender.com`.

El arranque ejecuta automáticamente:

```text
Migraciones -> datos iniciales -> servidor
```

## 8. Terminar el webhook de Mercado Pago

1. Regrese a la aplicación de Mercado Pago.
2. Configure la URL de notificación:

```text
DIRECCION_DE_RENDER/api/pagos/webhook
```

3. Active el evento de pagos.
4. Copie la clave secreta generada por Mercado Pago.
5. En Render abra el servicio, luego `Environment`.
6. Reemplace `MERCADOPAGO_CLAVE_WEBHOOK=PENDIENTE` por la clave real.
7. Guarde los cambios y espere el nuevo despliegue.

La URL de retorno del pago se calcula automáticamente mediante `RENDER_EXTERNAL_URL`; no debe configurarla.

## 9. Comprobación inmediata

Abra:

```text
DIRECCION_DE_RENDER/api/health
```

Debe mostrar:

```text
Estado: OPERATIVO
BaseDatos: CONECTADA
Almacenamiento: GOOGLE_CLOUD_STORAGE
MercadoPago: CONFIGURADO
Correo: BREVO_CONFIGURADO
```

Después abra la dirección de Render sin `/api/health`. Debe aparecer el encabezado:

```text
SGL Trujillo
Sistema de Gestión de Licencias de Funcionamiento
Municipalidad Distrital de Trujillo
```

## 10. Prueba funcional mínima

1. Inicie sesión como administrador.
2. Cierre sesión.
3. Consulte un RUC real de prueba autorizado por el equipo.
4. Cree una solicitud con un PDF pequeño.
5. Compruebe que el archivo se encuentre en el bucket.
6. Cree el checkout de prueba.
7. Compruebe la constancia.
8. Ingrese como administrador y use `Preparar primera visita` en la sección Inspecciones.
9. Ingrese como inspector y procese el resultado.
10. Descargue la licencia.
11. Compruebe el envío en Brevo.

## 11. Antes de exponer

1. Abra la página entre 10 y 15 minutos antes.
2. Abra `/api/health` hasta ver `OPERATIVO`.
3. Ejecute una solicitud de práctica completa.
4. Mantenga a la mano el RUC, DNI, PDF y credenciales de prueba.
5. No modifique variables de entorno durante la exposición.