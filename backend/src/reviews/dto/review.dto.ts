import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';

/**
 * API representation of a review written about a driver (via the trip).
 */
export class ReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ description: 'Display name of the reviewing passenger' })
  authorName: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(review: Review, authorName: string): ReviewDto {
    const dto = new ReviewDto();
    dto.id = review.id;
    dto.tripId = review.tripId;
    dto.authorId = review.authorId;
    dto.authorName = authorName;
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt;
    return dto;
  }
}
