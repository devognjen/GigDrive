import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * API representation of the authenticated/own user. Never exposes
 * passwordHash or timestamps.
 */
export class UserDto {
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
  emailNotifications: boolean;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.phone = user.phone;
    dto.emailNotifications = user.emailNotifications;
    return dto;
  }
}
