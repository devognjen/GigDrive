import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { ListTripsDto } from './dto/list-trips.dto';
import { TripDto } from './dto/trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripOwnershipGuard } from './guards/trip-ownership.guard';
import { TripsService } from './trips.service';

@ApiTags('trips')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOkResponse({ type: [TripDto] })
  list(@Query() dto: ListTripsDto): Promise<TripDto[]> {
    return this.tripsService.list(dto);
  }

  @Get('mine')
  @ApiOkResponse({ type: [TripDto] })
  listMine(@CurrentUser() user: User): Promise<TripDto[]> {
    return this.tripsService.listMine(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: TripDto })
  getDetails(@Param('id', ParseUUIDPipe) id: string): Promise<TripDto> {
    return this.tripsService.getDetails(id);
  }

  @Post()
  @ApiCreatedResponse({ type: TripDto })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateTripDto,
  ): Promise<TripDto> {
    return this.tripsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(TripOwnershipGuard)
  @ApiOkResponse({ type: TripDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
  ): Promise<TripDto> {
    return this.tripsService.update(id, dto);
  }

  @Post(':id/confirm')
  @UseGuards(TripOwnershipGuard)
  @ApiOkResponse({ type: TripDto })
  confirm(@Param('id', ParseUUIDPipe) id: string): Promise<TripDto> {
    return this.tripsService.confirm(id);
  }

  @Post(':id/cancel')
  @UseGuards(TripOwnershipGuard)
  @ApiOkResponse({ type: TripDto })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<TripDto> {
    return this.tripsService.cancel(id);
  }
}
