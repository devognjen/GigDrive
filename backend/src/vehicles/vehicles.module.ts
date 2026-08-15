import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleOwnershipGuard } from './guards/vehicle-ownership.guard';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Trip])],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehicleOwnershipGuard],
})
export class VehiclesModule {}
