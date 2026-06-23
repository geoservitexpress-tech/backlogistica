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

  @Column({ name: 'alto_cm', type: 'double precision', nullable: true })
  altoCm!: number | null;

  @Column({ name: 'ancho_cm', type: 'double precision', nullable: true })
  anchoCm!: number | null;

  @Column({ name: 'largo_cm', type: 'double precision', nullable: true })
  largoCm!: number | null;

  /**
   * Reservado para catálogo futuro de seguros / políticas de responsabilidad.
   * Sin FK hasta que exista el catálogo.
   */
  @Column({ name: 'fk_politica_responsabilidad', type: 'int', nullable: true })
  fkPoliticaResponsabilidad!: number | null;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
