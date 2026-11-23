import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Effect} from 'effect'
import {type SessionV2} from '../brands/Session.brand'
import {loginSessionWithProof} from './session/loginSession'

type AccountContactApi = Pick<ContactApi, 'deleteAccount' | 'deleteUser'>

type DeleteAccountError = Exclude<
  Effect.Effect.Error<ReturnType<ContactApi['deleteAccount']>>,
  {_tag: 'DeleteAccountRouteMissingError' | 'NotFoundError'}
>

const deleteEveryNumber = (
  contactApis: readonly AccountContactApi[]
): Effect.Effect<void> =>
  Effect.forEach(
    contactApis,
    (contactApi) => Effect.ignore(contactApi.deleteUser()),
    {discard: true}
  )

/**
 * Deletes every phone number of the account. Asked through each number, since
 * contact-service deletes nothing through a number the account no longer holds.
 * A contact-service without the delete account route (rolled back) gets every
 * number deleted on its own instead.
 */
export const deleteAccountOnContactService = ({
  session,
  contactApis,
}: {
  session: SessionV2
  contactApis: readonly AccountContactApi[]
}): Effect.Effect<void, CryptoError | DeleteAccountError> =>
  Effect.forEach(
    contactApis,
    (contactApi) =>
      loginSessionWithProof(session).pipe(
        Effect.flatMap(contactApi.deleteAccount)
      ),
    {discard: true}
  ).pipe(
    Effect.catchTags({
      DeleteAccountRouteMissingError: () => deleteEveryNumber(contactApis),
      NotFoundError: () => deleteEveryNumber(contactApis),
    })
  )
