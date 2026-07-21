# Guía de despliegue rápido

## Ruta recomendada: reutilizar el servicio Render actual

Esta es la ruta más rápida porque ya existen la cuenta de Render, Neon y las credenciales externas.

1. Descomprime esta entrega en una carpeta distinta de `C:\SGLTrujillo`.
2. Abre PowerShell en la carpeta descomprimida.
3. Ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\InstalarEnRepositorioExistente.ps1 -Destino C:\SGLTrujillo
```

El script realiza automáticamente lo siguiente:

- Comprueba que la rama actual sea `main` y que no existan cambios pendientes.
- Crea la rama `version-anterior`.
- Publica el respaldo en los remotos disponibles.
- Sustituye el código sin copiar `.git`, `.env`, `node_modules` ni archivos temporales.
- Crea el commit de la versión corregida.
- Hace push a `RepositorioAmigo` y `origin` cuando existan.
- El push a `main` activa el Auto-Deploy del servicio Render actual.

## Variables de Render

La versión nueva reutiliza las variables anteriores con estos nombres:

```text
NODE_ENV=production
URL_BASE_DATOS=<misma URL de Neon>
CLAVE_JWT=<misma clave larga>
MODO_DEMOSTRACION=true
ZONA_HORARIA=America/Lima
CODART_TOKEN=<token existente>
BREVO_API_KEY=<clave API existente>
CORREO_REMITENTE=<remitente verificado>
NOMBRE_REMITENTE=SGL Trujillo
GCS_NOMBRE_BUCKET=<bucket existente>
GCS_PROYECTO_ID=<proyecto existente>
GCS_CORREO_CLIENTE=<cuenta de servicio existente>
GCS_CLAVE_PRIVADA=<clave privada existente>
```

No es obligatorio editar inmediatamente estas dos variables porque el código usa valores nuevos por defecto:

```text
ESQUEMA_BASE_DATOS=sgl_flujo_corregido
MONTO_COBRO_FLUJO_CORREGIDO=3
```

La variable antigua `MONTO_COBRO_DEMOSTRACION` ya no se utiliza, para evitar que el valor S/1 de la versión anterior cambie el nuevo flujo.

## Comandos de Render

No necesitan cambiar si el servicio anterior ya los tiene:

```text
Build Command:
npm ci --include=dev && npm run instalarProduccion && npm run construir

Start Command:
npm run prepararEIniciar

Health Check Path:
/api/health
```

## Base de datos aislada

La aplicación crea automáticamente el esquema `sgl_flujo_corregido` dentro de la misma base Neon. No borra las tablas del sistema anterior y no se debe ejecutar SQL manualmente.

## Verificación posterior

1. Espera a que Render muestre `Live`.
2. Abre `/api/health`.
3. Confirma `OPERATIVO` y el esquema `sgl_flujo_corregido`.
4. Inicia sesión como cajero.
5. Solicita apertura de caja.
6. Inicia sesión como administrador y apruébala.
7. Recién entonces realiza un trámite.

## Blueprint nuevo, solo si el servicio anterior no puede reutilizarse

En Render selecciona `New > Blueprint`, elige el repositorio y deja que lea `render.yaml`. Esta alternativa crea otra URL y obliga a volver a completar los secretos.
