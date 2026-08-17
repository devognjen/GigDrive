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
    apiKey: (process.env.TICKETMASTER_API_KEY ?? '').trim(),
    baseUrl:
      process.env.TICKETMASTER_BASE_URL ??
      'https://app.ticketmaster.com/discovery/v2',
  },
  openMeteo: {
    baseUrl: (
      process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com'
    ).replace(/\/$/, ''),
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
    // Default on so concert search has cached demo rows without a manual
    // `pnpm seed`. Tests set NODE_ENV=test and skip this. Set SEED_ON_START=false
    // to disable.
    onStart:
      process.env.NODE_ENV !== 'test' && process.env.SEED_ON_START !== 'false',
  },
  features: {
    // Default on so the M12 demo has chat; set FEATURE_CHAT=false to disable
    // without affecting the rest of the app (FR-COMM-02).
    chat: process.env.FEATURE_CHAT !== 'false',
    // Default off: unofficial client and a registered number are required
    // (FR-COMM-03). Set FEATURE_SIGNAL=true to enable group automation.
    signal: process.env.FEATURE_SIGNAL === 'true',
  },
  signal: {
    number: (process.env.SIGNAL_NUMBER ?? '').trim(),
    cliUrl: (process.env.SIGNAL_CLI_URL ?? 'http://signal-cli:8080').replace(
      /\/$/,
      '',
    ),
  },
});
