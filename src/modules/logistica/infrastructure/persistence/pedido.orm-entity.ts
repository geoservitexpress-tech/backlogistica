import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DestinatarioOrmEntity } from './destinatario.orm-entity';
import { DireccionOrmEntity } from './direccion.orm-entity';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { MetodoPagoOrmEntity } from './metodo-pago.orm-entity';
import { MetodoRecepcionOrmEntity } from './metodo-recepcion.orm-entity';
import { PaqueteOrmEntity } from './paquete.orm-entity';
import { TipoPedidoOrmEntity } from './tipo-pedido.orm-entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';

@Entity({ name: 'pedidos' })
export class PedidoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_pedido' })
  idPedido!: number;

  @Column({ name: 'num_guia', type: 'varchar', length: 64 })
  numGuia!: string;

  @ManyToOne(() => TipoPedidoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_tipo_pedido' })
  tipoPedido!: TipoPedidoOrmEntity;

  @ManyToOne(() => UsuarioOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_usuario_solicitud' })
  usuarioSolicitud!: UsuarioOrmEntity;

  /**
   * Legado `cliente`: muchas BD ya no tienen esta columna. `insert`/`update` en false evita
   * que el INSERT falle con `42703`; si la columna existe y la necesita, quite esos flags.
   */
  @Column({
    name: 'fk_cliente',
    type: 'int',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  fkCliente!: number | null;

  @ManyToOne(() => UsuarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_usuario_recolector' })
  usuarioRecolector!: UsuarioOrmEntity | null;

  @ManyToOne(() => UsuarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_usuario_repartidor' })
  usuarioRepartidor!: UsuarioOrmEntity | null;

  @ManyToOne(() => MetodoRecepcionOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_metodo_recepcion' })
  metodoRecepcion!: MetodoRecepcionOrmEntity;

  @ManyToOne(() => PaqueteOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_paquete' })
  paquete!: PaqueteOrmEntity;

  @ManyToOne(() => DireccionOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_direccion' })
  direccion!: DireccionOrmEntity;

  @ManyToOne(() => EstadoPedidoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_estado_pedido' })
  estadoPedido!: EstadoPedidoOrmEntity;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  /** Monto del envío / cobro en `pedidos` (mismo origen que `paquete.precio` si no hay tarifa aparte). */
  @Column({ name: 'precio', type: 'numeric', precision: 14, scale: 4 })
  precio!: number;

  /** Tarifa de domicilio al crear; se cobra aunque no se complete la entrega. */
  @Column({ name: 'tarifa_envio', type: 'numeric', precision: 14, scale: 4, nullable: true })
  tarifaEnvio!: number | null;

  /** Valor declarado del contenido (NOT NULL en muchas BD). */
  @Column({ name: 'valor_declarado', type: 'numeric', precision: 14, scale: 4 })
  valorDeclarado!: number;

  /** Fecha prevista de entrega (día calendario; al crear se usa el día UTC de `creado_en`). */
  @Column({ name: 'fecha_entrega', type: 'date' })
  fechaEntrega!: Date;

  @Column({ name: 'es_fragil', type: 'boolean', default: false })
  fragil!: boolean;

  @Column({ name: 'pagado_por_remitente', type: 'boolean', nullable: true })
  pagadoPorRemitente!: boolean | null;

  @ManyToOne(() => MetodoPagoOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_metodo_pago' })
  metodoPago!: MetodoPagoOrmEntity | null;

  @Column({ name: 'valor_recaudado', type: 'numeric', precision: 14, scale: 4, nullable: true })
  valorRecaudado!: number | null;

  /**
   * Esquemas sin esta columna en `pedidos`: sin insert/select/update no rompe el SQL.
   * Si la añade en BD, quite `insert`/`update`/`select` en false para persistir el manifiesto.
   */
  @Column({
    name: 'observaciones_manifiesto',
    type: 'text',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  observacionesManifiesto!: string | null;

  @OneToOne(() => DestinatarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_destinatario' })
  destinatario!: DestinatarioOrmEntity | null;

  @ManyToOne(() => DireccionOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_direccion_destino' })
  direccionDestino!: DireccionOrmEntity | null;

  @ManyToOne(() => DestinatarioOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_destinatario_destino' })
  destinatarioDestino!: DestinatarioOrmEntity | null;

  /**
   * Tu ERD no incluye esta columna en `pedidos`. Sin DML/select no rompe el SQL.
   * Si migra `fotos_paquete_urls` (jsonb), quite los `false` para persistir URLs.
   */
  @Column({
    name: 'fotos_paquete_urls',
    type: 'jsonb',
    nullable: true,
    select: false,
    insert: false,
    update: false,
  })
  fotosPaqueteUrls!: string[] | null;
}
