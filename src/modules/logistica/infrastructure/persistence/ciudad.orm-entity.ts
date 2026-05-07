import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ciudad' })
export class CiudadOrmEntity {
  @PrimaryColumn({ name: 'id_ciudad', type: 'integer' })
  idCiudad!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;

  @Column({ name: 'codigo_dane', type: 'varchar', length: 16 })
  codigoDane!: string;
}
