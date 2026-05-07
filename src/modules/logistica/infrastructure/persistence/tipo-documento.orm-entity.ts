import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tipo_documento' })
export class TipoDocumentoOrmEntity {
  @PrimaryColumn({ name: 'id_tipo_documento', type: 'integer' })
  idTipoDocumento!: number;

  @Column({ type: 'varchar', length: 160 })
  nombre!: string;

  @Column({ type: 'varchar', length: 16 })
  abreviacion!: string;
}
