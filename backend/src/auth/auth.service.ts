import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TodosService } from '../todos/todos.service';
import { User } from '../users/entities/user.entity';
import { Profile, toProfile, UsersService } from '../users/users.service';
import { REFRESH_TOKEN_TTL_MS } from './auth.constants';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Profile;
}

const hashRefreshToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

// Compared against when the email is unknown, so login takes the same time
// whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly todos: TodosService,
    private readonly jwt: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const isFirstUser = (await this.users.count()) === 0;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName,
      username: dto.email.split('@')[0].slice(0, 40),
      passwordHash,
    });

    // Tasks created before accounts existed belong to the first person who signs up
    if (isFirstUser) await this.todos.adoptUnownedTodos(user.id);

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmailWithHash(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildResponse(user);
  }

  async refresh(token: string): Promise<AuthResponse> {
    const tokenHash = hashRefreshToken(token);

    const result = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const storedToken = await repository
        .createQueryBuilder('refreshToken')
        .setLock('pessimistic_write')
        .where('refreshToken.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (!storedToken) {
        throw new UnauthorizedException('Your session has expired. Please log in again.');
      }

      if (storedToken.revokedAt || storedToken.expiresAt.getTime() <= Date.now()) {
        await repository.update(
          { familyId: storedToken.familyId },
          { revokedAt: new Date() },
        );
        return null;
      }

      storedToken.revokedAt = new Date();
      await repository.save(storedToken);
      const user = await manager.getRepository(User).findOneBy({ id: storedToken.userId });
      if (!user) {
        await repository.update(
          { familyId: storedToken.familyId },
          { revokedAt: new Date() },
        );
        return null;
      }

      return this.buildResponse(user, manager, storedToken.familyId);
    });

    if (!result) {
      throw new UnauthorizedException('Your session has expired. Please log in again.');
    }
    return result;
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);
      const storedToken = await repository
        .createQueryBuilder('refreshToken')
        .setLock('pessimistic_write')
        .where('refreshToken.tokenHash = :tokenHash', {
          tokenHash: hashRefreshToken(token),
        })
        .getOne();
      if (storedToken) {
        await repository.update(
          { familyId: storedToken.familyId },
          { revokedAt: new Date() },
        );
      }
    });
  }

  private async buildResponse(
    user: User,
    manager?: EntityManager,
    familyId: string = randomUUID(),
  ): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    const refreshToken = randomBytes(32).toString('base64url');
    const repository = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokens;

    await repository.delete({ expiresAt: LessThanOrEqual(new Date()) });
    await repository.save(
      repository.create({
        tokenHash: hashRefreshToken(refreshToken),
        userId: user.id,
        familyId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        revokedAt: null,
      }),
    );

    return { accessToken, refreshToken, user: toProfile(user) };
  }
}
