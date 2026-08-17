export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'gigdrive',
    password: process.env.POSTGRES_PASSWORD ?? 'gigdrive',
    name: process.env.POSTGRES_DB ?? 'gigdrive',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY ?? '',
    baseUrl:
      process.env.TICKETMASTER_BASE_URL ??
      'https://app.ticketmaster.com/discovery/v2',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT ?? '2525', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'GigDrive <no-reply@gigdrive.local>',
  },
  seed: {
    demoPassword: process.env.SEED_DEMO_PASSWORD ?? 'demo1234',
  },
});
