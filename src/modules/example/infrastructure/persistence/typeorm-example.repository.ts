import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Example } from '../../domain/entities/example.entity';
import { ExampleRepositoryPort } from '../../domain/ports/example.repository.port';
import { ExampleOrmEntity } from './example.orm-entity';
import { exampleToDomain, exampleToOrm } from './example.mapper';

@Injectable()
export class TypeOrmExampleRepository implements ExampleRepositoryPort {
  constructor(
    @InjectRepository(ExampleOrmEntity)
    private readonly repo: Repository<ExampleOrmEntity>,
  ) {}

  async save(entity: Example): Promise<void> {
    await this.repo.save(exampleToOrm(entity));
  }

  async findById(id: string): Promise<Example | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? exampleToDomain(row) : null;
  }

  async findAll(): Promise<Example[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map(exampleToDomain);
  }
}
