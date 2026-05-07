import { Example } from '../../domain/entities/example.entity';
import { ExampleOrmEntity } from './example.orm-entity';

export function exampleToDomain(row: ExampleOrmEntity): Example {
  return new Example(row.id, row.name, row.createdAt);
}

export function exampleToOrm(entity: Example): ExampleOrmEntity {
  const row = new ExampleOrmEntity();
  row.id = entity.id;
  row.name = entity.name;
  row.createdAt = entity.createdAt;
  return row;
}
