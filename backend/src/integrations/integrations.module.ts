import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SignalAutomationService } from './signal/signal-automation.service';
import { SignalService } from './signal/signal.service';
import { TicketmasterService } from './ticketmaster/ticketmaster.service';

@Module({
  imports: [NotificationsModule],
  providers: [TicketmasterService, SignalService, SignalAutomationService],
  exports: [TicketmasterService, SignalService, SignalAutomationService],
})
export class IntegrationsModule {}
