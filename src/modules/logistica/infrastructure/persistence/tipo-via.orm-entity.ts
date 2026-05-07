import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tipo_via' })
export class TipoViaOrmEntity {
  @PrimaryColumn({ name: 'id_tipo_via', type: 'integer' })
  idTipoVia!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;
}
