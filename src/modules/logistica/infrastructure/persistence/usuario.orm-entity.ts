import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'usuarios' })
export class UsuarioOrmEntity {
  @PrimaryColumn({ name: 'id_usuario', type: 'integer' })
  idUsuario!: number;

  @Column({ type: 'varchar', length: 120 })
  nombres!: string;

  @Column({ type: 'varchar', length: 120 })
  apellidos!: string;

  @Column({ name: 'fk_tipo_documento', type: 'integer' })
  fkTipoDocumento!: number;

  @Column({ type: 'varchar', length: 32 })
  documento!: string;

  @Column({ type: 'varchar', length: 254 })
  correo!: string;

  @Column({ type: 'varchar', length: 32 })
  telefono!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
