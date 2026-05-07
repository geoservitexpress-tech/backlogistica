import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'examples' })
export class ExampleOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
