import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TipoDocumentoOrmEntity } from './tipo-documento.orm-entity';

@Entity({ name: 'usuarios' })
export class UsuarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario!: number;

  /** UUID de Supabase Auth (`sub` del JWT). */
  @Column({ name: 'auth_user_id', type: 'uuid', unique: true })
  authUserId!: string;

  @Column({ type: 'varchar', length: 120 })
  nombres!: string;

  @Column({ type: 'varchar', length: 120 })
  apellidos!: string;

  @ManyToOne(() => TipoDocumentoOrmEntity, { nullable: false })
  @JoinColumn({ name: 'fk_tipo_documento' })
  tipoDocumento!: TipoDocumentoOrmEntity;

  @Column({ type: 'varchar', length: 32 })
  documento!: string;

  @Column({ type: 'varchar', length: 254 })
  correo!: string;

  @Column({ type: 'varchar', length: 32 })
  telefono!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
