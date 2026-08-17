import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ConcertsService } from './concerts.service';
import { ConcertDetailsDto } from './dto/concert-details.dto';
import { ConcertWeatherDto } from './dto/concert-weather.dto';
import { ConcertDto } from './dto/concert.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { SearchConcertsDto } from './dto/search-concerts.dto';

@ApiTags('concerts')
@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Public()
  @Get('search')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: [ConcertDto] })
  search(@Query() dto: SearchConcertsDto): Promise<ConcertDto[]> {
    return this.concertsService.search(dto);
  }

  @Public()
  @Get(':id/weather')
  @ApiOkResponse({ type: ConcertWeatherDto })
  getWeather(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConcertWeatherDto> {
    return this.concertsService.getWeather(id);
  }

  @Public()
  @Get(':id')
  @ApiOkResponse({ type: ConcertDetailsDto })
  getDetails(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConcertDetailsDto> {
    return this.concertsService.getDetails(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: ConcertDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(@Body() dto: CreateConcertDto): Promise<ConcertDto> {
    return this.concertsService.create(dto);
  }
}
