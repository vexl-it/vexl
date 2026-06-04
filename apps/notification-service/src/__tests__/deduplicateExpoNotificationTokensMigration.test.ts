import {SqlClient} from '@effect/sql'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, Schema} from 'effect'
import {deduplicateExpoNotificationTokens} from '../services/PostgressDb/migrations/005_deduplicateExpoNotificationTokens'
import {runPromiseInMockedEnvironment} from './utils/runPromiseInMockedEnvironment'

const MigrationRow = Schema.Struct({
  secret: Schema.String,
  expoNotificationToken: Schema.NullOr(ExpoNotificationToken),
  systemVexlToken: Schema.NullOr(Schema.String),
  marketingVexlToken: Schema.NullOr(Schema.String),
  updatedAtText: Schema.String,
})

const IndexExistsRow = Schema.Struct({
  indexExists: Schema.Boolean,
})

describe('deduplicateExpoNotificationTokens migration', () => {
  it('keeps the latest duplicate by updated_at and id without changing vexl tokens', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(sql`
          DROP INDEX IF EXISTS idx_notification_secrets_expo_token_unique
        `)
        yield* _(sql`
          DELETE FROM notification_token_secrets
          WHERE
            secret IN (
              'vexl_nts_migration_dedupe_old',
              'vexl_nts_migration_dedupe_newer_time',
              'vexl_nts_migration_dedupe_newer_id'
            )
        `)
        yield* _(sql`
          INSERT INTO
            notification_token_secrets (
              id,
              secret,
              expo_notification_token,
              client_platform,
              client_version,
              client_app_source,
              client_language,
              created_at,
              updated_at,
              system_vexl_token,
              marketing_vexl_token
            )
          VALUES
            (
              900001,
              'vexl_nts_migration_dedupe_old',
              'ExponentPushToken[migrationDedupe]',
              'ANDROID',
              100,
              'playStore',
              'en',
              '2026-01-01T00:00:00.000Z',
              '2026-01-01T00:00:00.000Z',
              'vexl_nt_migration_old_system',
              'vexl_nt_migration_old_marketing'
            ),
            (
              900002,
              'vexl_nts_migration_dedupe_newer_time',
              'ExponentPushToken[migrationDedupe]',
              'ANDROID',
              100,
              'playStore',
              'en',
              '2026-01-01T00:00:00.000Z',
              '2026-01-02T00:00:00.000Z',
              'vexl_nt_migration_newer_time_system',
              'vexl_nt_migration_newer_time_marketing'
            ),
            (
              900003,
              'vexl_nts_migration_dedupe_newer_id',
              'ExponentPushToken[migrationDedupe]',
              'ANDROID',
              100,
              'playStore',
              'en',
              '2026-01-01T00:00:00.000Z',
              '2026-01-02T00:00:00.000Z',
              'vexl_nt_migration_newer_id_system',
              'vexl_nt_migration_newer_id_marketing'
            )
        `)

        yield* _(deduplicateExpoNotificationTokens)

        const rows = yield* _(
          sql`
            SELECT
              secret,
              expo_notification_token,
              system_vexl_token,
              marketing_vexl_token,
              updated_at::text AS updated_at_text
            FROM
              notification_token_secrets
            WHERE
              secret IN (
                'vexl_nts_migration_dedupe_old',
                'vexl_nts_migration_dedupe_newer_time',
                'vexl_nts_migration_dedupe_newer_id'
              )
            ORDER BY
              secret
          `,
          Effect.flatMap(Schema.decodeUnknown(Schema.Array(MigrationRow)))
        )

        expect(rows).toEqual([
          {
            secret: 'vexl_nts_migration_dedupe_newer_id',
            expoNotificationToken: 'ExponentPushToken[migrationDedupe]',
            systemVexlToken: 'vexl_nt_migration_newer_id_system',
            marketingVexlToken: 'vexl_nt_migration_newer_id_marketing',
            updatedAtText: '2026-01-02 00:00:00',
          },
          {
            secret: 'vexl_nts_migration_dedupe_newer_time',
            expoNotificationToken: null,
            systemVexlToken: 'vexl_nt_migration_newer_time_system',
            marketingVexlToken: 'vexl_nt_migration_newer_time_marketing',
            updatedAtText: '2026-01-02 00:00:00',
          },
          {
            secret: 'vexl_nts_migration_dedupe_old',
            expoNotificationToken: null,
            systemVexlToken: 'vexl_nt_migration_old_system',
            marketingVexlToken: 'vexl_nt_migration_old_marketing',
            updatedAtText: '2026-01-01 00:00:00',
          },
        ])

        const indexRows = yield* _(
          sql`
            SELECT
              to_regclass('idx_notification_secrets_expo_token_unique') IS NOT NULL AS index_exists
          `,
          Effect.flatMap(Schema.decodeUnknown(Schema.Array(IndexExistsRow)))
        )

        expect(indexRows).toEqual([{indexExists: true}])
      })
    )
  })
})
