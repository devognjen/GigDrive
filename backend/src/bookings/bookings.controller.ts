import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDto } from './dto/booking.dto';
import { UpdateBookingPaidDto } from './dto/update-booking-paid.dto';
import { BookingDriverGuard } from './guards/booking-driver.guard';
import { BookingPassengerGuard } from './guards/booking-passenger.guard';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Passenger requests seats on a trip (FR-BOOK-01). */
  @Post('trips/:id/bookings')
  @ApiCreatedResponse({ type: BookingDto })
  request(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingDto> {
    return this.bookingsService.request(tripId, user.id, dto);
  }

  /** Passenger lists their own bookings. */
  @Get('bookings/mine')
  @ApiOkResponse({ type: [BookingDto] })
  listMine(@CurrentUser() user: User): Promise<BookingDto[]> {
    return this.bookingsService.listMine(user.id);
  }

  /** Driver lists bookings across all trips they organize. */
  @Get('bookings')
  @ApiOkResponse({ type: [BookingDto] })
  listForDriver(@CurrentUser() user: User): Promise<BookingDto[]> {
    return this.bookingsService.listForDriver(user.id);
  }

  /** Driver accepts a booking (transactional capacity check). */
  @Post('bookings/:id/accept')
  @UseGuards(BookingDriverGuard)
  @ApiOkResponse({ type: BookingDto })
  accept(@Param('id', ParseUUIDPipe) id: string): Promise<BookingDto> {
    return this.bookingsService.accept(id);
  }

  /** Driver rejects a booking. */
  @Post('bookings/:id/reject')
  @UseGuards(BookingDriverGuard)
  @ApiOkResponse({ type: BookingDto })
  reject(@Param('id', ParseUUIDPipe) id: string): Promise<BookingDto> {
    return this.bookingsService.reject(id);
  }

  /** Passenger cancels their own booking. */
  @Post('bookings/:id/cancel')
  @UseGuards(BookingPassengerGuard)
  @ApiOkResponse({ type: BookingDto })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<BookingDto> {
    return this.bookingsService.cancel(id);
  }

  /** Driver marks a booking as paid (informational only). */
  @Patch('bookings/:id/paid')
  @UseGuards(BookingDriverGuard)
  @ApiOkResponse({ type: BookingDto })
  setPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingPaidDto,
  ): Promise<BookingDto> {
    return this.bookingsService.setPaid(id, dto.paid);
  }
}
