import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

/** Operator view of a user — never includes passwordHash. */
export class AdminUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty({ nullable: true })
  disabledAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(user: User): AdminUserDto {
    const dto = new AdminUserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.isAdmin = user.isAdmin;
    dto.disabledAt = user.disabledAt;
    dto.createdAt = user.createdAt;
    return dto;
  }
}

export class AdminUserListDto {
  @ApiProperty({ type: [AdminUserDto] })
  items: AdminUserDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  static from(items: User[], total: number, page: number): AdminUserListDto {
    const dto = new AdminUserListDto();
    dto.items = items.map((user) => AdminUserDto.fromEntity(user));
    dto.total = total;
    dto.page = page;
    return dto;
  }
}

export class ConcertStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  cached: number;

  @ApiProperty()
  userSubmitted: number;

  @ApiProperty()
  hidden: number;
}

export class AdminStatsDto {
  @ApiProperty()
  users: number;

  @ApiProperty({ type: ConcertStatsDto })
  concerts: ConcertStatsDto;

  @ApiProperty()
  tripsByStatus: Record<string, number>;

  @ApiProperty()
  bookingsByStatus: Record<string, number>;

  @ApiProperty()
  reviews: number;

  static from(data: {
    users: number;
    concerts: ConcertStatsDto;
    tripsByStatus: Record<string, number>;
    bookingsByStatus: Record<string, number>;
    reviews: number;
  }): AdminStatsDto {
    const dto = new AdminStatsDto();
    dto.users = data.users;
    dto.concerts = data.concerts;
    dto.tripsByStatus = data.tripsByStatus;
    dto.bookingsByStatus = data.bookingsByStatus;
    dto.reviews = data.reviews;
    return dto;
  }
}
