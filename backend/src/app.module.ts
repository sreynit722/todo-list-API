import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosModule } from './todos/todos.module';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './common/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Hosting platforms usually give one DATABASE_URL.
        // Locally / in docker-compose we use the separate DB_* values.
        const url = config.get<string>('DATABASE_URL');
        // Most hosted databases require SSL: set DB_SSL=true there.
        const ssl =
          config.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: true }
            : false;

        return {
          type: 'postgres' as const,
          ...(url
            ? { url }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
                username: config.get<string>('DB_USER', 'todo'),
                password: config.get<string>('DB_PASS', 'todo'),
                database: config.get<string>('DB_NAME', 'todo'),
              }),
          ssl,
          autoLoadEntities: true,
          synchronize: config.get<string>('NODE_ENV') !== 'production',
        };
      },
    }),
    UsersModule,
    AuthModule,
    TodosModule,
    ProfileModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
