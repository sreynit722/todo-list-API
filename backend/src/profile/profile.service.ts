import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile, toProfile, UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly users: UsersService) {}

  async get(userId: number): Promise<Profile> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Account not found');
    return toProfile(user);
  }

  async update(userId: number, dto: UpdateProfileDto): Promise<Profile> {
    const changes: Partial<Profile> = {};
    if (dto.username !== undefined) changes.username = dto.username;
    if (dto.displayName !== undefined) changes.displayName = dto.displayName;
    if (dto.email !== undefined) changes.email = dto.email.toLowerCase();
    return toProfile(await this.users.updateProfile(userId, changes));
  }
}
