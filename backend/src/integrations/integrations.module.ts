import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OpenMeteoService } from './open-meteo/open-meteo.service';
import { SignalAutomationService } from './signal/signal-automation.service';
import { SignalService } from './signal/signal.service';
import { TicketmasterService } from './ticketmaster/ticketmaster.service';

@Module({
  imports: [NotificationsModule],
  providers: [
    TicketmasterService,
    OpenMeteoService,
    SignalService,
    SignalAutomationService,
  ],
  exports: [
    TicketmasterService,
    OpenMeteoService,
    SignalService,
    SignalAutomationService,
  ],
})
export class IntegrationsModule {}
