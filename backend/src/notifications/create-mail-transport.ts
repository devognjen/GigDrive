import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
}

/**
 * Reads SMTP credentials from config. Returns null when user or pass is missing
 * so the app can run without a mail provider (emails are logged as skipped).
 */
export function smtpSettingsFromConfig(
  config: ConfigService,
): SmtpSettings | null {
  const user = config.get<string>('smtp.user') ?? '';
  const pass = config.get<string>('smtp.pass') ?? '';
  if (!user || !pass) {
    return null;
  }
  return {
    host: config.get<string>('smtp.host') ?? 'sandbox.smtp.mailtrap.io',
    port: config.get<number>('smtp.port') ?? 2525,
    user,
    pass,
  };
}

/**
 * Nodemailer options for common SMTP providers (Mailtrap sandbox, Brevo, etc.).
 * Port 465 uses implicit TLS; 587/2525 use STARTTLS.
 */
export function transportOptionsFromSmtp(settings: SmtpSettings) {
  const secure = settings.port === 465;
  return {
    host: settings.host,
    port: settings.port,
    secure,
    requireTLS: !secure,
    auth: { user: settings.user, pass: settings.pass },
  };
}

/** Creates a Nodemailer transporter when SMTP credentials are configured. */
export function createMailTransport(
  config: ConfigService,
): Transporter | null {
  const settings = smtpSettingsFromConfig(config);
  if (!settings) {
    return null;
  }
  return createTransport(transportOptionsFromSmtp(settings));
}
