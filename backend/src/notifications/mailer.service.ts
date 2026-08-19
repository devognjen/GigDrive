import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RenderedEmail } from './email-templates';
import { MAIL_TRANSPORT, MailTransport } from './mail.transport';

export interface MailEventContext {
  eventType: string;
  entityId: string;
}

/**
 * Thin SMTP sender. Honors per-user `emailNotifications`, logs every attempt
 * (sent / skipped / failed), and never throws — trip and booking transitions
 * must not roll back because SMTP is unavailable.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly from: string;

  constructor(
    @Optional()
    @Inject(MAIL_TRANSPORT)
    private readonly transport: MailTransport | null,
    private readonly config: ConfigService,
  ) {
    this.from =
      this.config.get<string>('smtp.from') ??
      'GigDrive <no-reply@gigdrive.local>';
  }

  async sendToUser(
    user: User,
    message: RenderedEmail,
    context: MailEventContext,
  ): Promise<void> {
    if (!user.emailNotifications) {
      this.logAttempt(context, user, 'skipped', 'preference_off');
      return;
    }

    if (!this.transport) {
      this.logAttempt(context, user, 'skipped', 'smtp_unconfigured');
      return;
    }

    try {
      await this.transport.sendMail({
        from: this.from,
        to: user.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      this.logAttempt(context, user, 'sent');
    } catch (error) {
      this.logger.error(
        this.formatLine(context, user, 'failed') +
          ` subject="${message.subject}"`,
        error as Error,
      );
    }
  }

  private logAttempt(
    context: MailEventContext,
    user: User,
    outcome: 'sent' | 'skipped',
    reason?: string,
  ): void {
    const extra = reason ? ` reason=${reason}` : '';
    this.logger.log(this.formatLine(context, user, outcome) + extra);
  }

  private formatLine(
    context: MailEventContext,
    user: User,
    outcome: string,
  ): string {
    return `[${context.eventType}] ${outcome} user=${user.id} to=${user.email} entity=${context.entityId}`;
  }
}
