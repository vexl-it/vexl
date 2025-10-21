import {HttpApiBuilder} from '@effect/platform/index'
import {type SendBulkNotificationResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Either, Option} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {issueNotificationsToTokens} from '../../utils/issueNotificationsToTokens'
import {validateAdminToken} from '../clubs/utils/validateAdminToken'

export const sendBulkNotificationHandler = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Admin',
  'sendBulkNotification',
  ({payload, urlParams}) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(urlParams.adminToken))
      const contactDb = yield* _(ContactDbService)

      const tokens = yield* _(
        contactDb.findNotificationTokensByFilter({
          platform: payload.filters.platform,
          versionFromIncluded: Option.getOrNull(
            payload.filters.versionFromIncluded
          ),
          versionToIncluded: Option.getOrNull(
            payload.filters.versionToIncluded
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

            if (payload.filters.expo && payload.filters.fcm) {
              return true
            }

            if (payload.filters.expo) {
              return Option.isSome(one.expoToken)
            }

            if (payload.filters.fcm) {
              return Option.isSome(one.firebaseToken)
            }
            return false
          })
        )
      )

      yield* _(
        Effect.log(`Sending notification to ${tokens.length} users`, tokens)
      )

      if (!payload.dryRun) {
        yield* _(Effect.log('Sending notifications'))
        const result = yield* _(
          issueNotificationsToTokens({
            data: Option.getOrElse(payload.notification.data, () => ({})),
            notification: {
              body: payload.notification.body,
              title: payload.notification.title,
            },
            tokens,
          })
        )

        yield* _(
          Effect.log(`Sent notifications`, JSON.stringify(result, null, 2))
        )

        return {
          sentCount: tokens.length,
          dryRun: false,
          expo: Either.isLeft(result.expo)
            ? {
                success: 0,
                failed: tokens.filter((one) => one.expoToken).length,
              }
            : {
                success: result.expo.right.filter((one) => one.status === 'ok')
                  .length,
                failed: result.expo.right.filter(
                  (one) => one.status === 'error'
                ).length,
              },
          fcm: Either.isLeft(result.firebase)
            ? {
                failed: tokens.filter(
                  (one) => !one.expoToken && one.firebaseToken
                ).length,
                success: 0,
              }
            : {
                success: result.firebase.right.filter((one) => one.success)
                  .length,
                failed: result.firebase.right.filter((one) => !one.success)
                  .length,
              },
        } satisfies SendBulkNotificationResponse
      }

      return {
        sentCount: tokens.length,
        dryRun: true,
        expo: {
          success: tokens.filter((t) => Option.isSome(t.expoToken)).length,
          failed: 0,
        },
        fcm: {
          success: tokens.filter(
            (t) => !Option.isSome(t.expoToken) && Option.isSome(t.firebaseToken)
          ).length,
          failed: 0,
        },
      } satisfies SendBulkNotificationResponse
    }).pipe(makeEndpointEffect)
)
