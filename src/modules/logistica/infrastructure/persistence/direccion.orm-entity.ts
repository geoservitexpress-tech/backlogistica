import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CiudadOrmEntity } from './ciudad.orm-entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { PaisOrmEntity } from './pais.orm-entity';
import { TipoViaOrmEntity } from './tipo-via.orm-entity';
import { ZonaBogotaOrmEntity } from './zona-bogota.orm-entity';

@Entity({ name: 'direccion' })
export class DireccionOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_direccion' })
  idDireccion!: number;

  @ManyToOne(() => TipoViaOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_tipo_via' })
  tipoVia!: TipoViaOrmEntity;

  @ManyToOne(() => PaisOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_pais' })
  pais!: PaisOrmEntity;

  @ManyToOne(() => DepartamentoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_departamento' })
  departamento!: DepartamentoOrmEntity;

  @ManyToOne(() => CiudadOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_ciudad' })
  ciudad!: CiudadOrmEntity;

  /** Localidad de Bogotá D.C. (`zona_bogota`); solo cuando `fk_ciudad` = Bogotá. */
  @ManyToOne(() => ZonaBogotaOrmEntity, { nullable: true })
  @JoinColumn({ name: 'fk_zona' })
  zonaBogota!: ZonaBogotaOrmEntity | null;

  /** En BD la columna es `observaciones` (apto, oficina, portería…). */
  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observacionesEntrega!: string | null;

  /**
   * Número (o alfanumérico) de la vía **antes** del `#` en nomenclatura CO
   * (p. ej. `2A` en *Calle 2A # 14B-30*). Las placas tras `#` van en `numero_principal` / `numero_secundario`.
   */
  @Column({ type: 'varchar', length: 160 })
  zona!: string;

  @Column({ name: 'numero_principal', type: 'varchar', length: 32 })
  numeroPrincipal!: string;

  @Column({ name: 'numero_secundario', type: 'varchar', length: 32 })
  numeroSecundario!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
