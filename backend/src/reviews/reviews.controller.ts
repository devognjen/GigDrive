import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { ReviewEligibilityGuard } from './guards/review-eligibility.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** Confirmed passenger reviews the driver after the concert date (FR-REV-01). */
  @Post('trips/:id/reviews')
  @UseGuards(ReviewEligibilityGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiCreatedResponse({ type: ReviewDto })
  create(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviewsService.create(tripId, user.id, dto);
  }

  /** Public list of reviews written about this user as a driver (FR-REV-02). */
  @Public()
  @Get('users/:id/reviews')
  @ApiOkResponse({ type: [ReviewDto] })
  listForDriver(
    @Param('id', ParseUUIDPipe) driverId: string,
  ): Promise<ReviewDto[]> {
    return this.reviewsService.listForDriver(driverId);
  }
}
