import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateExampleUseCase } from './application/create-example.use-case';
import { GetExampleByIdUseCase } from './application/get-example-by-id.use-case';
import { ListExamplesUseCase } from './application/list-examples.use-case';
import { EXAMPLE_REPOSITORY } from './example.tokens';
import { ExampleOrmEntity } from './infrastructure/persistence/example.orm-entity';
import { TypeOrmExampleRepository } from './infrastructure/persistence/typeorm-example.repository';
import { ExampleController } from './presentation/http/example.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExampleOrmEntity])],
  controllers: [ExampleController],
  providers: [
    CreateExampleUseCase,
    ListExamplesUseCase,
    GetExampleByIdUseCase,
    {
      provide: EXAMPLE_REPOSITORY,
      useClass: TypeOrmExampleRepository,
    },
  ],
})
export class ExampleModule {}
