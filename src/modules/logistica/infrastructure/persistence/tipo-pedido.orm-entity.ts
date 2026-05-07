import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tipo_pedido' })
export class TipoPedidoOrmEntity {
  @PrimaryColumn({ name: 'id_tipo_pedido', type: 'integer' })
  idTipoPedido!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;
}
