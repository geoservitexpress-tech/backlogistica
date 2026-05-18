import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'destinatario' })
export class DestinatarioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_destinatario' })
  idDestinatario!: number;

  @Column({ type: 'varchar', length: 200 })
  nombre!: string;

  @Column({ type: 'varchar', length: 32 })
  telefono!: string;

  @Column({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;
}
