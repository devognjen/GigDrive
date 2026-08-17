import { ApiProperty } from '@nestjs/swagger';

/** Public feature flags so the UI can hide disabled entry points. */
export class FeaturesDto {
  @ApiProperty({
    description:
      'In-app trip chat (FR-COMM-02). When false, history 404s and the gateway disconnects.',
  })
  chat: boolean;
}
