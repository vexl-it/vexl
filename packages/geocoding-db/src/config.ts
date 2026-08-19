import {makeDatabaseConfig} from '@vexl-next/server-utils/src/commonConfigs'

/**
 * Connection to the standalone geocoding Postgres instance. Deliberately NOT
 * the shared DB_URL/DB_USER/DB_PASSWORD vars used for vexl service databases —
 * the geocoding DB lives on its own Postgres so the monthly OSM ingest and
 * geocoding traffic never compete with vexl user data for resources.
 */
export const geocodingDbConfig = makeDatabaseConfig({
  url: 'GEOCODING_DB_URL',
  username: 'GEOCODING_DB_USER',
  password: 'GEOCODING_DB_PASSWORD',
})
