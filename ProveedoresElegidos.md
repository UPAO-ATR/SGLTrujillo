# Proveedores elegidos

Las siguientes decisiones ya están incorporadas al código y al despliegue. El equipo no necesita escoger proveedores.

| Necesidad | Proveedor definido | Uso en el proyecto |
|---|---|---|
| Alojamiento | Render Free | Un solo servicio Node.js publica la API y el frontend React. |
| Base de datos | Neon PostgreSQL Free | Base PostgreSQL persistente, región AWS US East, N. Virginia. |
| RUC y DNI | CODART Free | Consulta desde el backend mediante token privado. |
| Pagos | Mercado Pago Sandbox | Checkout y webhook con credenciales de prueba. |
| Planos, constancias y licencias | Google Cloud Storage | Bucket privado en `us-east1` y URLs firmadas. |
| Correo transaccional | Brevo Free | Avisos de inspección, reprogramación y eventos de caja. |
| Código y despliegue | GitHub | Render despliega automáticamente desde el repositorio. |

## Por qué se usa un solo servicio en Render

React se construye durante el despliegue y Express sirve la carpeta `Cliente/dist`. Esto evita:

- Crear dos servicios.
- Configurar CORS entre dos dominios.
- Copiar manualmente la URL del backend al frontend.
- Gastar un segundo servicio gratuito.

Este cambio afecta únicamente el mecanismo de despliegue y la mantenibilidad descrita en RNF-14. No modifica ningún flujo funcional.

## Persistencia

Neon conserva la base de datos. Google Cloud Storage conserva los archivos. El almacenamiento local del servicio Render solo se mantiene como respaldo de demostración y no debe considerarse persistente.

## Costos

El uso previsto para la exposición queda ampliamente dentro de las cuotas gratuitas. Google Cloud puede exigir activar una cuenta de facturación aunque el consumo se mantenga dentro del nivel gratuito. Deben crear una alerta de presupuesto y no habilitar recursos adicionales.