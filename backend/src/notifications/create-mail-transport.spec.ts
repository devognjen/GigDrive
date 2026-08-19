import { ConfigService } from '@nestjs/config';
import {
  smtpSettingsFromConfig,
  transportOptionsFromSmtp,
} from './create-mail-transport';

function mockConfig(values: Record<string, string | number>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

describe('smtpSettingsFromConfig', () => {
  it('returns null when credentials are missing', () => {
    expect(smtpSettingsFromConfig(mockConfig({}))).toBeNull();
    expect(
      smtpSettingsFromConfig(
        mockConfig({ 'smtp.user': 'u', 'smtp.pass': '' }),
      ),
    ).toBeNull();
  });

  it('returns settings for Mailtrap-style config', () => {
    const settings = smtpSettingsFromConfig(
      mockConfig({
        'smtp.host': 'sandbox.smtp.mailtrap.io',
        'smtp.port': 2525,
        'smtp.user': 'mailtrap-user',
        'smtp.pass': 'mailtrap-pass',
      }),
    );
    expect(settings).toEqual({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      user: 'mailtrap-user',
      pass: 'mailtrap-pass',
    });
  });

  it('returns settings for Brevo-style config', () => {
    const settings = smtpSettingsFromConfig(
      mockConfig({
        'smtp.host': 'smtp-relay.brevo.com',
        'smtp.port': 587,
        'smtp.user': 'login@example.com',
        'smtp.pass': 'brevo-smtp-key',
      }),
    );
    expect(settings).toEqual({
      host: 'smtp-relay.brevo.com',
      port: 587,
      user: 'login@example.com',
      pass: 'brevo-smtp-key',
    });
  });
});

describe('transportOptionsFromSmtp', () => {
  it('uses STARTTLS for Mailtrap port 2525', () => {
    expect(
      transportOptionsFromSmtp({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        user: 'u',
        pass: 'p',
      }),
    ).toEqual({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: false,
      requireTLS: true,
      auth: { user: 'u', pass: 'p' },
    });
  });

  it('uses STARTTLS for Brevo port 587', () => {
    expect(
      transportOptionsFromSmtp({
        host: 'smtp-relay.brevo.com',
        port: 587,
        user: 'u',
        pass: 'p',
      }),
    ).toEqual({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'u', pass: 'p' },
    });
  });

  it('uses implicit TLS for port 465', () => {
    expect(
      transportOptionsFromSmtp({
        host: 'smtp.example.com',
        port: 465,
        user: 'u',
        pass: 'p',
      }),
    ).toEqual({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      requireTLS: false,
      auth: { user: 'u', pass: 'p' },
    });
  });
});
