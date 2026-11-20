// Set here instead of in an env file so a developer's local .env cannot change
// what the tests run against.
Object.assign(process.env, {
  ADMIN_TOKEN: 'test-admin-token',
  BACKOFFICE_ORIGIN: 'https://backoffice.test',
  BACKOFFICE_DISABLE_AUTH: 'false',
  DB_HOST: process.env.TEST_DB_HOST ?? 'localhost',
  DB_PORT: process.env.TEST_DB_PORT ?? '5432',
  DB_USER: process.env.TEST_DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? 'root',
})
