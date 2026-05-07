import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'rol' })
export class RolOrmEntity {
  @PrimaryColumn({ name: 'id_rol', type: 'integer' })
  idRol!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;
}
