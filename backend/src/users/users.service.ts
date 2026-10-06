import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ReviewsService } from '../reviews/reviews.service';
import { PublicProfileDto } from './dto/public-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly reviewsService: ReviewsService,
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
    const rating = await this.reviewsService.aggregateForDriver(id);
    dto.averageRating = rating.averageRating;
    dto.reviewCount = rating.reviewCount;
    return dto;
  }

  async listForAdmin(
    q: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: User[]; total: number }> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip(page * pageSize)
      .take(pageSize);
    if (q) {
      const term = `%${q.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.email) LIKE :term OR LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term)',
        { term },
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async disable(targetId: string, actorId: string): Promise<User> {
    const user = await this.requireById(targetId);
    if (user.id === actorId) {
      throw new ConflictException('You cannot disable your own account');
    }
    if (user.isAdmin) {
      const remainingAdmins = await this.usersRepository.count({
        where: { isAdmin: true, disabledAt: IsNull(), id: Not(user.id) },
      });
      if (remainingAdmins === 0) {
        throw new ConflictException('Cannot disable the last admin');
      }
    }
    user.disabledAt = new Date();
    return this.usersRepository.save(user);
  }

  async enable(targetId: string): Promise<User> {
    const user = await this.requireById(targetId);
    user.disabledAt = null;
    return this.usersRepository.save(user);
  }

  private async requireById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
