import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'departamento' })
export class DepartamentoOrmEntity {
  @PrimaryColumn({ name: 'id_departamento', type: 'integer' })
  idDepartamento!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;

  @Column({ name: 'codigo_dane', type: 'varchar', length: 16 })
  codigoDane!: string;
}
