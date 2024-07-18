import {type PgClientConfig} from '@effect/sql-pg/PgClient'
import {Config} from 'effect'

export const nodeEnvConfig = Config.string('NODE_ENV').pipe(
  Config.withDefault('production'),
  Config.validate({
    message: "NODE_ENV must be one of 'development', or 'production'",
    validation: (x): x is 'production' | 'development' =>
      x === 'development' || x === 'production',
  })
)

export const isRunningInDevConfig = nodeEnvConfig.pipe(
  Config.map((x) => x === 'development')
)

export const clientServerPortConfig = Config.number('PORT')
export const updatesServerPortConfig = Config.number('UPDATES_SERVER_PORT')
export const socketServerPortConfig = Config.number('SOCKET_SERVER_PORT')
export const healthServerPortConfig = Config.option(
  Config.number('HEALTH_PORT')
)
export const dummyDataConfig = Config.boolean('DUMMY_DATA').pipe(
  Config.withDefault(false)
)

export const userDatabaseConfig = Config.unwrap<PgClientConfig>({
  database: Config.string('DB_DATABASE_NAME_USER'),
  host: Config.string('DB_HOST'),
  port: Config.number('DB_PORT'),
  username: Config.string('DB_USER'),
  password: Config.secret('DB_PASSWORD'),
  maxConnections: Config.succeed(1),
})

export const contactDatabaseConfig = Config.unwrap<PgClientConfig>({
  database: Config.string('DB_DATABASE_NAME_CONTACT'),
  host: Config.string('DB_HOST'),
  port: Config.number('DB_PORT'),
  username: Config.string('DB_USER'),
  password: Config.secret('DB_PASSWORD'),
  maxConnections: Config.succeed(1),
})
