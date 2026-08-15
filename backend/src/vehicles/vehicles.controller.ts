import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleDto } from './dto/vehicle.dto';
import { VehicleOwnershipGuard } from './guards/vehicle-ownership.guard';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOkResponse({ type: [VehicleDto] })
  findAll(@CurrentUser() user: User): Promise<VehicleDto[]> {
    return this.vehiclesService.findAllForOwner(user.id);
  }

  @Post()
  @ApiCreatedResponse({ type: VehicleDto })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehiclesService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(VehicleOwnershipGuard)
  @ApiOkResponse({ type: VehicleDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(VehicleOwnershipGuard)
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Vehicle deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }
}
