import { Module } from '@nestjs/common';
import { TicketmasterService } from './ticketmaster/ticketmaster.service';

@Module({
  providers: [TicketmasterService],
  exports: [TicketmasterService],
})
export class IntegrationsModule {}
