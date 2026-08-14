import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicProfileDto } from './dto/public-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  create(data: Partial<User>): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(data));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Apply only provided fields; phone may explicitly be set to null.
    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.emailNotifications !== undefined) {
      user.emailNotifications = dto.emailNotifications;
    }
    return this.usersRepository.save(user);
  }

  async getPublicProfile(id: string): Promise<PublicProfileDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const dto = new PublicProfileDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    // TODO(feature 09 — reviews): compute from the reviews table once it exists.
    dto.averageRating = null;
    dto.reviewCount = 0;
    return dto;
  }
}
