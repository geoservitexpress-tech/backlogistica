import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { PedidoOrmEntity } from './pedido.orm-entity';

@Entity({ name: 'seguimiento' })
export class SeguimientoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_seguimiento' })
  idSeguimiento!: number;

  @ManyToOne(() => PedidoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_pedido' })
  pedido!: PedidoOrmEntity;

  @ManyToOne(() => EstadoPedidoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_estado' })
  estadoPedido!: EstadoPedidoOrmEntity;

  @Column({ type: 'timestamptz' })
  fecha!: Date;
}
