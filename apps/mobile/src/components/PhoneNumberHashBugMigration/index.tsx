import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {contact} from '@vexl-next/rest-api'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {some} from 'fp-ts/lib/Option'
import {useStore} from 'jotai'
import {useEffect, useState} from 'react'
import {Spinner, YStack} from 'tamagui'
import {apiAtom, apiEnv, platform} from '../../api'
import {type Session} from '../../brands/Session.brand'
import {hashPhoneNumber} from '../../state/contacts/utils'
import {sessionAtom} from '../../state/session'
import {version, versionCode} from '../../utils/environment'
import reportError from '../../utils/reportError'

export default function PhoneNumberHashBugMigration({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const [migrationDone, setMigrationDone] = useState(false)
  const store = useStore()

  useEffect(() => {
    const session = store.get(sessionAtom)
    console.log(
      '🫣 PhoneHashBugCheck',
      'Checking if phone hash migration is needed'
    )
    if (session.state !== 'loggedIn') {
      console.log(
        '🫣 PhoneHashBugCheck',
        'User is logged out. No need for migration.'
      )
      setMigrationDone(true)
      return
    }

    const hashByApp = hashPhoneNumber(session.session.phoneNumber)

    if (
      // Fallback if we can not hash phone number. Let's not block the app in that case...
      E.isLeft(hashByApp) ||
      // If the hash is the same. It's all good
      hashByApp.right === session.session.sessionCredentials.hash
    ) {
      console.log('🫣 PhoneHashBugCheck', 'Hash is ok, no need for migration.')
      setMigrationDone(true)
      return
    }
    console.log('🫣 PhoneHashBugCheck', '🚨 Migartion is needed. Migrating')

    const api = store.get(apiAtom)

    Effect.runFork(
      Effect.gen(function* (_) {
        const newHashAndSignature = yield* _(
          api.user.regenerateSessionCredentials({
            myPhoneNumber: session.session.phoneNumber,
          })
        )

        const oldCredentials = session.session.sessionCredentials
        const newCredentials = {
          ...newHashAndSignature,
          publicKey: oldCredentials.publicKey,
        }

        console.log('🫣 PhoneHashBugCheck', 'Got new credentials.')

        const contactApi = contact.api({
          platform,
          clientSemver: version,
          clientVersion: versionCode,
          url: apiEnv.contactMs,
          getUserSessionCredentials: () => newCredentials,
        })

        yield* _(
          contactApi.updateBadOwnerHash({
            newData: {
              hash: newCredentials.hash,
              signature: Schema.decodeSync(EcdsaSignature)(
                newCredentials.signature
              ),
            },
            oldData: {
              hash: Schema.decodeSync(HashedPhoneNumberE)(oldCredentials.hash),
              signature: Schema.decodeSync(EcdsaSignature)(
                oldCredentials.signature
              ),
            },
            publicKey: session.session.privateKey.publicKeyPemBase64,
            removePreviousUser: true,
          })
        )
        console.log('🫣 PhoneHashBugCheck', 'Migrated contacts')

        const newSession: Session = {
          ...session.session,
          sessionCredentials: {
            ...newCredentials,
          },
        }

        store.set(sessionAtom, some(newSession))
        console.log('🫣 PhoneHashBugCheck', 'Updated session.')
      }).pipe(
        Effect.catchAllDefect((e) => {
          // TODO log error
          console.warn(
            '🫣 PhoneHashBugCheck',
            'Bad Error while migrating phone hash'
          )
          reportError(
            'error',
            new Error('Defect error while migrating phone hash'),
            {error: e}
          )
          return Effect.void
        }),
        Effect.match({
          onFailure: (e) => {
            // TODO log,
            console.warn(
              '🫣 PhoneHashBugCheck',
              'Error while migrating phone hash'
            )
            reportError(
              'error',
              new Error('Failure while migrating phone hash'),
              {error: e}
            )
            setMigrationDone(true)
          },
          onSuccess: () => {
            console.log('🫣 PhoneHashBugCheck', 'Phone migrated successfully.')
            setMigrationDone(true)
          },
        })
      )
    )
  }, [store, setMigrationDone])

  if (migrationDone) return <>{children}</>

  return (
    <YStack
      f={1}
      alignContent="center"
      justifyContent="center"
      backgroundColor="$black"
      px="$5"
      gap="$3"
    >
      <Spinner color="$main" size="large"></Spinner>
    </YStack>
  )
}
