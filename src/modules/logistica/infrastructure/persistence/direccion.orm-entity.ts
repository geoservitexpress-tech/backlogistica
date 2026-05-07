import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'direccion' })
export class DireccionOrmEntity {
  @PrimaryColumn({ name: 'id_direccion', type: 'integer' })
  idDireccion!: number;

  @Column({ name: 'fk_tipo_via', type: 'integer' })
  fkTipoVia!: number;

  @Column({ name: 'fk_pais', type: 'integer' })
  fkPais!: number;

  @Column({ name: 'fk_departamento', type: 'integer' })
  fkDepartamento!: number;

  @Column({ name: 'fk_ciudad', type: 'integer' })
  fkCiudad!: number;

  @Column({ type: 'varchar', length: 160 })
  zona!: string;

  @Column({ name: 'numero_principal', type: 'varchar', length: 32 })
  numeroPrincipal!: string;

  @Column({ name: 'numero_secundario', type: 'varchar', length: 32 })
  numeroSecundario!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
