import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'pedidos' })
export class PedidoOrmEntity {
  @PrimaryColumn({ name: 'id_pedido', type: 'integer' })
  idPedido!: number;

  @Column({ name: 'num_guia', type: 'varchar', length: 64 })
  numGuia!: string;

  @Column({ name: 'fk_tipo_pedido', type: 'integer' })
  fkTipoPedido!: number;

  @Column({ name: 'fk_usuario_solicitud', type: 'integer' })
  fkUsuarioSolicitud!: number;

  @Column({ name: 'fk_usuario_recolector', type: 'integer', nullable: true })
  fkUsuarioRecolector!: number | null;

  @Column({ name: 'fk_usuario_repartidor', type: 'integer', nullable: true })
  fkUsuarioRepartidor!: number | null;

  @Column({ name: 'fk_metodo_recepcion', type: 'integer' })
  fkMetodoRecepcion!: number;

  @Column({ name: 'fk_paquete', type: 'integer' })
  fkPaquete!: number;

  @Column({ name: 'fk_direccion', type: 'integer' })
  fkDireccion!: number;

  @Column({ name: 'fk_estado_pedido', type: 'integer' })
  fkEstadoPedido!: number;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
