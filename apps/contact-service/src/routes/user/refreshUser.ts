import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserNotFoundError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect} from 'effect'
import {contactActiveWindowDaysConfig} from '../../configs'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {reportUserRefresh} from '../../metrics'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {notifyOthersAboutNewUserForked} from '../contacts/utils/notifyOthersAboutNewUser'

const isUserInactive = ({
  refreshedAt,
  activeWithinDays,
}: {
  refreshedAt: Date
  activeWithinDays: number
}): boolean => {
  if (activeWithinDays === -1) return false

  const activeAfter = new Date()
  activeAfter.setHours(0, 0, 0, 0)
  activeAfter.setDate(activeAfter.getDate() - activeWithinDays)

  return refreshedAt < activeAfter
}

export const refreshUser = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'refreshUser',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          yield* _(reportUserRefresh())
          const userDb = yield* _(UserDbService)
          const contactDb = yield* _(ContactDbService)
          const contactActiveWindowDays = yield* _(
            contactActiveWindowDaysConfig
          )

          const existingUser = yield* _(
            userDb.findUserByPublicKeyAndHash({
              hash: security.serverHash,
              publicKey: security.publicKey,
            }),
            Effect.flatten,
            Effect.catchTag('NoSuchElementException', () =>
              Effect.fail(new UserNotFoundError())
            )
          )

          const wasInactiveBeforeRefresh = isUserInactive({
            refreshedAt: existingUser.refreshedAt,
            activeWithinDays: contactActiveWindowDays,
          })

          yield* _(
            userDb.updateRefreshUser({
              publicKey: security.publicKey,
              hash: security.serverHash,
              clientVersion: req.headers.clientVersionOrNone,
              countryPrefix: req.headers.prefixOrNone,
              appSource: req.headers.appSourceOrNone,
              vexlNotificationToken: req.payload.vexlNotificationToken,
              refreshedAt: new Date(),
              publicKeyV2: security.publicKeyV2,
            })
          )

          const importedHashes = wasInactiveBeforeRefresh
            ? yield* _(
                contactDb.findContactsByHashFrom(security.serverHash),
                Effect.map(Array.map((one) => one.hashTo))
              )
            : []

          return {
            importedHashes,
            ownerHash: security.serverHash,
          }
        }).pipe(
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(({importedHashes, ownerHash}) =>
            Array.isEmptyReadonlyArray(importedHashes)
              ? Effect.void
              : notifyOthersAboutNewUserForked({
                  importedHashes,
                  ownerHash,
                })
          ),
          Effect.as({})
        )
      ),
      makeEndpointEffect
    )
)
