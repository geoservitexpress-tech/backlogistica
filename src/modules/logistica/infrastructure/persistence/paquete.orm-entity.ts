import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'paquete' })
export class PaqueteOrmEntity {
  @PrimaryColumn({ name: 'id_paquete', type: 'integer' })
  idPaquete!: number;

  @Column({ type: 'varchar', length: 200 })
  nombre!: string;

  @Column({ type: 'double precision' })
  peso!: number;

  @Column({ type: 'double precision' })
  precio!: number;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
