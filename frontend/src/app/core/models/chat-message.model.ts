/** Persisted trip-chat message as returned by the API and WebSocket. */
export interface ChatMessage {
  id: string;
  tripId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** ISO 8601 timestamp. */
  sentAt: string;
}
