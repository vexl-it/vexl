import {
  type SendBulkNotificationResponse,
  SendBulkNotificationsErrors,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {SendBulkNotificationEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Either, Option} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {issueNotificationsToTokens} from '../../utils/issueNotificationsToTokens'
import {validateAdminToken} from '../clubs/utils/validateAdminToken'

export const sendBulkNotification = Handler.make(
  SendBulkNotificationEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateAdminToken(req.query.adminToken))
        const contactDb = yield* _(ContactDbService)

        const tokens = yield* _(
          contactDb.findNotificationTokensByFilter({
            platform: req.body.filters.platform,
            versionFromIncluded: Option.getOrNull(
              req.body.filters.versionFromIncluded
            ),
            versionToIncluded: Option.getOrNull(
              req.body.filters.versionToIncluded
            ),
          }),
          Effect.map(
            Array.map((one) =>
              // handle edge cases where expo token and firebase token are both present. Use only expo token in that case
              Option.isSome(one.expoToken) && Option.isSome(one.firebaseToken)
                ? {
                    expoToken: one.expoToken,
                    firebaseToken: Option.none(),
                  }
                : one
            )
          ),
          Effect.map(
            Array.filter((one) => {
              if (
                Option.isNone(one.expoToken) &&
                Option.isNone(one.firebaseToken)
              )
                return false

              if (req.body.filters.expo && req.body.filters.fcm) {
                return true
              }

              if (req.body.filters.expo) {
                return Option.isSome(one.expoToken)
              }

              if (req.body.filters.fcm) {
                return Option.isSome(one.firebaseToken)
              }
              return false
            })
          )
        )

        yield* _(Effect.log(`Sending notification to ${tokens.length} users`))

        if (!req.body.dryRun) {
          yield* _(Effect.log('Sending notifications'))
          const result = yield* _(
            issueNotificationsToTokens({
              data: Option.getOrElse(req.body.notification.data, () => ({})),
              notification: {
                body: req.body.notification.body,
                title: req.body.notification.title,
              },
              tokens,
            })
          )

          yield* _(Effect.log(`Sent notifications`, result))

          return {
            sentCount: tokens.length,
            dryRun: false,
            expo: Either.isLeft(result.expo)
              ? {
                  success: 0,
                  failed: tokens.filter((one) => one.expoToken).length,
                }
              : {
                  success: result.expo.right.map((one) => one.status === 'ok')
                    .length,
                  failed: result.expo.right.map((one) => one.status === 'error')
                    .length,
                },
            fcm: Either.isLeft(result.firebase)
              ? {
                  failed: tokens.filter(
                    (one) => !one.expoToken && one.firebaseToken
                  ).length,
                  success: 0,
                }
              : {
                  success: result.firebase.right.map((one) => one.success)
                    .length,
                  failed: result.firebase.right.map((one) => !one.success)
                    .length,
                },
          } satisfies SendBulkNotificationResponse
        }

        return {
          sentCount: tokens.length,
          dryRun: true,
          expo: {
            success: tokens.filter((t) => t.expoToken).length,
            failed: 0,
          },
          fcm: {
            success: tokens.filter((t) => !t.expoToken && t.firebaseToken)
              .length,
            failed: 0,
          },
        } satisfies SendBulkNotificationResponse
      }),
      SendBulkNotificationsErrors
    )
)
