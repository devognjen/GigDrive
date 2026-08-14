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
  seed: {
    demoPassword: process.env.SEED_DEMO_PASSWORD ?? 'demo1234',
  },
});
