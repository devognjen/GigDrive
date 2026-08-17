import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { MailerService } from './mailer.service';
import { MailTransport } from './mail.transport';
import { RenderedEmail } from './email-templates';

describe('MailerService', () => {
  const user = {
    id: 'user-1',
    email: 'al@example.com',
    firstName: 'Al',
    lastName: 'Rider',
    emailNotifications: true,
  } as User;

  const message: RenderedEmail = {
    subject: 'Trip confirmed: Rammstein in Vienna',
    text: 'Hi Al,\n\nthe trip is confirmed.',
    html: '<p>Hi Al,</p>',
  };

  const context = { eventType: 'TRIP_CONFIRMED', entityId: 'trip-1' };

  const config = {
    get: jest.fn((key: string) =>
      key === 'smtp.from' ? 'GigDrive <no-reply@gigdrive.local>' : undefined,
    ),
  } as unknown as ConfigService;

  let transport: { sendMail: jest.Mock };
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    transport = { sendMail: jest.fn().mockResolvedValue({}) };
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  const createService = (mailTransport: MailTransport | null) =>
    new MailerService(mailTransport, config);

  it('sends mail and logs sent when the user opted in', async () => {
    await createService(transport).sendToUser(user, message, context);

    expect(transport.sendMail).toHaveBeenCalledWith({
      from: 'GigDrive <no-reply@gigdrive.local>',
      to: 'al@example.com',
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '[TRIP_CONFIRMED] sent user=user-1 to=al@example.com',
      ),
    );
  });

  it('does not send and logs skipped when emailNotifications is false', async () => {
    await createService(transport).sendToUser(
      { ...user, emailNotifications: false },
      message,
      context,
    );

    expect(transport.sendMail).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('skipped user=user-1'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('reason=preference_off'),
    );
  });

  it('does not send and logs skipped when SMTP is unconfigured', async () => {
    await createService(null).sendToUser(user, message, context);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('reason=smtp_unconfigured'),
    );
  });

  it('swallows SMTP errors and logs failed', async () => {
    transport.sendMail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      createService(transport).sendToUser(user, message, context),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TRIP_CONFIRMED] failed user=user-1'),
      expect.any(Error),
    );
  });
});
