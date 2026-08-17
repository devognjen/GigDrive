import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { FeaturesDto } from './features.dto';

@ApiTags('features')
@Controller('features')
export class FeaturesController {
  constructor(private readonly config: ConfigService) {}

  /** Feature flags for the Angular UI (chat is gated by FEATURE_CHAT). */
  @Public()
  @Get()
  @ApiOkResponse({ type: FeaturesDto })
  list(): FeaturesDto {
    return {
      chat: this.config.get<boolean>('features.chat') === true,
    };
  }
}
