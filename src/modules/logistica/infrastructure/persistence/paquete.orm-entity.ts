import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'paquete' })
export class PaqueteOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_paquete' })
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
