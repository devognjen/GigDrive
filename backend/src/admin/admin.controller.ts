import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConcertsService } from '../concerts/concerts.service';
import { ConcertDto } from '../concerts/dto/concert.dto';
import { TripDto } from '../trips/dto/trip.dto';
import { TripsService } from '../trips/trips.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AdminService } from './admin.service';
import {
  ListAdminConcertsDto,
  ListAdminTripsDto,
  ListAdminUsersDto,
} from './dto/admin-query.dto';
import { AdminStatsDto, AdminUserDto, AdminUserListDto } from './dto/admin.dto';
import { AdminGuard } from './guards/admin.guard';

export const ADMIN_USERS_PAGE_SIZE = 20;

@ApiTags('admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Authenticated but not an admin' })
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly concertsService: ConcertsService,
    private readonly tripsService: TripsService,
  ) {}

  @Get('stats')
  @ApiOkResponse({ type: AdminStatsDto })
  getStats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOkResponse({ type: AdminUserListDto })
  async listUsers(
    @Query() query: ListAdminUsersDto,
  ): Promise<AdminUserListDto> {
    const page = query.page ?? 0;
    const { items, total } = await this.usersService.listForAdmin(
      query.q,
      page,
      ADMIN_USERS_PAGE_SIZE,
    );
    return AdminUserListDto.from(items, total, page);
  }

  @Post('users/:id/disable')
  @ApiOkResponse({ type: AdminUserDto })
  async disableUser(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminUserDto> {
    const user = await this.usersService.disable(id, actor.id);
    return AdminUserDto.fromEntity(user);
  }

  @Post('users/:id/enable')
  @ApiOkResponse({ type: AdminUserDto })
  async enableUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminUserDto> {
    const user = await this.usersService.enable(id);
    return AdminUserDto.fromEntity(user);
  }

  @Get('concerts')
  @ApiOkResponse({ type: [ConcertDto] })
  listConcerts(@Query() query: ListAdminConcertsDto): Promise<ConcertDto[]> {
    return this.concertsService.listForAdmin({
      userSubmitted: query.userSubmitted,
      hidden: query.hidden,
    });
  }

  @Post('concerts/:id/hide')
  @ApiOkResponse({ type: ConcertDto })
  hideConcert(@Param('id', ParseUUIDPipe) id: string): Promise<ConcertDto> {
    return this.concertsService.setHidden(id, true);
  }

  @Post('concerts/:id/unhide')
  @ApiOkResponse({ type: ConcertDto })
  unhideConcert(@Param('id', ParseUUIDPipe) id: string): Promise<ConcertDto> {
    return this.concertsService.setHidden(id, false);
  }

  @Get('trips')
  @ApiOkResponse({ type: [TripDto] })
  listTrips(@Query() query: ListAdminTripsDto): Promise<TripDto[]> {
    return this.tripsService.listForAdmin(query.status);
  }

  @Post('trips/:id/cancel')
  @ApiOkResponse({ type: TripDto })
  cancelTrip(@Param('id', ParseUUIDPipe) id: string): Promise<TripDto> {
    return this.tripsService.cancel(id);
  }
}
