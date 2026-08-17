/** Review of a driver as returned by the API. */
export interface Review {
  id: string;
  tripId: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Payload for POST /trips/:id/reviews. */
export interface CreateReviewRequest {
  rating: number;
  comment: string;
}
