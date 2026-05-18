import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { ResultadoEntregaOrmEntity } from './resultado-entrega.orm-entity';
import { SeguimientoOrmEntity } from './seguimiento.orm-entity';

@Entity({ name: 'descripcion_seguimiento' })
export class DescripcionSeguimientoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_descripcion' })
  idDescripcion!: number;

  @ManyToOne(() => SeguimientoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_seguimiento' })
  seguimiento!: SeguimientoOrmEntity;

  @ManyToOne(() => EstadoPedidoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_estado' })
  estadoPedido!: EstadoPedidoOrmEntity;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  fotoUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @ManyToOne(() => ResultadoEntregaOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_resultado_entrega' })
  resultadoEntrega!: ResultadoEntregaOrmEntity | null;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
