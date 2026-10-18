import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

const PROFILE_ID = 1;

@Injectable()
export class ProfileService implements OnModuleInit {
  constructor(
    @InjectRepository(Profile) private readonly repo: Repository<Profile>,
  ) {}

  // Create the default profile once; does nothing if it already exists.
  async onModuleInit() {
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({
        id: PROFILE_ID,
        username: 'nex',
        displayName: 'NEx',
        email: 'nex@example.com',
      })
      .orIgnore()
      .execute();
  }

  get(): Promise<Profile> {
    return this.repo.findOneByOrFail({ id: PROFILE_ID });
  }

  async update(dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.get();
    this.repo.merge(profile, dto);
    return this.repo.save(profile);
  }
}
