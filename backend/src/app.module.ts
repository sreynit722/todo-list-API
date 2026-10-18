import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './todos/todos.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'todo'),
        password: config.get<string>('DB_PASS', 'todo'),
        database: config.get<string>('DB_NAME', 'todo'),
        autoLoadEntities: true,
        // Creates/updates tables automatically. Fine for development;
        // use migrations for production.
        synchronize: true,
      }),
    }),
    TodosModule,
    ProfileModule,
  ],
})
export class AppModule {}
