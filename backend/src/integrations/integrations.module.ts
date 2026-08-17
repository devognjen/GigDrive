import { Module } from '@nestjs/common';
import { SignalService } from './signal/signal.service';
import { TicketmasterService } from './ticketmaster/ticketmaster.service';

@Module({
  providers: [TicketmasterService, SignalService],
  exports: [TicketmasterService, SignalService],
})
export class IntegrationsModule {}
