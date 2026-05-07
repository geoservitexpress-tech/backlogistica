import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'pais' })
export class PaisOrmEntity {
  @PrimaryColumn({ name: 'id_pais', type: 'integer' })
  idPais!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;

  @Column({ name: 'codigo_dane', type: 'varchar', length: 16 })
  codigoDane!: string;
}
