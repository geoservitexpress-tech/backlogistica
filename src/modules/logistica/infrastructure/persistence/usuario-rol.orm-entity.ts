import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'usuario_rol' })
export class UsuarioRolOrmEntity {
  @PrimaryColumn({ name: 'id_usuario', type: 'int' })
  idUsuario!: number;

  @PrimaryColumn({ name: 'id_rol', type: 'int' })
  idRol!: number;
}
