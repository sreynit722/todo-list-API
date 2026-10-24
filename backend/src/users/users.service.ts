import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface Profile {
  username: string;
  displayName: string;
  email: string;
}

export const toProfile = (user: User): Profile => ({
  username: user.username,
  displayName: user.displayName,
  email: user.email,
});

const isUniqueViolation = (error: unknown) =>
  (error as { code?: string })?.code === '23505';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  count(): Promise<number> {
    return this.repo.count();
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  // Only place that loads the password hash
  findByEmailWithHash(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(data: {
    email: string;
    displayName: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    try {
      return await this.repo.save(this.repo.create(data));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async updateProfile(id: number, changes: Partial<Profile>): Promise<User> {
    const user = await this.repo.findOneByOrFail({ id });
    this.repo.merge(user, changes);
    try {
      return await this.repo.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('That email is already used by another account');
      }
      throw error;
    }
  }
}
