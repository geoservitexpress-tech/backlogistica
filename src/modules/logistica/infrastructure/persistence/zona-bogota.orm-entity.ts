import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'zona_bogota' })
export class ZonaBogotaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_zona' })
  idZona!: number;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;
}
