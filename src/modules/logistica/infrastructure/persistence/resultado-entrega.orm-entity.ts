import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'resultado_entrega' })
export class ResultadoEntregaOrmEntity {
  @PrimaryColumn({ name: 'id_resultado_entrega', type: 'int' })
  idResultadoEntrega!: number;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ type: 'varchar', length: 32 })
  codigo!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
