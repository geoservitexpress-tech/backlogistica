-- Parámetros operativos (sustituyen variables de negocio en `.env`).
-- Ejecutar después de 06-seed-estados-pedido.sql y 11-seed-rol.sql.
-- Tipos: boolean | integer | integer_list | json | text
--
-- Usuarios: NO se insertan aquí. `usuarios.id_usuario` es entero (1, 2, …);
-- el UUID de Supabase Auth va en `usuarios.auth_user_id` (creado con POST /auth/register).
-- En JSON de hubs y pedidos use siempre el entero `id_usuario`, nunca el UUID de Auth.

INSERT INTO public.variable (clave, valor, tipo, descripcion) VALUES
  (
    'CRON_ASIGNAR_REPARTIDORES_ENABLED',
    'true',
    'boolean',
    'Si false, el cron de asignación de repartidores no ejecuta la lógica.'
  ),
  (
    'ASIGNACION_MAX_ENTREGAS_POR_REPARTIDOR_DIA',
    '5',
    'integer',
    'Tope de pedidos asignados por repartidor y por día de fecha_entrega (1–500).'
  ),
  (
    'ASIGNACION_ROL_REPARTIDOR_ID',
    '2',
    'integer',
    'rol.id_rol del rol Repartidor (seed 11).'
  ),
  (
    'PEDIDO_ESTADO_INICIAL_ID',
    '1',
    'integer',
    'estado_pedido al crear pedido (1=Creado).'
  ),
  (
    'ASIGNACION_ESTADO_PEDIDO_ASIGNADO_ID',
    '2',
    'integer',
    'estado_pedido tras asignar repartidor (2=Asignado).'
  ),
  (
    'ASIGNACION_ESTADOS_PEDIDO_ELEGIBLES',
    '1',
    'integer_list',
    'IDs de estado desde los que el cron puede asignar (sin repartidor), separados por coma.'
  ),
  (
    'REPARTIDOR_PEDIDO_ESTADO_ASIGNADO_ID',
    '2',
    'integer',
    'Estado requerido para POST /repartidor/pedidos/{id}/aceptar.'
  ),
  (
    'REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID',
    '3',
    'integer',
    'Estado tras aceptar (3=Recibido por el repartidor).'
  ),
  (
    'REPARTIDOR_PEDIDO_ESTADO_ENTREGADO_ID',
    '5',
    'integer',
    'Estado tras confirmar entrega exitosa o con novedades (5=Entregado).'
  ),
  (
    'ASIGNACION_GEOCODING_NOMINATIM',
    'false',
    'boolean',
    'Geocodificar direcciones sin lat/lng vía Nominatim en la corrida del cron.'
  ),
  (
    'ASIGNACION_NOMINATIM_CONTACT_EMAIL',
    '',
    'text',
    'Email en User-Agent de Nominatim (obligatorio si geocoding=true).'
  ),
  (
    'ASIGNACION_REPARTIDORES_HUBS',
    '[]',
    'json',
    'Hubs repartidor. idUsuario = usuarios.id_usuario (entero). Ej.: [{"idUsuario":2,"lat":4.651,"lng":-74.062,"idCiudad":149}] tras registrar repartidor (rol id 2).'
  ),
  (
    'LIST_PEDIDOS_FECHA_TZ',
    'America/Bogota',
    'text',
    'Zona horaria del filtro GET /pedidos?fecha= (o UTC).'
  ),
  (
    'REGISTER_EMAIL_AUTO_CONFIRM',
    'true',
    'boolean',
    'Supabase Auth: confirmar correo al registrar sin email de verificación.'
  )
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  actualizado_en = now();

-- Verificar: SELECT clave, valor, tipo FROM public.variable ORDER BY clave;
-- Tras registrar repartidor: UPDATE public.variable SET valor = '[{"idUsuario":2,"lat":4.651,"lng":-74.062,"idCiudad":149}]' WHERE clave = 'ASIGNACION_REPARTIDORES_HUBS';
