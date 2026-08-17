export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

/**
 * Narrow send surface used by MailerService so unit tests can inject a mock
 * without constructing a real Nodemailer transporter.
 */
export interface MailTransport {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}
