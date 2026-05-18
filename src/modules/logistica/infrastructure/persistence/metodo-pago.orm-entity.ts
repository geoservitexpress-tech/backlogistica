import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'metodo_pago' })
export class MetodoPagoOrmEntity {
  @PrimaryColumn({ name: 'id_metodo_pago', type: 'int' })
  idMetodoPago!: number;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ type: 'varchar', length: 32 })
  codigo!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
