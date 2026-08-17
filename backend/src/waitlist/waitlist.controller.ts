import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
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
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistEntryDto } from './dto/waitlist-entry.dto';
import { WaitlistService } from './waitlist.service';

@ApiTags('waitlist')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  /** Passenger joins the waitlist of a FULL trip (FR-BOOK-05). */
  @Post('trips/:id/waitlist')
  @ApiCreatedResponse({ type: WaitlistEntryDto })
  join(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateWaitlistDto,
  ): Promise<WaitlistEntryDto> {
    return this.waitlistService.join(tripId, user.id, dto);
  }

  /** Passenger leaves the waitlist of a trip. */
  @Delete('trips/:id/waitlist')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Left the waitlist' })
  leave(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) tripId: string,
  ): Promise<void> {
    return this.waitlistService.leave(tripId, user.id);
  }

  /** Passenger lists their own waitlist entries with queue position. */
  @Get('waitlist/mine')
  @ApiOkResponse({ type: [WaitlistEntryDto] })
  listMine(@CurrentUser() user: User): Promise<WaitlistEntryDto[]> {
    return this.waitlistService.listMine(user.id);
  }
}
