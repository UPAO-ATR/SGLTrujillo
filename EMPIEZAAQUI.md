# EMPIEZA AQUÍ

## Lo más rápido para reemplazar y desplegar

1. Descomprime esta entrega en una carpeta distinta de `C:\SGLTrujillo`.
2. Abre PowerShell en la carpeta nueva.
3. Ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\InstalarEnRepositorioExistente.ps1 -Destino C:\SGLTrujillo
```

El script:

- Exige que el repositorio actual esté limpio.
- Conserva la versión previa en la rama `version-anterior`.
- Copia esta versión sin tocar `.git` ni `Servidor\.env`.
- Crea el commit.
- Publica en `RepositorioAmigo` y `origin`, si ambos existen.
- Activa el redespliegue de Render mediante el push a `main`.

## Después del push

1. Entra a Render y abre el servicio existente.
2. Espera hasta que muestre `Live`.
3. Abre `https://TUURL.onrender.com/api/health`.
4. Comprueba:

```text
Estado: OPERATIVO
Esquema: sgl_flujo_corregido
Pago: HIBRIDO_DEMOSTRATIVO
```

No ejecutes SQL manualmente. La aplicación crea el esquema, las tablas, los usuarios y los feriados automáticamente.

## Primera operación obligatoria

El cajero no puede tramitar nada hasta abrir caja:

1. `cajero1@sgl.pe / Cajero123!` solicita apertura.
2. `admin@sgl.pe / Admin123!` aprueba la solicitud e indica el fondo inicial.
3. El cajero actualiza su panel y empieza la atención.

## Documentos útiles

- `GuiaDespliegueRapido.md`: despliegue y variables.
- `GuiaDemostracion.md`: exposición completa paso por paso.
- `MatrizCumplimiento.md`: ubicación de cada requisito.
- `Servidor/DocumentacionApi.md`: rutas del backend.
