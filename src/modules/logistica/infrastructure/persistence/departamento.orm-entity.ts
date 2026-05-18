import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Catálogo de departamento (sin FK a `pais`: el país va en `direccion.fk_pais`). */
@Entity({ name: 'departamento' })
export class DepartamentoOrmEntity {
  @PrimaryColumn({ name: 'id_departamento', type: 'int' })
  idDepartamento!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;

  @Column({ name: 'codigo_dane', type: 'varchar', length: 16 })
  codigoDane!: string;
}
